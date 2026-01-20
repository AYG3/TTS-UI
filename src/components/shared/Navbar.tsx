'use client';

/**
 * Navbar Component
 * Main navigation bar with theme toggle and document title
 */

import { useTheme } from '@/contexts/ThemeContext';
import { FiSun, FiMoon, FiBook } from 'react-icons/fi';

interface NavbarProps {
  documentTitle?: string;
}

export default function Navbar({ documentTitle }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
            <FiBook className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              TTS Reader
            </h1>
          </div>

          {/* Document Title (Center) */}
          {documentTitle && (
            <div className="flex-1 text-center px-4 min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 truncate">
                {documentTitle}
              </h2>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <FiSun className="w-5 h-5 text-yellow-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
