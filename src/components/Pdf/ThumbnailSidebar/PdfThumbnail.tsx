'use client';

/**
 * PdfThumbnail Component
 * Renders a single page thumbnail with click interaction
 * 
 * This is a pure presentational component - all logic is in the hook
 */

import { useRef, useEffect, memo } from 'react';
import type { PdfThumbnailProps } from './types';

function PdfThumbnailComponent({
  thumbnail,
  isActive,
  onClick,
  className = '',
}: PdfThumbnailProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Mount the canvas once (it's already rendered)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !thumbnail.canvas) return;

    // Clear container and append canvas
    container.innerHTML = '';
    container.appendChild(thumbnail.canvas);

    // Style the canvas for proper display
    thumbnail.canvas.style.width = '100%';
    thumbnail.canvas.style.height = 'auto';
    thumbnail.canvas.style.display = 'block';
  }, [thumbnail.canvas]);

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full mb-3 p-2 rounded-lg
        transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 shadow-lg' 
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
        }
        ${className}
      `}
      aria-label={`Go to page ${thumbnail.page}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Thumbnail image */}
      <div 
        ref={canvasContainerRef}
        className={`
          w-full rounded overflow-hidden border
          ${isActive 
            ? 'border-blue-400 dark:border-blue-500' 
            : 'border-gray-200 dark:border-gray-600 group-hover:border-gray-300'
          }
        `}
      />

      {/* Page number */}
      <div 
        className={`
          mt-2 text-xs font-medium text-center
          ${isActive 
            ? 'text-blue-700 dark:text-blue-300' 
            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
          }
        `}
      >
        {thumbnail.page}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-lg" />
      )}
    </button>
  );
}

// Memoize to prevent unnecessary re-renders
export const PdfThumbnail = memo(PdfThumbnailComponent, (prev, next) => {
  return (
    prev.thumbnail.page === next.thumbnail.page &&
    prev.isActive === next.isActive &&
    prev.className === next.className
  );
});

PdfThumbnail.displayName = 'PdfThumbnail';
