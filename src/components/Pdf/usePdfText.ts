'use client';

/**
 * usePdfText Hook
 * Extracts raw text content from PDF pages (extract once, reuse)
 * 
 * Features:
 * - Text content caching
 * - Full document text extraction
 * - Per-page text items with transforms
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfTextItem, PageTextContent } from './types';

// Text content cache - keyed by document fingerprint + page number
const textCache = new Map<string, PdfTextItem[]>();
const fullTextCache = new Map<string, PageTextContent[]>();

function getCacheKey(docFingerprint: string, pageNumber: number): string {
  return `${docFingerprint}:${pageNumber}`;
}

interface UsePdfTextState {
  textItems: PdfTextItem[];
  rawText: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Extract text items from a single page
 */
export function usePdfText(page: PDFPageProxy | null): UsePdfTextState {
  const [state, setState] = useState<UsePdfTextState>({
    textItems: [],
    rawText: '',
    isLoading: false,
    error: null,
  });
  
  const loadingRef = useRef<number | null>(null);

  const extractText = useCallback(async (pdfPage: PDFPageProxy) => {
    const pageNumber = pdfPage.pageNumber;
    const docFingerprint = (pdfPage as any)._transport._params.docId || String(pageNumber);
    const cacheKey = getCacheKey(docFingerprint, pageNumber);

    // Check cache
    const cached = textCache.get(cacheKey);
    if (cached) {
      const rawText = cached.map(item => item.str).join(' ');
      setState({
        textItems: cached,
        rawText,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Prevent duplicate loads
    if (loadingRef.current === pageNumber) return;
    loadingRef.current = pageNumber;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const textContent: TextContent = await pdfPage.getTextContent();
      
      // Filter to actual text items (not markers)
      const textItems: PdfTextItem[] = textContent.items
        .filter((item: any): item is TextItem => 'str' in item && typeof item.str === 'string')
        .map((item: TextItem) => ({
          str: item.str,
          dir: item.dir,
          transform: item.transform,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
        }));

      // Cache the result
      textCache.set(cacheKey, textItems);

      const rawText = textItems.map(item => item.str).join(' ');

      if (loadingRef.current === pageNumber) {
        setState({
          textItems,
          rawText,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      if (loadingRef.current === pageNumber) {
        setState({
          textItems: [],
          rawText: '',
          isLoading: false,
          error: err instanceof Error ? err : new Error('Failed to extract text'),
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!page) {
      setState({
        textItems: [],
        rawText: '',
        isLoading: false,
        error: null,
      });
      return;
    }

    extractText(page);
  }, [page, extractText]);

  return state;
}

/**
 * Extract text from all pages of a document
 */
export function useFullDocumentText(
  document: PDFDocumentProxy | null
): {
  pages: PageTextContent[];
  isLoading: boolean;
  error: Error | null;
  totalWords: number;
} {
  const [state, setState] = useState<{
    pages: PageTextContent[];
    isLoading: boolean;
    error: Error | null;
    totalWords: number;
  }>({
    pages: [],
    isLoading: false,
    error: null,
    totalWords: 0,
  });

  const loadingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!document) {
      setState({ pages: [], isLoading: false, error: null, totalWords: 0 });
      return;
    }

    const docFingerprint = document.fingerprints[0];
    
    // Check cache
    const cached = fullTextCache.get(docFingerprint);
    if (cached) {
      const totalWords = cached.reduce((sum, page) => sum + page.words.length, 0);
      setState({ pages: cached, isLoading: false, error: null, totalWords });
      return;
    }

    // Prevent duplicate loads
    if (loadingRef.current === docFingerprint) return;
    loadingRef.current = docFingerprint;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const extractAllPages = async () => {
      try {
        const pages: PageTextContent[] = [];
        let globalWordIndex = 0;

        for (let i = 1; i <= document.numPages; i++) {
          const page = await document.getPage(i);
          const textContent: TextContent = await page.getTextContent();
          
          const textItems = textContent.items
            .filter((item: any): item is TextItem => 'str' in item && typeof item.str === 'string');

          // Split text items into words
          const words: PageTextContent['words'] = [];
          let pageWordIndex = 0;
          
          for (const item of textItems) {
            const itemWords = item.str.trim().split(/\s+/).filter((w: string) => w.length > 0);
            for (const wordText of itemWords) {
              words.push({
                text: wordText,
                bounds: { x: 0, y: 0, width: 0, height: 0 }, // Computed in useWordLayout
                globalIndex: globalWordIndex++,
                pageNumber: i,
                pageWordIndex: pageWordIndex++,
              });
            }
          }

          pages.push({
            pageNumber: i,
            words,
            rawText: textItems.map((item: TextItem) => item.str).join(' '),
          });
        }

        // Cache result
        fullTextCache.set(docFingerprint, pages);

        if (loadingRef.current === docFingerprint) {
          setState({
            pages,
            isLoading: false,
            error: null,
            totalWords: globalWordIndex,
          });
        }
      } catch (err) {
        if (loadingRef.current === docFingerprint) {
          setState({
            pages: [],
            isLoading: false,
            error: err instanceof Error ? err : new Error('Failed to extract document text'),
            totalWords: 0,
          });
        }
      }
    };

    extractAllPages();
  }, [document]);

  return state;
}

/**
 * Clear text caches
 */
export function clearTextCache(): void {
  textCache.clear();
  fullTextCache.clear();
}

export default usePdfText;
