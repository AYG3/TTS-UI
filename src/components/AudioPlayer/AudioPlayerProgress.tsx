/**
 * AudioPlayerProgress Component
 * Interactive progress bar with touch and mouse support
 */

'use client';

import React from 'react';

interface AudioPlayerProgressProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Callback when user seeks to new position */
  onSeek: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  /** Additional CSS classes */
  className?: string;
}

export function AudioPlayerProgress({
  progress,
  onSeek,
  className = '',
}: AudioPlayerProgressProps) {
  return (
    <div
      className={`h-1 bg-gray-700 rounded-full cursor-pointer ${className}`}
      onClick={onSeek}
      onTouchMove={onSeek}
    >
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default AudioPlayerProgress;
