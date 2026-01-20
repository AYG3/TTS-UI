'use client';

/**
 * useWordLayout Hook
 * Computes word-level bounding boxes from PDF text geometry
 * 
 * This is the HEAVY LOGIC - isolated for performance:
 * - Extracts text items from pdf.js
 * - Splits text into words
 * - Computes bounding boxes per word
 * - Transforms PDF coordinates to canvas coordinates
 * 
 * Critical: Text layout is treated as IMMUTABLE data
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import type { TextContent, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { WordItem, WordLayoutResult, BoundingBox } from './types';

// Layout cache - keyed by page fingerprint + scale
const layoutCache = new Map<string, WordItem[]>();

function getCacheKey(pageNumber: number, scale: number, docId: string): string {
  return `${docId}:${pageNumber}:${scale.toFixed(3)}`;
}

/**
 * Transform PDF coordinates to canvas coordinates
 * PDF uses bottom-left origin, canvas uses top-left origin
 */
function transformToCanvasCoords(
  transform: number[],
  width: number,
  height: number,
  viewportHeight: number,
  scale: number
): BoundingBox {
  // Transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
  const [a, b, c, d, tx, ty] = transform;
  
  // Apply scale to translation
  const x = tx * scale;
  // Flip Y coordinate (PDF is bottom-up, canvas is top-down)
  const y = viewportHeight - (ty * scale) - (Math.abs(d) * scale);
  
  // Width and height considering rotation/skew
  const scaledWidth = width * scale;
  const scaledHeight = Math.abs(d) * scale;
  
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: scaledWidth,
    height: scaledHeight,
  };
}

/**
 * Split a text item into individual words with computed bounds
 */
function splitTextItemIntoWords(
  item: TextItem,
  viewportHeight: number,
  scale: number,
  globalIndexStart: number,
  pageNumber: number,
  pageWordIndexStart: number
): WordItem[] {
  const text = item.str;
  const words: WordItem[] = [];
  
  // Skip empty strings
  if (!text.trim()) return words;
  
  // Get base bounds for the entire text item
  const baseBounds = transformToCanvasCoords(
    item.transform,
    item.width,
    item.height,
    viewportHeight,
    scale
  );
  
  // Split into words
  const wordMatches = text.matchAll(/\S+/g);
  const totalWidth = item.width * scale;
  const totalChars = text.length;
  
  let wordIndex = 0;
  
  for (const match of wordMatches) {
    const wordText = match[0];
    const startIndex = match.index!;
    
    // Estimate character width (proportional positioning)
    const charsBefore = startIndex;
    const charsInWord = wordText.length;
    
    // Calculate proportional x offset and width
    const xOffset = (charsBefore / totalChars) * totalWidth;
    const wordWidth = (charsInWord / totalChars) * totalWidth;
    
    words.push({
      text: wordText,
      bounds: {
        x: baseBounds.x + xOffset,
        y: baseBounds.y,
        width: Math.max(wordWidth, 1), // Minimum 1px width
        height: baseBounds.height,
      },
      globalIndex: globalIndexStart + wordIndex,
      pageNumber,
      pageWordIndex: pageWordIndexStart + wordIndex,
    });
    
    wordIndex++;
  }
  
  return words;
}

export function useWordLayout(
  page: PDFPageProxy | null,
  scale: number,
  viewportHeight: number,
  globalWordOffset: number = 0
): WordLayoutResult {
  const [state, setState] = useState<WordLayoutResult>({
    words: [],
    isComputing: false,
    error: null,
  });
  
  const computingRef = useRef<string | null>(null);

  // Memoize the computation key
  const cacheKey = useMemo(() => {
    if (!page) return null;
    const docId = (page as any)._transport?._params?.docId || 'unknown';
    return getCacheKey(page.pageNumber, scale, docId);
  }, [page, scale]);

  useEffect(() => {
    if (!page || !cacheKey || viewportHeight <= 0) {
      setState({ words: [], isComputing: false, error: null });
      return;
    }

    // Check cache first
    const cached = layoutCache.get(cacheKey);
    if (cached) {
      // Re-apply global offset if different
      const adjustedWords = cached.map(word => ({
        ...word,
        globalIndex: word.pageWordIndex + globalWordOffset,
      }));
      setState({ words: adjustedWords, isComputing: false, error: null });
      return;
    }

    // Prevent duplicate computation
    if (computingRef.current === cacheKey) return;
    computingRef.current = cacheKey;

    setState(prev => ({ ...prev, isComputing: true, error: null }));

    const computeLayout = async () => {
      try {
        const textContent: TextContent = await page.getTextContent();
        
        // Filter to actual text items
        const textItems = textContent.items.filter(
          (item: any): item is TextItem => 'str' in item && typeof item.str === 'string'
        );

        const allWords: WordItem[] = [];
        let pageWordIndex = 0;

        for (const item of textItems) {
          const itemWords = splitTextItemIntoWords(
            item,
            viewportHeight,
            scale,
            globalWordOffset + pageWordIndex,
            page.pageNumber,
            pageWordIndex
          );
          
          allWords.push(...itemWords);
          pageWordIndex += itemWords.length;
        }

        // Cache the result (with pageWordIndex as base for flexibility)
        const cachedWords = allWords.map(word => ({
          ...word,
          globalIndex: word.pageWordIndex, // Store relative index
        }));
        layoutCache.set(cacheKey, cachedWords);

        if (computingRef.current === cacheKey) {
          setState({
            words: allWords,
            isComputing: false,
            error: null,
          });
        }
      } catch (err) {
        if (computingRef.current === cacheKey) {
          setState({
            words: [],
            isComputing: false,
            error: err instanceof Error ? err : new Error('Failed to compute word layout'),
          });
        }
      }
    };

    computeLayout();
  }, [page, cacheKey, scale, viewportHeight, globalWordOffset]);

  return state;
}

/**
 * Clear layout cache
 */
export function clearLayoutCache(): void {
  layoutCache.clear();
}

export default useWordLayout;
