/**
 * AudioPlayerControls Component
 * Playback control buttons (play, pause, skip, etc.)
 */

'use client';

import React from 'react';
import {
  PlayIcon,
  PauseIcon,
  PreviousIcon,
  NextIcon,
  SkipBackIcon,
  SkipForwardIcon,
  LoadingSpinner,
} from './AudioPlayerIcons';

interface AudioPlayerControlsProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether player is loading */
  isLoading: boolean;
  /** Current chunk ID (0-based) */
  currentChunkId: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Current playback time in seconds */
  currentTime: number;
  /** Callback to toggle play/pause */
  onPlayPause: () => void;
  /** Callback to skip backward 10 seconds */
  onSkipBackward: () => void;
  /** Callback to skip forward 10 seconds */
  onSkipForward: () => void;
  /** Callback to go to previous chunk */
  onPreviousChunk: () => void;
  /** Callback to go to next chunk */
  onNextChunk: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function AudioPlayerControls({
  isPlaying,
  isLoading,
  currentChunkId,
  totalChunks,
  currentTime,
  onPlayPause,
  onSkipBackward,
  onSkipForward,
  onPreviousChunk,
  onNextChunk,
  className = '',
}: AudioPlayerControlsProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Skip backward */}
      <button
        onClick={onSkipBackward}
        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Skip backward 10 seconds"
      >
        <SkipBackIcon />
      </button>

      {/* Previous chunk */}
      <button
        onClick={onPreviousChunk}
        disabled={currentChunkId === 0 && currentTime < 3}
        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        aria-label="Previous segment"
      >
        <PreviousIcon />
      </button>

      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        disabled={isLoading}
        className="w-16 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      {/* Next chunk */}
      <button
        onClick={onNextChunk}
        disabled={currentChunkId >= totalChunks - 1}
        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
        aria-label="Next segment"
      >
        <NextIcon />
      </button>

      {/* Skip forward */}
      <button
        onClick={onSkipForward}
        className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Skip forward 10 seconds"
      >
        <SkipForwardIcon />
      </button>
    </div>
  );
}

export default AudioPlayerControls;
