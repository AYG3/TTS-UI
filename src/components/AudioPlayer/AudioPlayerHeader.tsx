/**
 * AudioPlayerHeader Component
 * Displays chapter info and time information
 */

'use client';

import React from 'react';
import { formatTime } from '@/store/audioPlayerStore';
import { DocumentAudioMetadata } from '@/types';

interface AudioPlayerHeaderProps {
  /** Current chunk ID (0-based) */
  currentChunkId: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Current playback time in seconds */
  currentTime: number;
  /** Audio metadata for total duration */
  audioMetadata: DocumentAudioMetadata | null;
  /** Chapter or section title */
  chapterTitle?: string;
  /** Additional CSS classes */
  className?: string;
}

export function AudioPlayerHeader({
  currentChunkId,
  totalChunks,
  currentTime,
  audioMetadata,
  chapterTitle,
  className = '',
}: AudioPlayerHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Language/Voice indicator */}
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
          <span className="text-lg">🇬🇧</span>
        </div>

        {/* Chapter title */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {chapterTitle || `Segment ${currentChunkId + 1}`}
          </p>
          <p className="text-xs text-gray-400">
            {currentChunkId + 1} of {totalChunks} segments
          </p>
        </div>
      </div>

      {/* Total duration */}
      <div className="text-right shrink-0">
        <p className="text-sm font-mono">{formatTime(currentTime)}</p>
        <p className="text-xs text-gray-400 font-mono">
          {audioMetadata ? formatTime(audioMetadata.totalDurationSec) : '0:00'}
        </p>
      </div>
    </div>
  );
}

export default AudioPlayerHeader;
