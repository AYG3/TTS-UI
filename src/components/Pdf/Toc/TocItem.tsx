'use client';

/**
 * TocItem Component
 * Recursive table of contents item with expandable children
 */

import { useState, useCallback, memo } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

export interface TocItemData {
  title: string;
  pageNumber: number | null;
  children: TocItemData[];
}

interface TocItemProps {
  /** TOC item data */
  item: TocItemData;
  /** Callback when navigating to a page */
  onNavigate: (page: number) => void;
  /** Current active page number */
  activePage?: number;
  /** Nesting depth level */
  depth?: number;
}

export const TocItem = memo(function TocItem({
  item,
  onNavigate,
  activePage,
  depth = 0,
}: TocItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.pageNumber === activePage;

  const handleClick = useCallback(() => {
    if (item.pageNumber !== null) {
      onNavigate(item.pageNumber);
    }
  }, [item.pageNumber, onNavigate]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="select-none">
      {/* Item Row */}
      <div
        className={`
          group flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg cursor-pointer
          transition-colors duration-150
          ${isActive 
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <FiChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <FiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        ) : (
          <span className="w-4 sm:w-5" /> // Spacer for alignment
        )}

        {/* Title */}
        <span className={`flex-1 text-xs sm:text-sm truncate ${isActive ? 'font-medium' : ''}`}>
          {item.title}
        </span>

        {/* Page Number */}
        {item.pageNumber !== null && (
          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            p. {item.pageNumber}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-1 sm:ml-2">
          {item.children.map((child, index) => (
            <TocItem
              key={`${child.title}-${index}`}
              item={child}
              onNavigate={onNavigate}
              activePage={activePage}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default TocItem;
