'use client';

/**
 * Footer Component
 * Mobile-first responsive footer with attribution
 */

import { FiGithub, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-6">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col items-center gap-3 text-center">
          {/* Made with love */}
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <FiHeart className="w-3.5 h-3.5 mx-1 text-red-500" />
            <span>for book lovers</span>
          </div>
          
          {/* Copyright & Links */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>© {currentYear} TTS Reader</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <FiGithub className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Copyright */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>© {currentYear} TTS Reader</span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              Made with <FiHeart className="w-4 h-4 mx-1 text-red-500" /> for book lovers
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <FiGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
