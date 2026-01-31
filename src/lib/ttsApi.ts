/**
 * TTS API Service
 * Handle all TTS-related API calls
 */

import apiClient from './apiClient';
import { ApiResponse, Voice, DocumentAudioMetadata, GenerationStatus, AudioFileMetadata } from '@/types';

/** API base URL for constructing audio URLs */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ttsApi = {
  /**
   * Check TTS service health
   */
  checkHealth: async (): Promise<{
    available: boolean;
    provider: string;
    defaultVoiceId: string;
  }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          available: boolean;
          provider: string;
          defaultVoiceId: string;
        }>
      >('/api/tts/health');

      if (!response.data.success || !response.data.data) {
        return { available: false, provider: '', defaultVoiceId: '' };
      }

      return response.data.data;
    } catch {
      return { available: false, provider: '', defaultVoiceId: '' };
    }
  },

  /**
   * Get available voices
   */
  getVoices: async (): Promise<{
    provider: string;
    defaultVoiceId: string;
    voices: Voice[];
  } | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          provider: string;
          defaultVoiceId: string;
          voices: Voice[];
        }>
      >('/api/tts/voices');

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Start audio generation for a document (progressive mode)
   * Returns immediately with estimated duration; generates initial chunks in background
   */
  generateAudio: async (
    documentId: string,
    options?: {
      voiceId?: string;
      speed?: number;
      chunkIds?: number[];
    }
  ): Promise<{ 
    documentId: string; 
    status: string;
    totalChunks?: number;
    estimatedTotalDurationSec?: number;
    initialChunksToGenerate?: number;
  } | null> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ 
          documentId: string; 
          status: string;
          totalChunks?: number;
          estimatedTotalDurationSec?: number;
          initialChunksToGenerate?: number;
        }>
      >('/api/tts/generate', {
        documentId,
        ...options,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to start generation');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to start audio generation:', error);
      throw error;
    }
  },

  /**
   * Generate audio and wait for completion (sync)
   */
  generateAudioSync: async (
    documentId: string,
    options?: {
      voiceId?: string;
      speed?: number;
      chunkIds?: number[];
    }
  ): Promise<DocumentAudioMetadata> => {
    const response = await apiClient.post<ApiResponse<DocumentAudioMetadata>>(
      '/api/tts/generate/sync',
      {
        documentId,
        ...options,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate audio');
    }

    return response.data.data;
  },

  /**
   * Get audio generation status
   */
  getStatus: async (documentId: string): Promise<GenerationStatus> => {
    try {
      const response = await apiClient.get<ApiResponse<GenerationStatus>>(
        `/api/tts/${documentId}/status`
      );

      if (!response.data.success || !response.data.data) {
        return { status: 'none' };
      }

      return response.data.data;
    } catch {
      return { status: 'none' };
    }
  },

  /**
   * Get audio metadata for a document
   */
  getAudioMetadata: async (documentId: string): Promise<DocumentAudioMetadata | null> => {
    try {
      const response = await apiClient.get<ApiResponse<DocumentAudioMetadata>>(
        `/api/tts/${documentId}/metadata`
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Generate audio for a single chunk on-demand
   * Used for preloading next chunks during playback
   */
  generateChunk: async (
    documentId: string,
    chunkId: number,
    voiceId?: string
  ): Promise<AudioFileMetadata> => {
    try {
      const response = await apiClient.post<ApiResponse<AudioFileMetadata>>(
        '/api/tts/generate/chunk',
        {
          documentId,
          chunkId,
          voiceId,
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to generate chunk');
      }

      return response.data.data;
    } catch (error) {
      console.error(`Failed to generate chunk ${chunkId}:`, error);
      throw error;
    }
  },

  /**
   * Get audio URL for a chunk
   */
  getChunkAudioUrl: (documentId: string, chunkId: number): string => {
    return `${API_BASE}/api/tts/${documentId}/audio/${chunkId}`;
  },

  /**
   * Trigger prefetch of upcoming chunks (progressive generation)
   * Called automatically when playback reaches 80% of current chunk
   */
  prefetchChunks: async (
    documentId: string,
    currentChunkId: number,
    voiceId?: string
  ): Promise<{ chunksQueued: number[]; alreadyGenerated: number[] }> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ chunksQueued: number[]; alreadyGenerated: number[] }>
      >('/api/tts/prefetch', {
        documentId,
        currentChunkId,
        voiceId,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to prefetch chunks');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to prefetch chunks:', error);
      throw error;
    }
  },

  /**
   * Delete all audio for a document
   */
  deleteAudio: async (documentId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>(
      `/api/tts/${documentId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete audio');
    }
  },
};
