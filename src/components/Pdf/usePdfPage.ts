'use client';

/**
 * usePdfPage Hook
 * Loads and caches individual PDF pages with viewport calculation
 * 
 * Features:
 * - Page-level caching
 * - Viewport computation with scale
 * - Automatic cleanup
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { PdfPageState } from './types';

// Page cache - keyed by document fingerprint + page number
const pageCache = new Map<string, PDFPageProxy>();

function getCacheKey(docFingerprint: string, pageNumber: number): string {
  return `${docFingerprint}:${pageNumber}`;
}

interface UsePdfPageOptions {
  /** Scale factor for rendering (default: 1.5 for good quality) */
  scale?: number;
  /** Container width for auto-scaling */
  containerWidth?: number;
}

export function usePdfPage(
  document: PDFDocumentProxy | null,
  pageNumber: number,
  options: UsePdfPageOptions = {}
): PdfPageState {
  const { scale: fixedScale, containerWidth } = options;
  
  const [state, setState] = useState<PdfPageState>({
    page: null,
    isLoading: false,
    error: null,
    viewport: null,
  });
  
  const loadingRef = useRef<string | null>(null);

  const loadPage = useCallback(async (
    doc: PDFDocumentProxy,
    pageNum: number
  ) => {
    // Validate page number
    if (pageNum < 1 || pageNum > doc.numPages) {
      setState({
        page: null,
        isLoading: false,
        error: new Error(`Invalid page number: ${pageNum}. Document has ${doc.numPages} pages.`),
        viewport: null,
      });
      return;
    }

    const cacheKey = getCacheKey(doc.fingerprints[0], pageNum);

    // Check cache first
    const cached = pageCache.get(cacheKey);
    if (cached) {
      const baseViewport = cached.getViewport({ scale: 1 });
      
      // Calculate scale based on container width or use fixed scale
      let scale = fixedScale ?? 1.5;
      if (containerWidth && !fixedScale) {
        scale = containerWidth / baseViewport.width;
      }
      
      const viewport = cached.getViewport({ scale });
      
      setState({
        page: cached,
        isLoading: false,
        error: null,
        viewport: {
          width: viewport.width,
          height: viewport.height,
          scale,
        },
      });
      return;
    }

    // Prevent duplicate loads
    if (loadingRef.current === cacheKey) return;
    loadingRef.current = cacheKey;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const page = await doc.getPage(pageNum);
      
      // Store in cache
      pageCache.set(cacheKey, page);

      const baseViewport = page.getViewport({ scale: 1 });
      
      // Calculate scale
      let scale = fixedScale ?? 1.5;
      if (containerWidth && !fixedScale) {
        scale = containerWidth / baseViewport.width;
      }
      
      const viewport = page.getViewport({ scale });

      if (loadingRef.current === cacheKey) {
        setState({
          page,
          isLoading: false,
          error: null,
          viewport: {
            width: viewport.width,
            height: viewport.height,
            scale,
          },
        });
      }
    } catch (err) {
      if (loadingRef.current === cacheKey) {
        setState({
          page: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Failed to load page'),
          viewport: null,
        });
      }
    }
  }, [fixedScale, containerWidth]);

  useEffect(() => {
    if (!document) {
      setState({
        page: null,
        isLoading: false,
        error: null,
        viewport: null,
      });
      return;
    }

    loadPage(document, pageNumber);
  }, [document, pageNumber, loadPage]);

  // Recompute viewport when container width changes
  const viewport = useMemo(() => {
    if (!state.page || !state.viewport) return state.viewport;
    
    const baseViewport = state.page.getViewport({ scale: 1 });
    
    let scale = fixedScale ?? 1.5;
    if (containerWidth && !fixedScale) {
      scale = containerWidth / baseViewport.width;
    }
    
    const vp = state.page.getViewport({ scale });
    
    return {
      width: vp.width,
      height: vp.height,
      scale,
    };
  }, [state.page, containerWidth, fixedScale, state.viewport]);

  return {
    ...state,
    viewport,
  };
}

/**
 * Clear the page cache
 */
export function clearPageCache(): void {
  pageCache.clear();
}

export default usePdfPage;
