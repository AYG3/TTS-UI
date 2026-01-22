/**
 * useAudioPlayerLogic Hook
 * Encapsulates audio player business logic and event handlers
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useAudioPlayerStore, PLAYBACK_SPEEDS } from '@/store/audioPlayerStore';

interface UseAudioPlayerLogicProps {
  /** Document ID to load */
  documentId: string | null;
  /** Callback when word position changes */
  onWordPositionChange?: (wordId: number) => void;
}

export function useAudioPlayerLogic({
  documentId,
  onWordPositionChange,
}: UseAudioPlayerLogicProps) {
  const {
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    currentChunkId,
    totalChunks,
    playbackSpeed,
    audioMetadata,
    generationStatus,
    error,
    loadDocument,
    generateAudio,
    play,
    pause,
    seekTo,
    nextChunk,
    previousChunk,
    setPlaybackSpeed,
    reset,
  } = useAudioPlayerStore();

  // Load document when ID changes
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    } else {
      reset();
    }
    return () => {
      // Don't reset on unmount - keep playing
    };
  }, [documentId, loadDocument, reset]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Handle seek via progress bar
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const percent = (clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      seekTo(Math.max(0, Math.min(newTime, duration)));
    },
    [duration, seekTo]
  );

  // Skip forward 10 seconds
  const skipForward = useCallback(() => {
    seekTo(Math.min(currentTime + 10, duration));
  }, [currentTime, duration, seekTo]);

  // Skip backward 10 seconds
  const skipBackward = useCallback(() => {
    seekTo(Math.max(currentTime - 10, 0));
  }, [currentTime, seekTo]);

  // Cycle through playback speeds
  const cycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate total progress across all chunks
  const totalProgress =
    totalChunks > 0 ? ((currentChunkId + progress / 100) / totalChunks) * 100 : 0;

  return {
    // State
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    currentChunkId,
    totalChunks,
    playbackSpeed,
    audioMetadata,
    generationStatus,
    error,
    progress,
    totalProgress,

    // Actions
    handlePlayPause,
    handleSeek,
    skipForward,
    skipBackward,
    cycleSpeed,
    generateAudio,
    nextChunk,
    previousChunk,
  };
}

export default useAudioPlayerLogic;
