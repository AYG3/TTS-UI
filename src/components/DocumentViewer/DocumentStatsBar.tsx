'use client';

/**
 * DocumentStatsBar Component
 * Displays document metadata and current state
 */

import { memo } from 'react';
import { FiList, FiZoomIn, FiZoomOut, FiRotateCcw } from 'react-icons/fi';
import type { Document } from '@/types';

interface DocumentStatsBarProps {
  /** Document data */
  document: Document;
  /** Current page number (for PDFs) */
  currentPage?: number;
  /** Current zoom scale */
  scale?: number;
  /** Whether TOC is open */
  isTocOpen?: boolean;
  /** Toggle TOC callback */
  onToggleToc?: () => void;
  /** Zoom in callback */
  onZoomIn?: () => void;
  /** Zoom out callback */
  onZoomOut?: () => void;
  /** Reset zoom callback */
  onResetZoom?: () => void;
}

export const DocumentStatsBar = memo(function DocumentStatsBar({
  document,
  currentPage,
  scale,
  isTocOpen,
  onToggleToc,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: DocumentStatsBarProps) {
  const isPdf = document.fileType === 'pdf';

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      {/* Mobile View */}
      <div className="flex md:hidden flex-col px-3 py-2 gap-2">
        {/* Top row: Title and TOC toggle */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate flex-1 mr-2">
            {document.title}
          </span>
          {isPdf && onToggleToc && (
            <button
              onClick={onToggleToc}
              className={`p-2 rounded-lg transition-colors ${
                isTocOpen
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              aria-label="Toggle table of contents"
            >
              <FiList className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom row: Stats and zoom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{document.fileType.toUpperCase()}</span>
            {document.pageCount && (
              <>
                <span>•</span>
                <span>{document.pageCount}p</span>
              </>
            )}
            {isPdf && currentPage && (
              <>
                <span>•</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {currentPage}/{document.pageCount}
                </span>
              </>
            )}
          </div>

          {/* Zoom Controls */}
          {/* {isPdf && (
            <div className="flex items-center gap-1">
              <button
                onClick={onZoomOut}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Zoom out"
              >
                <FiZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center">
                {scale ? `${Math.round(scale * 100)}%` : '100%'}
              </span>
              <button
                onClick={onZoomIn}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Zoom in"
              >
                <FiZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={onResetZoom}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Reset zoom"
              >
                <FiRotateCcw className="w-4 h-4" />
              </button>
            </div>
          )} */}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 text-sm">
          {isPdf && onToggleToc && (
            <button
              onClick={onToggleToc}
              className={`p-2 rounded-lg transition-colors mr-2 ${
                isTocOpen
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              aria-label="Toggle table of contents"
              title="Toggle table of contents"
            >
              <FiList className="w-5 h-5" />
            </button>
          )}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {document.title}
          </span>
          <span className="text-gray-500 dark:text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">
            {document.fileType.toUpperCase()}
          </span>
          {document.pageCount && (
            <>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">
                {document.pageCount} pages
              </span>
            </>
          )}
          {isPdf && currentPage && (
            <>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Page {currentPage}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {document.wordCount.toLocaleString()} words
          </span>
        </div>
      </div>
    </div>
  );
});

export default DocumentStatsBar;
