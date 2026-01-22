/**
 * Chunk Store (Zustand)
 * Global state management for text chunks and audio segmentation
 * 
 * Responsibilities:
 * - Track current chunk
 * - Provide chunk navigation
 * - Enable word-to-chunk lookup
 * - Support prefetching strategy
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Chunk, ChunkMetadata } from '@/types';
import { documentApi } from '@/lib/documentApi';

interface ChunkState {
  // State
  chunkMetadata: ChunkMetadata | null;
  currentChunkId: number;
  isLoading: boolean;
  error: string | null;

  // Derived getters (computed in selectors)
  currentChunk: Chunk | null;
  previousChunk: Chunk | null;
  nextChunk: Chunk | null;

  // Actions
  loadChunks: (documentId: string) => Promise<void>;
  setCurrentChunk: (chunkId: number) => void;
  goToNextChunk: () => void;
  goToPreviousChunk: () => void;
  seekToWord: (wordId: number) => void;
  clearChunks: () => void;
}

/**
 * Find chunk containing a word using binary search
 */
function findChunkByWordId(chunks: Chunk[], wordId: number): Chunk | null {
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

export const useChunkStore = create<ChunkState>()(
  devtools(
    (set, get) => ({
      // Initial state
      chunkMetadata: null,
      currentChunkId: 0,
      isLoading: false,
      error: null,

      // Derived state (computed via getters)
      get currentChunk() {
        const { chunkMetadata, currentChunkId } = get();
        if (!chunkMetadata) return null;
        return chunkMetadata.chunks.find((c) => c.chunkId === currentChunkId) || null;
      },

      get previousChunk() {
        const { chunkMetadata, currentChunkId } = get();
        if (!chunkMetadata || currentChunkId <= 0) return null;
        return chunkMetadata.chunks.find((c) => c.chunkId === currentChunkId - 1) || null;
      },

      get nextChunk() {
        const { chunkMetadata, currentChunkId } = get();
        if (!chunkMetadata) return null;
        const maxChunkId = chunkMetadata.totalChunks - 1;
        if (currentChunkId >= maxChunkId) return null;
        return chunkMetadata.chunks.find((c) => c.chunkId === currentChunkId + 1) || null;
      },

      // Load chunks for a document
      loadChunks: async (documentId: string) => {
        set({ isLoading: true, error: null });

        try {
          const chunkMetadata = await documentApi.getChunks(documentId);

          if (!chunkMetadata) {
            set({
              error: 'No chunk data available',
              isLoading: false,
              chunkMetadata: null,
            });
            return;
          }

          set({
            chunkMetadata,
            currentChunkId: 0,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load chunks';
          set({
            error: errorMessage,
            isLoading: false,
            chunkMetadata: null,
          });
        }
      },

      // Set current chunk by ID
      setCurrentChunk: (chunkId: number) => {
        const { chunkMetadata } = get();
        if (!chunkMetadata) return;

        // Validate chunk ID
        if (chunkId < 0 || chunkId >= chunkMetadata.totalChunks) {
          return;
        }

        set({ currentChunkId: chunkId });
      },

      // Navigate to next chunk
      goToNextChunk: () => {
        const { chunkMetadata, currentChunkId } = get();
        if (!chunkMetadata) return;

        const maxChunkId = chunkMetadata.totalChunks - 1;
        if (currentChunkId < maxChunkId) {
          set({ currentChunkId: currentChunkId + 1 });
        }
      },

      // Navigate to previous chunk
      goToPreviousChunk: () => {
        const { currentChunkId } = get();
        if (currentChunkId > 0) {
          set({ currentChunkId: currentChunkId - 1 });
        }
      },

      // Seek to chunk containing a word
      seekToWord: (wordId: number) => {
        const { chunkMetadata } = get();
        if (!chunkMetadata) return;

        const chunk = findChunkByWordId(chunkMetadata.chunks, wordId);
        if (chunk) {
          set({ currentChunkId: chunk.chunkId });
        }
      },

      // Clear all chunk state
      clearChunks: () => {
        set({
          chunkMetadata: null,
          currentChunkId: 0,
          isLoading: false,
          error: null,
        });
      },
    }),
    { name: 'ChunkStore' }
  )
);

/**
 * Selectors for derived state
 * Use these to access computed values from the store
 */
export const chunkSelectors = {
  /**
   * Get current chunk
   */
  getCurrentChunk: (state: ChunkState): Chunk | null => {
    if (!state.chunkMetadata) return null;
    return state.chunkMetadata.chunks.find((c) => c.chunkId === state.currentChunkId) || null;
  },

  /**
   * Get previous chunk
   */
  getPreviousChunk: (state: ChunkState): Chunk | null => {
    if (!state.chunkMetadata || state.currentChunkId <= 0) return null;
    return state.chunkMetadata.chunks.find((c) => c.chunkId === state.currentChunkId - 1) || null;
  },

  /**
   * Get next chunk
   */
  getNextChunk: (state: ChunkState): Chunk | null => {
    if (!state.chunkMetadata) return null;
    const maxChunkId = state.chunkMetadata.totalChunks - 1;
    if (state.currentChunkId >= maxChunkId) return null;
    return state.chunkMetadata.chunks.find((c) => c.chunkId === state.currentChunkId + 1) || null;
  },

  /**
   * Check if at first chunk
   */
  isFirstChunk: (state: ChunkState): boolean => {
    return state.currentChunkId === 0;
  },

  /**
   * Check if at last chunk
   */
  isLastChunk: (state: ChunkState): boolean => {
    if (!state.chunkMetadata) return true;
    return state.currentChunkId >= state.chunkMetadata.totalChunks - 1;
  },

  /**
   * Get total duration formatted
   */
  getTotalDuration: (state: ChunkState): string => {
    if (!state.chunkMetadata) return '0:00';
    return formatDuration(state.chunkMetadata.totalDurationSec);
  },

  /**
   * Get progress through document (0-1)
   */
  getProgress: (state: ChunkState): number => {
    if (!state.chunkMetadata || state.chunkMetadata.totalChunks === 0) return 0;
    return (state.currentChunkId + 1) / state.chunkMetadata.totalChunks;
  },
};

/**
 * Format seconds to MM:SS or HH:MM:SS
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
