/**
 * MiniPlayer Component
 * Compact audio player for embedding in headers or sidebars
 * 
 * Features:
 * - Minimal footprint
 * - Play/pause toggle
 * - Progress indicator
 * - Expandable to full player
 */

'use client';

import React from 'react';
import { useAudioPlayerStore, formatTime } from '@/store/audioPlayerStore';
import { PlayIcon, PauseIcon } from './AudioPlayerIcons';
import { LoadingSpinner } from './AudioPlayerIcons';

interface MiniPlayerProps {
  /** Callback to expand to full player */
  onExpand?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function MiniPlayer({ onExpand, className = '' }: MiniPlayerProps) {
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    currentChunkId,
    totalChunks,
    audioMetadata,
    play,
    pause,
  } = useAudioPlayerStore();

  // Don't render if no audio loaded
  if (!audioMetadata) {
    return null;
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`mini-player flex items-center gap-3 bg-gray-900 text-white rounded-full px-2 py-1.5 ${className}`}
      onClick={onExpand}
      role={onExpand ? 'button' : undefined}
      tabIndex={onExpand ? 0 : undefined}
    >
      {/* Play/Pause button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
        disabled={isLoading}
        className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <MiniLoadingSpinner />
        ) : isPlaying ? (
          <MiniPauseIcon />
        ) : (
          <MiniPlayIcon />
        )}
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time display */}
      <span className="text-xs font-mono text-gray-400 shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Chunk indicator */}
      <span className="text-xs text-gray-500 shrink-0">
        {currentChunkId + 1}/{totalChunks}
      </span>

      {/* Expand icon */}
      {onExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Expand player"
        >
          <ExpandIcon />
        </button>
      )}
    </div>
  );
}

// Compact icons (smaller versions)
function MiniPlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function MiniPauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function MiniLoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
    </svg>
  );
}

function ExpandIcon() {
  return (
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
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export default MiniPlayer;
