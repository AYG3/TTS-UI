'use client';

/**
 * usePdfThumbnails Hook
 * Generates and caches PDF page thumbnails using pdf.js
 * 
 * Performance Features:
 * - Progressive rendering (render visible thumbnails first)
 * - Canvas caching (render once, reuse forever)
 * - Cancellation support (cleanup on unmount)
 * - Memory efficient (low scale rendering)
 * 
 * This is the CORRECT way to generate PDF thumbnails:
 * ✓ Client-side rendering using pdf.js
 * ✓ Same engine as main viewer (perfect accuracy)
 * ✓ Scales correctly for any screen size
 * ✓ Cached in memory
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ThumbnailItem, ThumbnailOptions } from './types';

const DEFAULT_SCALE = 0.25; // 25% of full size (recommended range: 0.2-0.3)
const DEFAULT_TARGET_WIDTH = 140; // pixels (recommended range: 120-160)
const DEFAULT_INITIAL_PAGES = 10; // for progressive loading

export function usePdfThumbnails(
  pdf: PDFDocumentProxy | null,
  options: ThumbnailOptions = {}
) {
  const {
    scale = DEFAULT_SCALE,
    targetWidth = DEFAULT_TARGET_WIDTH,
    progressive = true,
    initialPages = DEFAULT_INITIAL_PAGES,
  } = options;

  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  
  const cancelledRef = useRef(false);
  const cacheRef = useRef(new Map<string, ThumbnailItem>());

  /**
   * Render a single page thumbnail
   * This is the official pdf.js rendering path - do NOT modify
   */
  const renderThumbnail = useCallback(
    async (pageNumber: number): Promise<ThumbnailItem> => {
      if (!pdf) throw new Error('PDF not loaded');

      // Check cache first
      const cacheKey = `${pdf.fingerprints[0]}-${pageNumber}-${scale}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) return cached;

      // Load page
      const page = await pdf.getPage(pageNumber);

      // Calculate viewport with target scale
      let viewport = page.getViewport({ scale });

      // Adjust scale to match target width if specified
      if (targetWidth) {
        const scaleToFit = targetWidth / viewport.width;
        viewport = page.getViewport({ scale: scale * scaleToFit });
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas dimensions
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      // Render page to canvas
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const thumbnail: ThumbnailItem = {
        page: pageNumber,
        canvas,
        width: canvas.width,
        height: canvas.height,
      };

      // Store in cache
      cacheRef.current.set(cacheKey, thumbnail);

      return thumbnail;
    },
    [pdf, scale, targetWidth]
  );

  /**
   * Generate all thumbnails with progressive loading
   */
  useEffect(() => {
    if (!pdf) {
      setThumbnails([]);
      setLoadedCount(0);
      return;
    }

    cancelledRef.current = false;
    setIsLoading(true);
    setLoadedCount(0);

    async function generateThumbnails() {
      if (!pdf || cancelledRef.current) return;

      const results: ThumbnailItem[] = [];
      const totalPages = pdf.numPages;

      // Determine how many pages to render initially
      const pagesToRender = progressive
        ? Math.min(initialPages, totalPages)
        : totalPages;

      try {
        // Phase 1: Render initial pages (visible thumbnails)
        for (let i = 1; i <= pagesToRender; i++) {
          if (cancelledRef.current) return;

          const thumbnail = await renderThumbnail(i);
          results.push(thumbnail);
          
          // Update state progressively for immediate feedback
          setThumbnails([...results]);
          setLoadedCount(i);
        }

        // Phase 2: Render remaining pages (background loading)
        if (progressive && pagesToRender < totalPages) {
          for (let i = pagesToRender + 1; i <= totalPages; i++) {
            if (cancelledRef.current) return;

            const thumbnail = await renderThumbnail(i);
            results.push(thumbnail);
            
            // Batch updates every 5 pages to reduce re-renders
            if (i % 5 === 0 || i === totalPages) {
              setThumbnails([...results]);
              setLoadedCount(i);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to generate thumbnails:', error);
        setIsLoading(false);
      }
    }

    generateThumbnails();

    // Cleanup on unmount
    return () => {
      cancelledRef.current = true;
    };
  }, [pdf, renderThumbnail, progressive, initialPages]);

  return {
    thumbnails,
    isLoading,
    loadedCount,
    totalPages: pdf?.numPages ?? 0,
  };
}
