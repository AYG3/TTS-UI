'use client';

/**
 * PDF Sidebar Shell
 * 
 * Core container component that provides:
 * - Open/close state management
 * - Width resize functionality
 * - Mobile overlay behavior
 * - Keyboard focus handling
 * 
 * This component handles all shared sidebar behavior, allowing
 * child panels (TOC, Thumbnails) to focus purely on content.
 */

import { useEffect, useState, useCallback } from 'react';
import { FiList, FiChevronRight } from 'react-icons/fi';
import type { PdfSidebarShellProps } from './types';

export function PdfSidebarShell({
  isOpen,
  width,
  minWidth,
  maxWidth,
  onResize,
  onClose,
  children,
  className = '',
}: PdfSidebarShellProps) {
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize drag start
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      onResize(Math.max(minWidth, Math.min(maxWidth, newWidth)));
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
  }, [isResizing, minWidth, maxWidth, onResize]);

  // Handle escape key to close sidebar
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          h-full
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out
          md:transition-none
          ${className}
        `}
        style={{
          width: isOpen ? `min(80vw, ${width}px)` : '0px',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        aria-hidden={!isOpen}
      >

        {/* Toggle Button (when closed) */}
      {!isOpen && (
        <button
          onClick={onClose}
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
          aria-label="Open sidebar"
        >
          <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
          <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}

        {/* Content */}
        <div className="h-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Resize Handle - Desktop only */}
        <div
          onMouseDown={startResize}
          className={`
            hidden md:block
            absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
            hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors
            ${isResizing ? 'bg-blue-500 dark:bg-blue-400' : 'bg-transparent'}
          `}
          aria-label="Resize sidebar"
        />
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Resize Overlay - Prevents content interaction during resize */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </>
  );
}
