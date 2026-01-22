'use client';

/**
 * TocPanel Component
 * Pure content panel for table of contents navigation
 * 
 * This component focuses solely on rendering TOC content.
 * Layout, resize, and open/close behavior are handled by SidebarShell.
 */

import { useCallback, memo } from 'react';
import { FiList, FiLoader } from 'react-icons/fi';
import { TocItem, type TocItemData } from './TocItem';

interface TocPanelProps {
  /** Table of contents items */
  items: TocItemData[];
  /** Whether TOC is loading */
  isLoading?: boolean;
  /** Callback when navigating to a page */
  onNavigate: (page: number) => void;
  /** Current active page number */
  activePage?: number;
  /** Auto-close on mobile after navigation */
  autoCloseMobile?: boolean;
  /** Callback to close sidebar (for auto-close on mobile) */
  onClose?: () => void;
}

export const TocPanel = memo(function TocPanel({
  items,
  isLoading = false,
  onNavigate,
  activePage,
  autoCloseMobile = true,
  onClose,
}: TocPanelProps) {
  // Handle navigation with auto-close on mobile
  const handleNavigate = useCallback((page: number) => {
    onNavigate(page);
    // Auto-close sidebar on mobile after navigation
    if (autoCloseMobile && onClose && typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  }, [onNavigate, autoCloseMobile, onClose]);

  // Render empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8">
        <FiList className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm text-center">
          No table of contents available for this document
        </p>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8">
        <FiLoader className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading contents...</p>
      </div>
    );
  }

  // Render TOC items
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <nav
        className="py-2 px-3"
        aria-label="Table of contents"
        role="navigation"
      >
        {items.map((item) => (
          <TocItem
            key={`${item.pageNumber}-${item.title}`}
            item={item}
            onNavigate={handleNavigate}
            activePage={activePage}
          />
        ))}
      </nav>
    </div>
  );
});

export default TocPanel;
