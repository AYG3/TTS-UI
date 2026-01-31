'use client';

/**
 * usePageWordOffsets Hook
 * Computes global word offsets for each page in a PDF document
 * 
 * This enables proper word indexing across multiple pages for TTS sync.
 * Word index 0 is the first word on page 1, and indices continue
 * sequentially through all pages.
 */

import { useState, useEffect, useMemo } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageWordOffsets {
  /** Map of page number to global word offset (start index for that page) */
  offsets: Map<number, number>;
  /** Map of page number to word count on that page */
  wordCounts: Map<number, number>;
  /** Total words across all pages */
  totalWords: number;
  /** Whether offsets are being computed */
  isLoading: boolean;
  /** Get the offset for a specific page */
  getOffset: (pageNumber: number) => number;
  /** Find which page contains a given global word index */
  getPageForWordIndex: (globalIndex: number) => number;
}

// Cache word counts per document
const wordCountCache = new Map<string, Map<number, number>>();

/**
 * Extract word count from a page's text content
 */
async function getPageWordCount(
  doc: PDFDocumentProxy,
  pageNumber: number
): Promise<number> {
  try {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    let wordCount = 0;
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        // Split by whitespace and count non-empty words
        const words = item.str.trim().split(/\s+/).filter(Boolean);
        wordCount += words.length;
      }
    }
    
    return wordCount;
  } catch (error) {
    console.error(`Error getting word count for page ${pageNumber}:`, error);
    return 0;
  }
}

export function usePageWordOffsets(
  document: PDFDocumentProxy | null
): PageWordOffsets {
  const [wordCounts, setWordCounts] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Compute word counts for all pages
  useEffect(() => {
    if (!document) {
      setWordCounts(new Map());
      return;
    }

    const docId = document.fingerprints[0];
    
    // Check cache
    const cached = wordCountCache.get(docId);
    if (cached) {
      setWordCounts(cached);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function computeWordCounts() {
      if (!document) return;

      const counts = new Map<number, number>();
      
      // Process pages in batches for better performance
      const batchSize = 5;
      for (let i = 1; i <= document.numPages; i += batchSize) {
        if (cancelled) return;
        
        const batch = [];
        for (let j = i; j < i + batchSize && j <= document.numPages; j++) {
          batch.push(getPageWordCount(document, j).then(count => ({ page: j, count })));
        }
        
        const results = await Promise.all(batch);
        results.forEach(({ page, count }) => counts.set(page, count));
      }

      if (!cancelled) {
        wordCountCache.set(docId, counts);
        setWordCounts(counts);
        setIsLoading(false);
      }
    }

    computeWordCounts();

    return () => {
      cancelled = true;
    };
  }, [document]);

  // Compute offsets from word counts
  const offsets = useMemo(() => {
    const offsetMap = new Map<number, number>();
    let runningTotal = 0;
    
    // Build offsets sequentially
    const sortedPages = Array.from(wordCounts.keys()).sort((a, b) => a - b);
    for (const page of sortedPages) {
      offsetMap.set(page, runningTotal);
      runningTotal += wordCounts.get(page) ?? 0;
    }
    
    return offsetMap;
  }, [wordCounts]);

  // Total words
  const totalWords = useMemo(() => {
    let total = 0;
    wordCounts.forEach(count => total += count);
    return total;
  }, [wordCounts]);

  // Helper: get offset for a page
  const getOffset = (pageNumber: number): number => {
    return offsets.get(pageNumber) ?? 0;
  };

  // Helper: find page containing a global word index
  const getPageForWordIndex = (globalIndex: number): number => {
    let page = 1;
    let runningTotal = 0;
    
    const sortedPages = Array.from(wordCounts.keys()).sort((a, b) => a - b);
    for (const p of sortedPages) {
      const count = wordCounts.get(p) ?? 0;
      if (globalIndex < runningTotal + count) {
        return p;
      }
      runningTotal += count;
      page = p;
    }
    
    return page;
  };

  return {
    offsets,
    wordCounts,
    totalWords,
    isLoading,
    getOffset,
    getPageForWordIndex,
  };
}

export default usePageWordOffsets;
