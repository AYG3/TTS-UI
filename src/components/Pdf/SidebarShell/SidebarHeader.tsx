'use client';

/**
 * Sidebar Header Component
 * 
 * Provides tab controls to switch between sidebar modes (TOC, Thumbnails)
 * and optional close button for mobile.
 */

import { FiList, FiGrid, FiX } from 'react-icons/fi';
import type { SidebarHeaderProps } from './types';

export function SidebarHeader({
  mode,
  onModeChange,
  onClose,
  hideClose = false,
}: SidebarHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Tab Buttons */}
      <button
        onClick={() => onModeChange('toc')}
        className={`
          flex-1 flex items-center justify-center gap-2 px-4 py-3
          text-sm font-medium transition-colors
          ${mode === 'toc'
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
        aria-current={mode === 'toc' ? 'page' : undefined}
      >
        <FiList className="w-4 h-4" />
        <span>Contents</span>
      </button>

      <button
        onClick={() => onModeChange('thumbnails')}
        className={`
          flex-1 flex items-center justify-center gap-2 px-4 py-3
          text-sm font-medium transition-colors
          ${mode === 'thumbnails'
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
        aria-current={mode === 'thumbnails' ? 'page' : undefined}
      >
        <FiGrid className="w-4 h-4" />
        <span>Pages</span>
      </button>

      {/* Close Button - Mobile only */}
      {!hideClose && (
        <button
          onClick={onClose}
          className="md:hidden px-3 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <FiX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
