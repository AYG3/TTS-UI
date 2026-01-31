/**
 * Document Store (Zustand)
 * Global state management for documents
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Document } from '@/types';
import { documentApi } from '@/lib/documentApi';

interface DocumentState {
  // State
  currentDocument: Document | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  isLoading: boolean;

  // Actions
  uploadDocument: (file: File) => Promise<void>;
  loadDocument: (documentId: string) => Promise<void>;
  clearDocument: () => void;
  clearError: () => void;
  setError: (error: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  devtools(
    (set) => ({
      // Initial state
      currentDocument: null,
      isUploading: false,
      uploadProgress: 0,
      error: null,
      isLoading: false,

      // Upload document action
      uploadDocument: async (file: File) => {
        set({ isUploading: true, uploadProgress: 0, error: null });

        try {
          const document = await documentApi.upload(file, (progress) => {
            set({ uploadProgress: progress });
          });

          set({
            currentDocument: document,
            isUploading: false,
            uploadProgress: 100,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed';
          set({
            error: errorMessage,
            isUploading: false,
            uploadProgress: 0,
            currentDocument: null,
          });
          throw error;
        }
      },

      // Load document by ID (from history)
      loadDocument: async (documentId: string) => {
        set({ isLoading: true, error: null });

        try {
          const document = await documentApi.getDocument(documentId);
          set({
            currentDocument: document,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load document';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      // Clear current document
      clearDocument: () => {
        set({
          currentDocument: null,
          uploadProgress: 0,
          error: null,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set error
      setError: (error: string) => {
        set({ error });
      },
    }),
    { name: 'DocumentStore' }
  )
);
