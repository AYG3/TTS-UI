'use client';

/**
 * PdfWordClickViewer Component
 * Final orchestrator - clean & readable
 * 
 * Responsibilities:
 * - Compose all hooks and components
 * - Handle page navigation
 * - Emit word click events to parent
 * - Manage loading states
 * 
 * This is the ONLY component consumers need to use
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut, FiLoader } from 'react-icons/fi';
import { usePdfDocument } from './usePdfDocument';
import { usePdfPage } from './usePdfPage';
import { useWordLayout } from './useWordLayout';
import { PdfCanvas } from './PdfCanvas';
import { WordOverlay } from './WordOverlay';
import type { WordClickEvent, OnWordClick } from './types';

interface PdfWordClickViewerProps {
  /** URL or data URI of the PDF */
  url: string;
  /** Callback when a word is clicked */
  onWordClick?: OnWordClick;
  /** Currently active word index (for TTS highlighting) */
  activeWordIndex?: number;
  /** Initial page number (1-indexed) */
  initialPage?: number;
  /** Initial scale */
  initialScale?: number;
  /** Show word boundaries for debugging */
  debug?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when document is loaded, provides pdfDoc for TOC extraction */
  onDocumentLoad?: (pdfDoc: any) => void;
  /** External page control */
  externalPage?: number;
}

export function PdfWordClickViewer({
  url,
  onWordClick,
  activeWordIndex,
  initialPage = 1,
  initialScale = 1.5,
  debug = false,
  className = '',
  onPageChange,
  onDocumentLoad,
  externalPage,
}: PdfWordClickViewerProps) {
  // State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(initialScale);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track global word offset for multi-page documents
  const [globalWordOffset, setGlobalWordOffset] = useState(0);

  // Load document
  const {
    document: pdfDoc,
    isLoading: isLoadingDoc,
    error: docError,
    numPages,
  } = usePdfDocument(url);

  // Notify parent when document is loaded
  useEffect(() => {
    if (pdfDoc && onDocumentLoad) {
      onDocumentLoad(pdfDoc);
    }
  }, [pdfDoc, onDocumentLoad]);

  // Handle external page changes
  useEffect(() => {
    if (externalPage !== undefined && externalPage !== currentPage) {
      setCurrentPage(externalPage);
    }
  }, [externalPage]);

  // Notify parent of page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Load current page
  const {
    page,
    isLoading: isLoadingPage,
    error: pageError,
    viewport,
  } = usePdfPage(pdfDoc, currentPage, { scale, containerWidth });

  // Compute word layout
  const {
    words,
    isComputing: isComputingLayout,
    error: layoutError,
  } = useWordLayout(
    page,
    scale,
    viewport?.height ?? 0,
    globalWordOffset
  );

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
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(numPages, p + 1));
  }, [numPages]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(numPages, page)));
  }, [numPages]);

  // Zoom handlers
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(3, s + 0.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(0.5, s - 0.25));
  }, []);

  // Loading state
  const isLoading = isLoadingDoc || isLoadingPage || isComputingLayout;
  
  // Error state
  const error = docError || pageError || layoutError;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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

        {/* Word Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {words.length} words on page
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-6">
        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-64 text-red-500">
            <p>Error: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="flex items-center justify-center h-64">
            <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              {isLoadingDoc ? 'Loading document...' : 
               isLoadingPage ? 'Loading page...' : 
               'Computing word layout...'}
            </span>
          </div>
        )}

        {/* PDF Page */}
        {page && viewport && !error && (
          <div
            className="relative mx-auto shadow-xl bg-white"
            style={{
              width: viewport.width,
              height: viewport.height,
            }}
          >
            {/* Canvas Layer */}
            <PdfCanvas
              page={page}
              scale={scale}
              width={viewport.width}
              height={viewport.height}
            />

            {/* Word Overlay Layer */}
            {!isComputingLayout && (
              <WordOverlay
                words={words}
                onWordClick={handleWordClick}
                activeWordIndex={activeWordIndex}
                debug={debug}
              />
            )}
          </div>
        )}
      </div>

      {/* Debug Info */}
      {debug && (
        <div className="px-4 py-2 bg-gray-800 text-white text-xs font-mono">
          <p>Page: {currentPage}/{numPages} | Scale: {scale.toFixed(2)} | Words: {words.length}</p>
          <p>Viewport: {viewport?.width?.toFixed(0)}x{viewport?.height?.toFixed(0)} | Active: {activeWordIndex ?? 'none'}</p>
        </div>
      )}
    </div>
  );
}

export default PdfWordClickViewer;
