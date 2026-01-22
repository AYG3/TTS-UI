/**
 * AudioPlayer Component
 * Full-featured audio player with mobile-first design
 * 
 * Features:
 * - Play/Pause/Stop controls
 * - Skip forward/backward 10 seconds
 * - Chunk navigation (previous/next)
 * - Playback speed control
 * - Progress bar with seeking
 * - Current chapter/section display
 * - Mobile-optimized touch targets
 */

'use client';

import React from 'react';
import { useAudioPlayerLogic } from './useAudioPlayerLogic';
import { AudioPlayerHeader } from './AudioPlayerHeader';
import { AudioPlayerProgress } from './AudioPlayerProgress';
import { AudioPlayerControls } from './AudioPlayerControls';
import { AudioPlayerGeneration } from './AudioPlayerGeneration';

interface AudioPlayerProps {
  /** Document ID to play */
  documentId: string | null;
  /** Chapter/section title to display */
  chapterTitle?: string;
  /** Callback when word position changes (for text highlighting) */
  onWordPositionChange?: (wordId: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export function AudioPlayer({
  documentId,
  chapterTitle,
  onWordPositionChange,
  className = '',
}: AudioPlayerProps) {
  const {
    // State
    isPlaying,
    isLoading,
    currentTime,
    currentChunkId,
    totalChunks,
    playbackSpeed,
    audioMetadata,
    generationStatus,
    error,
    progress,

    // Actions
    handlePlayPause,
    handleSeek,
    skipForward,
    skipBackward,
    cycleSpeed,
    generateAudio,
    nextChunk,
    previousChunk,
  } = useAudioPlayerLogic({ documentId, onWordPositionChange });

  // Show generation UI if no audio
  if (!audioMetadata && generationStatus?.status !== 'generating') {
    return (
      <AudioPlayerGeneration
        status="idle"
        isLoading={isLoading}
        documentId={documentId}
        onGenerate={generateAudio}
        className={className}
      />
    );
  }

  // Show generation progress
  if (generationStatus?.status === 'generating') {
    return (
      <AudioPlayerGeneration
        status="generating"
        progress={generationStatus.progress || 0}
        isLoading={isLoading}
        documentId={documentId}
        onGenerate={generateAudio}
        className={className}
      />
    );
  }

  return (
    <div className={`audio-player ${className}`}>
      {/* Main player container - fixed at bottom on mobile */}
      <div className="bg-gray-900 text-white rounded-t-2xl md:rounded-2xl">
        {/* Chapter info row */}
        <div className="px-4 pt-4 pb-2">
          <AudioPlayerHeader
            currentChunkId={currentChunkId}
            totalChunks={totalChunks}
            currentTime={currentTime}
            audioMetadata={audioMetadata}
            chapterTitle={chapterTitle}
          />
        </div>

        {/* Progress bar */}
        <AudioPlayerProgress progress={progress} onSeek={handleSeek} className="mx-4" />

        {/* Controls row */}
        <div className="px-4 py-4">
          <AudioPlayerControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            currentChunkId={currentChunkId}
            totalChunks={totalChunks}
            currentTime={currentTime}
            onPlayPause={handlePlayPause}
            onSkipBackward={skipBackward}
            onSkipForward={skipForward}
            onPreviousChunk={previousChunk}
            onNextChunk={nextChunk}
          />
        </div>

        {/* Speed control */}
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={cycleSpeed}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-medium transition-colors"
            aria-label={`Playback speed: ${playbackSpeed}x`}
          >
            {playbackSpeed}×
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 pb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioPlayer;
