'use client';

/**
 * ThumbnailPanel Component
 * Pure content panel for PDF page thumbnails
 * 
 * This component focuses solely on rendering thumbnail content.
 * Layout, resize, and open/close behavior are handled by SidebarShell.
 */

import { useEffect, useRef, memo } from 'react';
import { FiLoader } from 'react-icons/fi';
import { usePdfThumbnails } from './usePdfThumbnails';
import { PdfThumbnail } from './PdfThumbnail';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ThumbnailOptions } from './types';

interface ThumbnailPanelProps {
  /** PDF document instance */
  pdf: PDFDocumentProxy | null;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Callback when thumbnail is clicked */
  onPageSelect: (page: number) => void;
  /** Rendering options */
  options?: ThumbnailOptions;
  /** Show loading state */
  isLoading?: boolean;
}

export const ThumbnailPanel = memo(function ThumbnailPanel({
  pdf,
  currentPage,
  onPageSelect,
  options = {},
  isLoading: externalLoading = false,
}: ThumbnailPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate thumbnails
  const { thumbnails, isLoading, loadedCount, totalPages } = usePdfThumbnails(
    pdf,
    options
  );

  // Auto-scroll to current page
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    // Find the active thumbnail
    const activeThumb = scrollContainerRef.current.querySelector(
      '[aria-current="page"]'
    ) as HTMLElement;

    if (activeThumb) {
      // Scroll into view with smooth animation
      activeThumb.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentPage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdf) return;

      // Only handle if sidebar is focused
      if (!scrollContainerRef.current?.contains(document.activeElement)) {
        return;
      }

      if (e.key === 'ArrowUp' && currentPage > 1) {
        e.preventDefault();
        onPageSelect(currentPage - 1);
      } else if (e.key === 'ArrowDown' && currentPage < totalPages) {
        e.preventDefault();
        onPageSelect(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, pdf, onPageSelect]);

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden px-3 py-4"
      role="navigation"
      aria-label="Page thumbnails"
    >
      {/* Loading state */}
      {(externalLoading || (!pdf && isLoading)) && (
        <div className="flex flex-col items-center justify-center p-8">
          <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading document...
          </p>
        </div>
      )}

      {/* No document state */}
      {!pdf && !isLoading && !externalLoading && (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No document loaded
          </p>
        </div>
      )}

      {/* Thumbnails */}
      {pdf && (
        <>
          {/* Progress info */}
          {isLoading && (
            <div className="mb-4 px-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Loading {loadedCount} of {totalPages}...
              </p>
            </div>
          )}

          {/* Thumbnail grid */}
          <div className="space-y-1">
            {thumbnails.map((thumbnail) => (
              <PdfThumbnail
                key={thumbnail.page}
                thumbnail={thumbnail}
                isActive={thumbnail.page === currentPage}
                onClick={() => onPageSelect(thumbnail.page)}
              />
            ))}
          </div>

          {/* Loading indicator for remaining pages */}
          {isLoading && thumbnails.length < totalPages && (
            <div className="flex items-center justify-center p-4">
              <FiLoader className="w-5 h-5 text-gray-400 animate-spin" />
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                Loading more pages...
              </span>
            </div>
          )}

          {/* Progress indicator */}
          {!isLoading && thumbnails.length > 0 && (
            <div className="mt-4 px-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default ThumbnailPanel;
