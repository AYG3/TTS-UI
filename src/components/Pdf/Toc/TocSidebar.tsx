'use client';

/**
 * TocSidebar Component
 * Collapsible, resizable table of contents sidebar for PDF navigation
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { FiChevronLeft, FiChevronRight, FiList, FiX, FiLoader } from 'react-icons/fi';
import { TocItem, type TocItemData } from './TocItem';

interface TocSidebarProps {
  /** Table of contents items */
  items: TocItemData[];
  /** Whether TOC is loading */
  isLoading?: boolean;
  /** Callback when navigating to a page */
  onNavigate: (page: number) => void;
  /** Current active page number */
  activePage?: number;
  /** Whether sidebar is open */
  isOpen: boolean;
  /** Toggle sidebar open/close */
  onToggle: () => void;
  /** Initial width of sidebar */
  initialWidth?: number;
  /** Minimum width of sidebar */
  minWidth?: number;
  /** Maximum width of sidebar */
  maxWidth?: number;
}

export const TocSidebar = memo(function TocSidebar({
  items,
  isLoading = false,
  onNavigate,
  activePage,
  isOpen,
  onToggle,
  initialWidth = 280,
  minWidth = 200,
  maxWidth = 500,
}: TocSidebarProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle navigation with auto-close on mobile
  const handleNavigate = useCallback((page: number) => {
    onNavigate(page);
    // Auto-close sidebar on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle();
    }
  }, [onNavigate, onToggle]);

  // Handle resize drag
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-32 sm:h-48 text-gray-400 dark:text-gray-500">
      <FiList className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 opacity-50" />
      <p className="text-xs sm:text-sm text-center px-3 sm:px-4">
        No table of contents available for this document
      </p>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-32 sm:h-48 text-gray-400 dark:text-gray-500">
      <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mb-2 sm:mb-3" />
      <p className="text-xs sm:text-sm">Loading contents...</p>
    </div>
  );

  return (
    <div className="relative flex-shrink-0 h-full">
      {/* Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="
            absolute left-0 top-1/2 -translate-y-1/2 z-30
            flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-3 sm:py-4
            bg-white dark:bg-gray-800 
            border border-l-0 border-gray-200 dark:border-gray-700
            rounded-r-md sm:rounded-r-lg shadow-md sm:shadow-lg
            text-gray-600 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700
            transition-colors
          "
          aria-label="Open table of contents"
        >
          <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
          <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed md:relative inset-y-0 left-0 z-40 md:z-auto
          h-full
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          shadow-2xl md:shadow-none
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{ 
          width: isOpen ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '80vw' : width) : 0,
          backgroundColor: 'inherit'
        }}
      >
        <div className="flex flex-col h-full" style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '80vw' : width }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FiList className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Contents
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Close table of contents"
            >
              <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Items Count */}
          {!isLoading && items.length > 0 && (
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              {items.length} {items.length === 1 ? 'chapter' : 'chapters'}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 sm:py-2">
            {isLoading ? (
              renderLoadingState()
            ) : items.length === 0 ? (
              renderEmptyState()
            ) : (
              <nav aria-label="Table of contents">
                {items.map((item, index) => (
                  <TocItem
                    key={`${item.title}-${index}`}
                    item={item}
                    onNavigate={handleNavigate}
                    activePage={activePage}
                  />
                ))}
              </nav>
            )}
          </div>

          {/* Resize Handle - Hidden on mobile */}
          <div
            onMouseDown={startResize}
            className={`
              hidden md:block
              absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
              hover:bg-blue-500 transition-colors
              ${isResizing ? 'bg-blue-500' : 'bg-transparent'}
            `}
            style={{ right: 0 }}
          />
        </div>
      </div>

      {/* Backdrop overlay for mobile with blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Resize Overlay (prevents content interaction during resize) */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
});

export default TocSidebar;
