/**
 * HistoryItem Component
 * Individual document item in the history list
 */

'use client';

import { memo } from 'react';
import { FiFileText, FiFile, FiX, FiVolume2 } from 'react-icons/fi';
import type { HistoryDocument } from './types';

interface HistoryItemProps {
  document: HistoryDocument;
  onSelect?: (documentId: string) => void;
  onRemove: (documentId: string) => void;
}

export const HistoryItem = memo(function HistoryItem({
  document,
  onSelect,
  onRemove,
}: HistoryItemProps) {
  const isPdf = document.fileType === 'pdf';

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="group relative flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer min-w-[200px] max-w-[280px] shrink-0"
      onClick={() => onSelect?.(document.id)}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isPdf
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}
      >
        {isPdf ? <FiFileText className="w-5 h-5" /> : <FiFile className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {document.title}
          </p>
          {document.hasAudio && (
            <FiVolume2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="uppercase">{document.fileType}</span>
          <span>•</span>
          <span>{document.wordCount.toLocaleString()} words</span>
          {document.pageCount && (
            <>
              <span>•</span>
              <span>{document.pageCount}p</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {formatRelativeTime(document.uploadedAt)}
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(document.id);
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Remove from history"
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export default HistoryItem;
