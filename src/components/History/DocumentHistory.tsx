/**
 * DocumentHistory Component
 * Displays a horizontal scrollable list of recently uploaded documents
 * 
 * Features:
 * - Mobile-first horizontal scroll
 * - Desktop grid with responsive columns
 * - Quick access to recent documents
 * - Shows audio generation status
 */

'use client';

import { memo } from 'react';
import { FiClock, FiTrash2 } from 'react-icons/fi';
import { HistoryItem } from './HistoryItem';
import { useDocumentHistory } from './useDocumentHistory';
import type { DocumentHistoryProps } from './types';

export const DocumentHistory = memo(function DocumentHistory({
  onSelectDocument,
  maxItems = 10,
  className = 'mt-8',
}: DocumentHistoryProps) {
  const {
    documents,
    isLoading,
    removeDocument,
    clearHistory,
  } = useDocumentHistory({ maxItems });

  // Don't render if no history
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[200px] h-[88px] bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FiClock className="w-4 h-4" />
          <h3 className="text-sm font-medium">Recent Documents</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({documents.length})
          </span>
        </div>
        
        {documents.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Scrollable container */}
      <div className="relative">
        {/* Gradient fade on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10 md:hidden" />
        
        {/* Document list - horizontal scroll on mobile, wrap on desktop */}
        <div className="grid grid-cols-2 gap-3 overflow-x-auto pb-2 scrollbar-hide md:flex-wrap md:overflow-x-visible">
          {documents.map((doc) => (
            <HistoryItem
              key={doc.id}
              document={doc}
              onSelect={onSelectDocument}
              onRemove={removeDocument}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default DocumentHistory;
