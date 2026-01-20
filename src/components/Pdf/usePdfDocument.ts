'use client';

/**
 * usePdfDocument Hook
 * Loads and caches PDF document (load once, use everywhere)
 * 
 * Features:
 * - Document-level caching by URL
 * - Automatic cleanup on unmount
 * - Error boundary support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfDocumentState } from './types';

// Configure worker (CDN for reliability)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Document cache - persists across component remounts
const documentCache = new Map<string, PDFDocumentProxy>();

export function usePdfDocument(url: string | null): PdfDocumentState {
  const [state, setState] = useState<PdfDocumentState>({
    document: null,
    isLoading: false,
    error: null,
    numPages: 0,
  });
  
  const loadingRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadDocument = useCallback(async (pdfUrl: string) => {
    // Check cache first
    const cached = documentCache.get(pdfUrl);
    if (cached) {
      setState({
        document: cached,
        isLoading: false,
        error: null,
        numPages: cached.numPages,
      });
      return;
    }

    // Prevent duplicate loads
    if (loadingRef.current === pdfUrl) return;
    loadingRef.current = pdfUrl;

    // Cancel any pending load
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        // Enable range requests for large files
        disableRange: false,
        // Disable streaming for simpler caching
        disableStream: true,
      });

      const doc = await loadingTask.promise;

      // Store in cache
      documentCache.set(pdfUrl, doc);

      // Only update state if this is still the current URL
      if (loadingRef.current === pdfUrl) {
        setState({
          document: doc,
          isLoading: false,
          error: null,
          numPages: doc.numPages,
        });
      }
    } catch (err) {
      if (loadingRef.current === pdfUrl) {
        setState({
          document: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Failed to load PDF'),
          numPages: 0,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!url) {
      setState({
        document: null,
        isLoading: false,
        error: null,
        numPages: 0,
      });
      return;
    }

    loadDocument(url);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, loadDocument]);

  return state;
}

/**
 * Clear the document cache (useful for memory management)
 */
export function clearDocumentCache(url?: string): void {
  if (url) {
    const doc = documentCache.get(url);
    if (doc) {
      doc.destroy();
      documentCache.delete(url);
    }
  } else {
    documentCache.forEach(doc => doc.destroy());
    documentCache.clear();
  }
}

export default usePdfDocument;
