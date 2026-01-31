'use client';

/**
 * PdfWordClickViewer Component
 * Continuous vertical page layout with word-level interaction
 * 
 * Features:
 * - All pages rendered in vertical scroll container
 * - Performance: Only renders pages within view window (±2 pages)
 * - IntersectionObserver tracks current visible page
 * - Auto-scroll syncs with TTS activeWordIndex
 * - Word click events propagate to parent
 * - Page navigation via toolbar or scroll
 * 
 * Architecture:
 * PdfWordClickViewer
 *  ├── Toolbar (navigation, zoom)
 *  └── Scroll Container
 *       ├── PdfPageView (Page 1)
 *       ├── PdfPageView (Page 2)
 *       └── ...
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiLoader } from 'react-icons/fi';
import { usePdfDocument } from './usePdfDocument';
import { usePageWordOffsets } from './usePageWordOffsets';
import { PdfPageView } from './PdfPageView';
import type { OnWordClick, PdfViewMode } from './types';

/** Number of pages to render above/below current page */
const PAGE_RENDER_WINDOW = 5;

interface PdfWordClickViewerProps {
  /** URL or data URI of the PDF */
  url: string;
  /** Callback when a word is clicked */
  onWordClick?: OnWordClick;
  /** Currently active word index (for TTS highlighting) */
  activeWordIndex?: number | null;
  /** Currently hovered word index (for preview highlighting) */
  hoveredWordIndex?: number | null;
  /** Callback when hovering over a word */
  onWordHover?: (wordIndex: number | null) => void;
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Initial scale */
  initialScale?: number;
  /** Initial view mode */
  initialViewMode?: PdfViewMode;
  /** Show word boundaries for debugging */
  debug?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when view mode changes */
  onViewModeChange?: (mode: PdfViewMode) => void;
  /** Callback when document is loaded, provides pdfDoc for TOC extraction */
  onDocumentLoad?: (pdfDoc: any) => void;
  /** External page control - scrolls to this page */
  externalPage?: number;
  /** Whether dark mode is active */
  isDarkMode?: boolean;
  /** Whether to invert PDF colors in dark mode */
  invertPdfInDarkMode?: boolean;
}

export function PdfWordClickViewer({
  url,
  onWordClick,
  activeWordIndex,
  hoveredWordIndex,
  onWordHover,
  initialPage = 1,
  initialScale = 1.5,
  initialViewMode = 'single',
  debug = false,
  className = '',
  onPageChange,
  onViewModeChange,
  onDocumentLoad,
  externalPage,
  isDarkMode = false,
  invertPdfInDarkMode = true,
}: PdfWordClickViewerProps) {
  // State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(initialScale);
  const [viewMode, setViewMode] = useState<PdfViewMode>(initialViewMode);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isScrollingToPage = useRef(false);

  // Load document
  const {
    document: pdfDoc,
    isLoading: isLoadingDoc,
    error: docError,
    numPages,
  } = usePdfDocument(url);

  // Compute word offsets for all pages
  const {
    getOffset,
    getPageForWordIndex,
    isLoading: isComputingOffsets,
  } = usePageWordOffsets(pdfDoc);

  // Notify parent when document is loaded
  useEffect(() => {
    if (pdfDoc && onDocumentLoad) {
      onDocumentLoad(pdfDoc);
    }
  }, [pdfDoc, onDocumentLoad]);

  // Notify parent of page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Notify parent of view mode changes
  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  // Compute which pages to render (mode-aware)
  // In continuous mode, render ALL pages to ensure consistent dark mode across entire document
  const visiblePages = useMemo(() => {
    if (viewMode === 'single') {
      return [currentPage];
    }

    // Continuous mode: render all pages for consistent dark mode
    // PDF.js handles its own virtualization, so this is safe
    const pages: number[] = [];
    for (let p = 1; p <= numPages; p++) {
      pages.push(p);
    }
    return pages;
  }, [viewMode, currentPage, numPages]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setContainerWidth(width - 48); // Account for padding
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Track current page via IntersectionObserver (continuous mode only)
  useEffect(() => {
    if (viewMode !== 'continuous') return;
    if (!scrollContainerRef.current || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip if we're programmatically scrolling to a page
        if (isScrollingToPage.current) return;

        // Find the most visible page
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        const mostVisible = visibleEntries.reduce((best, entry) => 
          entry.intersectionRatio > best.intersectionRatio ? entry : best
        );

        const pageNum = Number(mostVisible.target.getAttribute('data-page'));
        if (pageNum && pageNum !== currentPage) {
          setCurrentPage(pageNum);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.3, 0.5, 0.7],
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    // Observe all page elements
    pageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [viewMode, numPages, currentPage, visiblePages]);

  // Scroll to page helper
  const scrollToPage = useCallback((pageNumber: number, behavior: ScrollBehavior = 'smooth') => {
    const pageElement = pageRefs.current.get(pageNumber);
    if (pageElement && scrollContainerRef.current) {
      isScrollingToPage.current = true;
      
      pageElement.scrollIntoView({
        behavior,
        block: 'start',
      });

      // Reset flag after scroll completes
      setTimeout(() => {
        isScrollingToPage.current = false;
      }, behavior === 'smooth' ? 500 : 50);
    }
  }, []);

  // Handle external page changes (e.g., from TOC navigation)
  useEffect(() => {
    if (externalPage !== undefined && externalPage !== currentPage) {
      setCurrentPage(externalPage);
      scrollToPage(externalPage);
    }
  }, [externalPage, currentPage, scrollToPage]);

  // Auto-scroll to active word (TTS sync, mode-aware)
  useEffect(() => {
    if (activeWordIndex === undefined || activeWordIndex === null || !pdfDoc) return;

    // Find which page contains this word
    const targetPage = getPageForWordIndex(activeWordIndex);
    
    // If target page is different, navigate to it
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);

      if (viewMode === 'continuous') {
        // Continuous mode: scroll to page if far away
        const distance = Math.abs(targetPage - currentPage);
        if (distance > PAGE_RENDER_WINDOW) {
          scrollToPage(targetPage);
        }
      }
      // Single mode: page swap happens via visiblePages change
    }
  }, [activeWordIndex, pdfDoc, currentPage, viewMode, getPageForWordIndex, scrollToPage]);

  // Store page ref
  const setPageRef = useCallback((pageNumber: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageNumber, element);
    } else {
      pageRefs.current.delete(pageNumber);
    }
  }, []);

  // Handle word click
  const handleWordClick = useCallback<OnWordClick>(
    (event) => {
      console.log(`Word clicked: "${event.word.text}" (index: ${event.word.globalIndex})`);
      onWordClick?.(event);
    },
    [onWordClick]
  );

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  }, [currentPage, scrollToPage]);

  const goToNextPage = useCallback(() => {
    const newPage = Math.min(numPages, currentPage + 1);
    setCurrentPage(newPage);
    scrollToPage(newPage);
  }, [currentPage, numPages, scrollToPage]);

  const goToPage = useCallback((page: number) => {
    const clampedPage = Math.max(1, Math.min(numPages, page));
    setCurrentPage(clampedPage);
    scrollToPage(clampedPage);
  }, [numPages, scrollToPage]);

  // Zoom handlers
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.25));
  }, []);

  // Loading state
  const isLoading = isLoadingDoc || isComputingOffsets;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-sm">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-600 dark:text-gray-400">/ {numPages}</span>
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages || isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5 || isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <FiZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 3 || isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <FiZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Page Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {numPages} pages
        </div>
      </div>

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={`
          flex-1 overflow-x-hidden p-6
          ${viewMode === 'continuous' ? 'overflow-y-auto' : 'overflow-y-hidden'}
        `}
      >
        {/* Error State */}
        {docError && (
          <div className="flex items-center justify-center h-64 text-red-500">
            <p>Error: {docError.message}</p>
          </div>
        )}

        {/* Document Loading State */}
        {isLoadingDoc && !docError && (
          <div className="flex items-center justify-center h-64">
            <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading document...
            </span>
          </div>
        )}

        {/* Pages */}
        {pdfDoc && !docError && (
          <div
            className={`
              flex flex-col items-center
              ${viewMode === 'single' ? 'justify-center h-full' : ''}
            `}
          >
            {visiblePages.map((pageNumber) => (
              <PdfPageView
                // Include dark mode in key to force re-render on theme change
                key={`page-${pageNumber}-${isDarkMode ? 'dark' : 'light'}-${invertPdfInDarkMode}`}
                ref={(el) => setPageRef(pageNumber, el)}
                pdfDoc={pdfDoc}
                pageNumber={pageNumber}
                scale={scale}
                containerWidth={containerWidth}
                globalWordOffset={getOffset(pageNumber)}
                activeWordIndex={activeWordIndex}
                hoveredWordIndex={hoveredWordIndex}
                onWordClick={handleWordClick}
                onWordHover={onWordHover}
                debug={debug}
                isCurrent={pageNumber === currentPage}
                isDarkMode={isDarkMode}
                invertPdfInDarkMode={invertPdfInDarkMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      {debug && (
        <div className="px-4 py-2 bg-gray-800 text-white text-xs font-mono shrink-0">
          <p>Page: {currentPage}/{numPages} | Scale: {scale.toFixed(2)} | Visible: [{visiblePages.join(', ')}]</p>
          <p>Container: {containerWidth}px | Active Word: {activeWordIndex ?? 'none'} | Hovered: {hoveredWordIndex ?? 'none'}</p>
        </div>
      )}
    </div>
  );
}

export default PdfWordClickViewer;
