/**
 * SpeedSelector Component
 * Dropdown menu for selecting playback speed
 * 
 * Features:
 * - Styled dropdown with all speed options
 * - Shows current selection
 * - Closes on outside click
 * - Keyboard accessible
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { PLAYBACK_SPEEDS } from '@/store/audioPlayerStore';

interface SpeedSelectorProps {
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** Callback to close the dropdown */
  onClose: () => void;
  /** Current playback speed */
  currentSpeed: number;
  /** Callback when speed is selected */
  onSpeedChange: (speed: number) => void;
}

export function SpeedSelector({
  isOpen,
  onClose,
  currentSpeed,
  onSpeedChange,
}: SpeedSelectorProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close on open click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-full right-0 mb-2 w-24 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50"
      role="listbox"
      aria-label="Playback speed options"
    >
      <div className="py-1">
        {PLAYBACK_SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center justify-between ${
              currentSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'text-gray-200 hover:bg-gray-700'
            }`}
            role="option"
            aria-selected={currentSpeed === speed}
          >
            <span className="font-medium">{speed}×</span>
            {currentSpeed === speed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SpeedSelector;
