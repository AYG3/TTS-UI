'use client';

/**
 * PdfPageView Component
 * Renders a single PDF page with canvas and word overlay
 * 
 * This component encapsulates all per-page rendering logic:
 * - Page loading via usePdfPage
 * - Word layout computation via useWordLayout
 * - Canvas rendering via PdfCanvas
 * - Word interaction via WordOverlay
 * 
 * Used by PdfWordClickViewer to render pages in a continuous vertical layout
 */

import { forwardRef, memo } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { FiLoader } from 'react-icons/fi';
import { PdfCanvas } from './PdfCanvas';
import { WordOverlay } from './WordOverlay';
import { usePdfPage } from './usePdfPage';
import { useWordLayout } from './useWordLayout';
import type { OnWordClick } from './types';

export interface PdfPageViewProps {
  /** PDF document instance */
  pdfDoc: PDFDocumentProxy;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Render scale */
  scale: number;
  /** Container width for responsive scaling */
  containerWidth: number;
  /** Global word offset for this page (sum of words on previous pages) */
  globalWordOffset: number;
  /** Currently active word index for TTS highlighting */
  activeWordIndex?: number | null;
  /** Currently hovered word index for preview highlighting */
  hoveredWordIndex?: number | null;
  /** Callback when a word is clicked */
  onWordClick?: OnWordClick;
  /** Callback when hovering over a word */
  onWordHover?: (wordIndex: number | null) => void;
  /** Show word boundaries for debugging */
  debug?: boolean;
  /** Whether this is the current/focused page */
  isCurrent?: boolean;
  /** Whether dark mode is active */
  isDarkMode?: boolean;
  /** Whether to invert PDF colors in dark mode */
  invertPdfInDarkMode?: boolean;
}

/**
 * Single page view component
 * Isolated to keep hooks legal and minimize re-renders
 */
export const PdfPageView = memo(forwardRef<HTMLDivElement, PdfPageViewProps>(
  function PdfPageView(
    {
      pdfDoc,
      pageNumber,
      scale,
      containerWidth,
      globalWordOffset,
      activeWordIndex,
      hoveredWordIndex,
      onWordClick,
      onWordHover,
      debug = false,
      isCurrent = false,
      isDarkMode = false,
      invertPdfInDarkMode = true,
    },
    ref
  ) {
    // Load page with viewport
    const {
      page,
      isLoading: isLoadingPage,
      error: pageError,
      viewport,
    } = usePdfPage(pdfDoc, pageNumber, { scale, containerWidth });

    // Compute word layout for this page
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

    const isLoading = isLoadingPage || isComputingLayout;
    const error = pageError || layoutError;

    // Error state
    if (error) {
      return (
        <div
          ref={ref}
          data-page={pageNumber}
          className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg mx-auto mb-4"
          style={{ width: containerWidth || 600 }}
        >
          <p className="text-red-500 dark:text-red-400 text-sm">
            Error loading page {pageNumber}: {error.message}
          </p>
        </div>
      );
    }

    // Loading state - show placeholder with correct dimensions
    if (!page || !viewport) {
      return (
        <div
          ref={ref}
          data-page={pageNumber}
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto mb-4 shadow-lg"
          style={{
            width: containerWidth || 600,
            height: (containerWidth || 600) * 1.4, // Approximate aspect ratio
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading page {pageNumber}...
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-page={pageNumber}
        className={`
          relative mx-auto mb-4 shadow-xl transition-all duration-200
          ${isCurrent ? 'ring-2 ring-blue-500/50' : ''}
        `}
        style={{
          width: viewport.width,
          height: viewport.height,
          backgroundColor: isDarkMode && invertPdfInDarkMode ? '#1a1a1a' : '#ffffff',
        }}
      >
        {/* Canvas Layer */}
        <PdfCanvas
          page={page}
          scale={scale}
          width={viewport.width}
          height={viewport.height}
          isDarkMode={isDarkMode}
          invertPdfInDarkMode={invertPdfInDarkMode}
        />

        {/* Word Overlay Layer */}
        {!isComputingLayout && onWordClick && (
          <WordOverlay
            words={words}
            onWordClick={onWordClick}
            activeWordIndex={activeWordIndex}
            hoveredWordIndex={hoveredWordIndex}
            onWordHover={onWordHover}
            debug={debug}
          />
        )}

        {/* Page Number Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          Page {pageNumber}
        </div>
      </div>
    );
  }
));

export default PdfPageView;
