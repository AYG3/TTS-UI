/**
 * Document API Service
 * Handle all document-related API calls
 */

import apiClient from './apiClient';
import { Document, ApiResponse, NlpDocumentResult, ChunkMetadata, ChunkLookupResult, ChunkNavigation } from '@/types';

export const documentApi = {
  /**
   * Upload a document file
   */
  upload: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<Document>>(
      '/api/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Upload failed');
    }

    return response.data.data;
  },

  /**
   * Get document by ID
   */
  getDocument: async (id: string): Promise<Document> => {
    const response = await apiClient.get<ApiResponse<Document>>(
      `/api/upload/${id}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch document');
    }

    return response.data.data;
  },

  /**
   * Get NLP analysis for a document
   * Loaded separately for performance (can be large for big documents)
   */
  getNlpData: async (id: string): Promise<NlpDocumentResult | null> => {
    try {
      const response = await apiClient.get<ApiResponse<NlpDocumentResult>>(
        `/api/upload/${id}/nlp`
      );

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      // NLP data may not exist for older documents
      return null;
    }
  },

  /**
   * Get chunk metadata for a document
   * Returns all chunk boundaries for TTS audio segmentation
   */
  getChunks: async (id: string): Promise<ChunkMetadata | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ChunkMetadata>>(
        `/api/upload/${id}/chunks`
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
   * Get a specific chunk with navigation context
   */
  getChunk: async (
    documentId: string,
    chunkId: number
  ): Promise<ChunkNavigation & { documentId: string; totalDurationSec: number } | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<ChunkNavigation & { documentId: string; totalDurationSec: number }>
      >(`/api/upload/${documentId}/chunks/${chunkId}`);

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Find chunk containing a specific word
   * Used for click-to-seek functionality
   */
  findChunkByWord: async (
    documentId: string,
    wordId: number
  ): Promise<ChunkLookupResult & { documentId: string } | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<ChunkLookupResult & { documentId: string }>
      >(`/api/upload/${documentId}/chunks/find?wordId=${wordId}`);

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Get text content for a specific chunk
   * Used for TTS generation
   */
  getChunkText: async (
    documentId: string,
    chunkId: number
  ): Promise<{
    chunkId: number;
    text: string;
    wordCount: number;
    startWordId: number;
    endWordId: number;
    estimatedDurationSec: number;
  } | null> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          chunkId: number;
          text: string;
          wordCount: number;
          startWordId: number;
          endWordId: number;
          estimatedDurationSec: number;
        }>
      >(`/api/upload/${documentId}/chunks/${chunkId}/text`);

      if (!response.data.success || !response.data.data) {
        return null;
      }

      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Delete document
   */
  deleteDocument: async (id: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>(
      `/api/upload/${id}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete document');
    }
  },
};
