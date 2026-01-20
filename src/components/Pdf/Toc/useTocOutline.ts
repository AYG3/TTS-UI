'use client';

/**
 * useTocOutline Hook
 * Manages PDF table of contents extraction and state
 */

import { useState, useEffect, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPdfTocOutlineWithPages } from './getPdfTocOutlineWithPages';
import type { TocItemData } from './TocItem';

interface UseTocOutlineResult {
  /** Table of contents items */
  items: TocItemData[];
  /** Whether TOC is loading */
  isLoading: boolean;
  /** Error if TOC extraction failed */
  error: Error | null;
  /** Whether the document has a TOC */
  hasToc: boolean;
  /** Refresh the TOC */
  refresh: () => void;
}

/**
 * Hook to extract and manage PDF table of contents
 * @param pdfDocument - The PDF.js document proxy
 * @returns TOC state and actions
 */
export function useTocOutline(
  pdfDocument: PDFDocumentProxy | null
): UseTocOutlineResult {
  const [items, setItems] = useState<TocItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadOutline = useCallback(async () => {
    if (!pdfDocument) {
      setItems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    console.log('Loading PDF outline...', {
      numPages: pdfDocument.numPages,
      fingerprints: pdfDocument.fingerprints,
    });

    setIsLoading(true);
    setError(null);

    try {
      const outline = await getPdfTocOutlineWithPages(pdfDocument);
      console.log(`Extracted ${outline.length} TOC items:`, outline);
      setItems(outline);
    } catch (err) {
      console.error('Failed to load PDF outline:', err);
      setError(err instanceof Error ? err : new Error('Failed to load outline'));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pdfDocument]);

  // Load outline when document changes
  useEffect(() => {
    loadOutline();
  }, [loadOutline]);

  const refresh = useCallback(() => {
    loadOutline();
  }, [loadOutline]);

  return {
    items,
    isLoading,
    error,
    hasToc: items.length > 0,
    refresh,
  };
}

export default useTocOutline;
