'use client';

/**
 * SettingsMenu Component
 * Dropdown menu for user preferences and settings
 */

import { useState, useRef, useEffect } from 'react';
import { FiSettings, FiCheck } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, invertPdfInDarkMode, togglePdfInversion } = useTheme();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 lg:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        style={{
          backgroundColor: theme === 'dark' ? '#1a1a1a' : undefined,
        }}
        aria-label="Settings"
        title="Settings"
      >
        <FiSettings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Settings
            </h3>
          </div>

          {/* Settings Options */}
          <div className="py-2">
            {/* PDF Dark Mode Inversion */}
            <button
              onClick={() => {
                togglePdfInversion();
              }}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              disabled={theme === 'light'}
            >
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Invert PDF Colors
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {theme === 'light' 
                    ? 'Enable dark mode to use this feature'
                    : 'Make PDFs easier to read in dark mode'
                  }
                </div>
              </div>
              <div className="ml-3">
                {theme === 'dark' && invertPdfInDarkMode && (
                  <FiCheck className="w-5 h-5 text-blue-500" />
                )}
                {theme === 'light' && (
                  <span className="text-xs text-gray-400">N/A</span>
                )}
              </div>
            </button>

            {/* Help Text */}
            <div className="px-4 py-2 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 Tip: Smart inversion makes PDFs readable in dark mode while preserving image colors. 
                Toggle this off if you prefer original PDF colors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
