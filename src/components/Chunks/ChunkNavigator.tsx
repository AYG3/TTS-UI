/**
 * ChunkNavigator Component
 * Displays chunk navigation controls and progress information
 * 
 * Features:
 * - Previous/Next chunk buttons
 * - Current chunk indicator
 * - Total duration display
 * - Progress bar
 * - Click-to-jump to specific chunk
 */

'use client';

import React from 'react';
import { useChunks } from '@/hooks/useChunks';
import { Chunk } from '@/types';

interface ChunkNavigatorProps {
  /** Document ID to load chunks for */
  documentId: string | null;
  /** Current word index for tracking playback position */
  activeWordIndex?: number;
  /** Callback when chunk changes */
  onChunkChange?: (chunk: Chunk) => void;
  /** Callback when user clicks a word in a chunk */
  onSeekToWord?: (wordId: number) => void;
  /** Show compact view */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format seconds to readable time
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ChunkNavigator({
  documentId,
  activeWordIndex,
  onChunkChange,
  onSeekToWord,
  compact = false,
  className = '',
}: ChunkNavigatorProps) {
  const {
    chunks,
    totalChunks,
    currentChunk,
    currentChunkId,
    isLoading,
    error,
    isFirstChunk,
    isLastChunk,
    totalDurationFormatted,
    progress,
    goToChunk,
    goToNextChunk,
    goToPreviousChunk,
  } = useChunks({
    documentId,
    activeWordIndex,
  });

  // Notify parent when chunk changes
  React.useEffect(() => {
    if (currentChunk && onChunkChange) {
      onChunkChange(currentChunk);
    }
  }, [currentChunk, onChunkChange]);

  // Handle chunk click
  const handleChunkClick = (chunk: Chunk) => {
    goToChunk(chunk.chunkId);
    if (onSeekToWord) {
      onSeekToWord(chunk.startWordId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`chunk-navigator loading ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`chunk-navigator error ${className}`}>
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    );
  }

  // No chunks
  if (totalChunks === 0) {
    return null;
  }

  // Compact view (just prev/next buttons and indicator)
  if (compact) {
    return (
      <div className={`chunk-navigator compact flex items-center gap-2 ${className}`}>
        <button
          onClick={goToPreviousChunk}
          disabled={isFirstChunk}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous chunk"
        >
          <ChevronLeftIcon />
        </button>

        <span className="text-sm font-medium min-w-15 text-center">
          {currentChunkId + 1} / {totalChunks}
        </span>

        <button
          onClick={goToNextChunk}
          disabled={isLastChunk}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next chunk"
        >
          <ChevronRightIcon />
        </button>
      </div>
    );
  }

  // Full view
  return (
    <div className={`chunk-navigator flex flex-col gap-3 ${className}`}>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <button
          onClick={goToPreviousChunk}
          disabled={isFirstChunk}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous chunk"
        >
          <ChevronLeftIcon />
          <span className="text-sm">Prev</span>
        </button>

        {/* Center info */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium">
            Segment {currentChunkId + 1} of {totalChunks}
          </span>
          {currentChunk && (
            <span className="text-xs text-gray-500">
              ~{formatTime(currentChunk.estimatedDurationSec)} • {currentChunk.wordCount} words
            </span>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={goToNextChunk}
          disabled={isLastChunk}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next chunk"
        >
          <span className="text-sm">Next</span>
          <ChevronRightIcon />
        </button>
      </div>

      {/* Chunk list (expandable) */}
      {totalChunks > 1 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {chunks.map((chunk) => (
            <button
              key={chunk.chunkId}
              onClick={() => handleChunkClick(chunk)}
              className={`
                w-8 h-8 rounded text-xs font-medium transition-colors
                ${
                  chunk.chunkId === currentChunkId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }
              `}
              aria-label={`Go to segment ${chunk.chunkId + 1}`}
              title={`${chunk.wordCount} words, ~${formatTime(chunk.estimatedDurationSec)}`}
            >
              {chunk.chunkId + 1}
            </button>
          ))}
        </div>
      )}

      {/* Total duration */}
      <div className="text-center text-xs text-gray-500">
        Total: {totalDurationFormatted}
      </div>
    </div>
  );
}

// Simple icon components
function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default ChunkNavigator;
