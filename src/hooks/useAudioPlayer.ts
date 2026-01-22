/**
 * useAudioPlayer Hook
 * Convenient wrapper for audio playback functionality
 * 
 * Features:
 * - Automatic document loading
 * - Chunk synchronization
 * - Keyboard shortcuts
 * - Word position tracking for highlighting
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useAudioPlayerStore, formatTime, PLAYBACK_SPEEDS } from '@/store/audioPlayerStore';
import { useChunkStore } from '@/store/chunkStore';

interface UseAudioPlayerOptions {
  /** Document ID to play */
  documentId: string | null;
  /** Auto-load audio on mount */
  autoLoad?: boolean;
  /** Enable keyboard shortcuts */
  enableKeyboard?: boolean;
  /** Callback when chunk changes */
  onChunkChange?: (chunkId: number) => void;
}

interface UseAudioPlayerReturn {
  // State
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isReady: boolean;
  hasAudio: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  totalProgress: number;
  currentChunkId: number;
  totalChunks: number;
  playbackSpeed: number;
  error: string | null;
  
  // Formatted values
  currentTimeFormatted: string;
  durationFormatted: string;
  totalDurationFormatted: string;
  
  // Generation
  generationStatus: 'none' | 'pending' | 'generating' | 'completed' | 'failed';
  generationProgress: number;
  
  // Controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  seekToPercent: (percent: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  nextChunk: () => void;
  previousChunk: () => void;
  goToChunk: (chunkId: number) => void;
  setSpeed: (speed: number) => void;
  cycleSpeed: () => void;
  
  // Audio generation
  generateAudio: (voiceId?: string) => Promise<void>;
  
  // Utilities
  availableSpeeds: number[];
}

export function useAudioPlayer({
  documentId,
  autoLoad = true,
  enableKeyboard = false,
  onChunkChange,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  // Get store state
  const store = useAudioPlayerStore();
  const chunkStore = useChunkStore();

  // Extract needed values
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
    generateAudio: storeGenerateAudio,
    play,
    pause,
    stop,
    seekTo,
    goToChunk,
    nextChunk: storeNextChunk,
    previousChunk: storePreviousChunk,
    setPlaybackSpeed,
  } = store;

  // Computed values
  const isReady = audioMetadata !== null && audioMetadata.status === 'completed';
  const hasAudio = audioMetadata !== null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const totalProgress = totalChunks > 0
    ? ((currentChunkId + progress / 100) / totalChunks) * 100
    : 0;

  // Formatted times
  const currentTimeFormatted = formatTime(currentTime);
  const durationFormatted = formatTime(duration);
  const totalDurationFormatted = audioMetadata
    ? formatTime(audioMetadata.totalDurationSec)
    : '0:00';

  // Generation status
  const genStatus = generationStatus?.status || 'none';
  const genProgress = generationStatus?.progress || 0;

  // Auto-load on document change
  useEffect(() => {
    if (autoLoad && documentId) {
      loadDocument(documentId);
    }
  }, [autoLoad, documentId, loadDocument]);

  // Sync chunk store with audio player
  useEffect(() => {
    if (documentId) {
      chunkStore.setCurrentChunk(currentChunkId);
    }
  }, [documentId, currentChunkId, chunkStore]);

  // Notify on chunk change
  useEffect(() => {
    if (onChunkChange) {
      onChunkChange(currentChunkId);
    }
  }, [currentChunkId, onChunkChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) pause();
          else play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            storePreviousChunk();
          } else {
            seekTo(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            storeNextChunk();
          } else {
            seekTo(Math.min(duration, currentTime + 10));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          cycleSpeedFn();
          break;
        case 'ArrowDown':
          e.preventDefault();
          cycleSpeedDownFn();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, isPlaying, currentTime, duration, play, pause, seekTo, storePreviousChunk, storeNextChunk]);

  // Actions
  const togglePlayPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seekToPercent = useCallback(
    (percent: number) => {
      const time = (percent / 100) * duration;
      seekTo(Math.max(0, Math.min(time, duration)));
    },
    [duration, seekTo]
  );

  const skipForward = useCallback(
    (seconds: number = 10) => {
      seekTo(Math.min(currentTime + seconds, duration));
    },
    [currentTime, duration, seekTo]
  );

  const skipBackward = useCallback(
    (seconds: number = 10) => {
      seekTo(Math.max(currentTime - seconds, 0));
    },
    [currentTime, seekTo]
  );

  const cycleSpeedFn = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  const cycleSpeedDownFn = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const prevIndex = (currentIndex - 1 + PLAYBACK_SPEEDS.length) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[prevIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  const generateAudio = useCallback(
    async (voiceId?: string) => {
      await storeGenerateAudio(voiceId);
    },
    [storeGenerateAudio]
  );

  return {
    // State
    isPlaying,
    isPaused,
    isLoading,
    isReady,
    hasAudio,
    currentTime,
    duration,
    progress,
    totalProgress,
    currentChunkId,
    totalChunks,
    playbackSpeed,
    error,

    // Formatted values
    currentTimeFormatted,
    durationFormatted,
    totalDurationFormatted,

    // Generation
    generationStatus: genStatus,
    generationProgress: genProgress,

    // Controls
    play,
    pause,
    togglePlayPause,
    stop,
    seekTo,
    seekToPercent,
    skipForward,
    skipBackward,
    nextChunk: storeNextChunk,
    previousChunk: storePreviousChunk,
    goToChunk,
    setSpeed: setPlaybackSpeed,
    cycleSpeed: cycleSpeedFn,

    // Audio generation
    generateAudio,

    // Utilities
    availableSpeeds: PLAYBACK_SPEEDS,
  };
}

export default useAudioPlayer;
