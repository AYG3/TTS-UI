/**
 * useDocumentHistory Hook
 * Manages recently uploaded documents using localStorage
 * 
 * Features:
 * - Persists document history in localStorage
 * - Limits history to configurable max items
 * - Provides methods to add, remove, and clear history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HistoryDocument } from './types';

const STORAGE_KEY = 'tts-document-history';
const DEFAULT_MAX_ITEMS = 10;

interface UseDocumentHistoryOptions {
  maxItems?: number;
}

interface UseDocumentHistoryResult {
  /** List of recent documents */
  documents: HistoryDocument[];
  /** Whether history is loading */
  isLoading: boolean;
  /** Add a document to history */
  addDocument: (doc: HistoryDocument) => void;
  /** Remove a document from history */
  removeDocument: (documentId: string) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Update document audio status */
  updateAudioStatus: (documentId: string, hasAudio: boolean) => void;
}

export function useDocumentHistory(
  options: UseDocumentHistoryOptions = {}
): UseDocumentHistoryResult {
  const { maxItems = DEFAULT_MAX_ITEMS } = options;
  const [documents, setDocuments] = useState<HistoryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryDocument[];
        setDocuments(parsed.slice(0, maxItems));
      }
    } catch (error) {
      console.error('Failed to load document history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  // Save to localStorage whenever documents change
  const saveToStorage = useCallback((docs: HistoryDocument[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Failed to save document history:', error);
    }
  }, []);

  // Add a document to history (moves to front if already exists)
  const addDocument = useCallback((doc: HistoryDocument) => {
    setDocuments((prev) => {
      // Remove if already exists (we'll add to front)
      const filtered = prev.filter((d) => d.id !== doc.id);
      // Add to front and limit to maxItems
      const updated = [doc, ...filtered].slice(0, maxItems);
      saveToStorage(updated);
      return updated;
    });
  }, [maxItems, saveToStorage]);

  // Remove a document from history
  const removeDocument = useCallback((documentId: string) => {
    setDocuments((prev) => {
      const updated = prev.filter((d) => d.id !== documentId);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setDocuments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear document history:', error);
    }
  }, []);

  // Update audio status for a document
  const updateAudioStatus = useCallback((documentId: string, hasAudio: boolean) => {
    setDocuments((prev) => {
      const updated = prev.map((d) =>
        d.id === documentId ? { ...d, hasAudio } : d
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  return {
    documents,
    isLoading,
    addDocument,
    removeDocument,
    clearHistory,
    updateAudioStatus,
  };
}

export default useDocumentHistory;
