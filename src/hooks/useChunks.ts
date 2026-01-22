/**
 * useChunks Hook
 * Provides convenient access to chunk state and actions
 * 
 * Features:
 * - Load chunks on document change
 * - Track current playback position
 * - Prefetch next chunk for seamless playback
 * - Handle word clicks for seeking
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useChunkStore, chunkSelectors } from '@/store/chunkStore';
import { Chunk } from '@/types';

interface UseChunksOptions {
  /** Document ID to load chunks for */
  documentId: string | null;
  /** Auto-load chunks when documentId changes */
  autoLoad?: boolean;
  /** Current word index for tracking playback position */
  activeWordIndex?: number;
}

interface UseChunksReturn {
  // State
  chunks: Chunk[];
  totalChunks: number;
  currentChunk: Chunk | null;
  currentChunkId: number;
  isLoading: boolean;
  error: string | null;

  // Navigation
  previousChunk: Chunk | null;
  nextChunk: Chunk | null;
  isFirstChunk: boolean;
  isLastChunk: boolean;

  // Duration info
  totalDurationSec: number;
  totalDurationFormatted: string;
  currentChunkDurationSec: number;
  progress: number;

  // Actions
  loadChunks: () => Promise<void>;
  goToChunk: (chunkId: number) => void;
  goToNextChunk: () => void;
  goToPreviousChunk: () => void;
  seekToWord: (wordId: number) => void;
  clearChunks: () => void;

  // Utilities
  getChunkForWord: (wordId: number) => Chunk | null;
  isWordInCurrentChunk: (wordId: number) => boolean;
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Binary search to find chunk containing a word
 */
function findChunkByWordId(chunks: Chunk[], wordId: number): Chunk | null {
  if (chunks.length === 0) return null;

  let left = 0;
  let right = chunks.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const chunk = chunks[mid];

    if (wordId < chunk.startWordId) {
      right = mid - 1;
    } else if (wordId > chunk.endWordId) {
      left = mid + 1;
    } else {
      return chunk;
    }
  }

  return null;
}

export function useChunks({
  documentId,
  autoLoad = true,
  activeWordIndex,
}: UseChunksOptions): UseChunksReturn {
  // Store state
  const chunkMetadata = useChunkStore((state) => state.chunkMetadata);
  const currentChunkId = useChunkStore((state) => state.currentChunkId);
  const isLoading = useChunkStore((state) => state.isLoading);
  const error = useChunkStore((state) => state.error);

  // Store actions
  const storeLoadChunks = useChunkStore((state) => state.loadChunks);
  const setCurrentChunk = useChunkStore((state) => state.setCurrentChunk);
  const storeGoToNext = useChunkStore((state) => state.goToNextChunk);
  const storeGoToPrevious = useChunkStore((state) => state.goToPreviousChunk);
  const storeSeekToWord = useChunkStore((state) => state.seekToWord);
  const storeClearChunks = useChunkStore((state) => state.clearChunks);

  // Derived values using selectors
  const state = useChunkStore.getState();
  const currentChunk = chunkSelectors.getCurrentChunk(state);
  const previousChunk = chunkSelectors.getPreviousChunk(state);
  const nextChunk = chunkSelectors.getNextChunk(state);
  const isFirstChunk = chunkSelectors.isFirstChunk(state);
  const isLastChunk = chunkSelectors.isLastChunk(state);
  const progress = chunkSelectors.getProgress(state);

  // Chunks array
  const chunks = useMemo(() => {
    return chunkMetadata?.chunks ?? [];
  }, [chunkMetadata]);

  // Total chunks count
  const totalChunks = chunkMetadata?.totalChunks ?? 0;

  // Duration info
  const totalDurationSec = chunkMetadata?.totalDurationSec ?? 0;
  const totalDurationFormatted = useMemo(() => {
    return formatDuration(totalDurationSec);
  }, [totalDurationSec]);
  const currentChunkDurationSec = currentChunk?.estimatedDurationSec ?? 0;

  // Load chunks action
  const loadChunks = useCallback(async () => {
    if (!documentId) return;
    await storeLoadChunks(documentId);
  }, [documentId, storeLoadChunks]);

  // Auto-load chunks when documentId changes
  useEffect(() => {
    if (autoLoad && documentId) {
      loadChunks();
    }
    // Cleanup when documentId changes
    return () => {
      if (!documentId) {
        storeClearChunks();
      }
    };
  }, [documentId, autoLoad, loadChunks, storeClearChunks]);

  // Update current chunk based on active word index
  useEffect(() => {
    if (activeWordIndex !== undefined && chunks.length > 0) {
      const chunk = findChunkByWordId(chunks, activeWordIndex);
      if (chunk && chunk.chunkId !== currentChunkId) {
        setCurrentChunk(chunk.chunkId);
      }
    }
  }, [activeWordIndex, chunks, currentChunkId, setCurrentChunk]);

  // Utility: Get chunk for a specific word
  const getChunkForWord = useCallback(
    (wordId: number): Chunk | null => {
      return findChunkByWordId(chunks, wordId);
    },
    [chunks]
  );

  // Utility: Check if word is in current chunk
  const isWordInCurrentChunk = useCallback(
    (wordId: number): boolean => {
      if (!currentChunk) return false;
      return wordId >= currentChunk.startWordId && wordId <= currentChunk.endWordId;
    },
    [currentChunk]
  );

  return {
    // State
    chunks,
    totalChunks,
    currentChunk,
    currentChunkId,
    isLoading,
    error,

    // Navigation
    previousChunk,
    nextChunk,
    isFirstChunk,
    isLastChunk,

    // Duration info
    totalDurationSec,
    totalDurationFormatted,
    currentChunkDurationSec,
    progress,

    // Actions
    loadChunks,
    goToChunk: setCurrentChunk,
    goToNextChunk: storeGoToNext,
    goToPreviousChunk: storeGoToPrevious,
    seekToWord: storeSeekToWord,
    clearChunks: storeClearChunks,

    // Utilities
    getChunkForWord,
    isWordInCurrentChunk,
  };
}

export default useChunks;
