/**
 * Document API Service
 * Handle all document-related API calls
 */

import apiClient from './apiClient';
import { Document, ApiResponse } from '@/types';

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
