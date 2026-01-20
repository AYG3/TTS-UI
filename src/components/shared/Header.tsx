'use client';

/**
 * Header Component
 * Mobile-first responsive header with branding and controls
 */

import { FiArrowLeft, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

interface HeaderProps {
  /** Current document title (if any) */
  documentTitle?: string;
  /** Whether a document is currently loaded */
  hasDocument: boolean;
  /** Callback to reset and upload new document */
  onReset: () => void;
}

export default function Header({ documentTitle, hasDocument, onReset }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between h-14">
          {/* Logo - Compact on mobile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📚</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              TTS
            </span>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <FiSun className="w-5 h-5 text-yellow-500" />
              )}
            </button>

            {/* Upload New - Only when document loaded */}
            {hasDocument && (
              <button
                onClick={onReset}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Upload new document"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Document Title Bar */}
        {hasDocument && documentTitle && (
          <div className="md:hidden px-1 pb-2 -mt-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {documentTitle}
            </p>
          </div>
        )}

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                TTS Reader
              </h1>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                Transform books into audio
              </p>
            </div>
          </div>

          {/* Center: Document Title */}
          {hasDocument && documentTitle && (
            <div className="flex-1 max-w-md mx-4 lg:mx-8">
              <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 truncate text-center">
                {documentTitle}
              </p>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {hasDocument && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="hidden lg:inline">Upload New</span>
                <span className="lg:hidden">New</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 lg:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
    </header>
  );
}
