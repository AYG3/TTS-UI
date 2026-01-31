'use client';

/**
 * useDocumentViewer Hook
 * Manages document viewer state and interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfViewMode } from '@/components/Pdf';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';

export interface DocumentViewerState {
  /** Currently active word index for TTS highlighting (from audio playback) */
  activeWordIndex: number | null;
  /** Currently hovered word index for preview highlighting */
  hoveredWordIndex: number | null;
  /** Current page being viewed */
  currentPage: number;
  /** Target page for navigation */
  targetPage: number | undefined;
  /** PDF document proxy for TOC extraction */
  pdfDocument: PDFDocumentProxy | null;
  /** Whether TOC sidebar is open */
  isTocOpen: boolean;
  /** Sidebar width in pixels */
  sidebarWidth: number;
  /** Current zoom scale */
  scale: number;
  /** Current view mode (continuous or single) */
  viewMode: PdfViewMode;
}

export interface DocumentViewerActions {
  /** Handle PDF document load */
  handleDocumentLoad: (pdfDoc: PDFDocumentProxy) => void;
  /** Handle page change */
  handlePageChange: (page: number) => void;
  /** Handle TOC navigation */
  handleTocNavigate: (page: number) => void;
  /** Toggle TOC sidebar */
  toggleToc: () => void;
  /** Handle word click - seeks audio to this word position */
  handleWordClick: (event: { word: any }) => void;
  /** Handle word hover - shows preview highlighting */
  handleWordHover: (wordIndex: number | null) => void;
  /** Handle zoom change */
  handleZoomChange: (newScale: number) => void;
  /** Handle sidebar width change */
  handleSidebarWidthChange: (width: number) => void;
  /** Handle view mode change */
  handleViewModeChange: (mode: PdfViewMode) => void;
  /** Reset zoom to default */
  resetZoom: () => void;
  /** Set document ID for audio coordination */
  setDocumentId: (id: string | null) => void;
}

export interface UseDocumentViewerResult extends DocumentViewerState, DocumentViewerActions {}

const DEFAULT_SCALE = 1.5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export function useDocumentViewer(): UseDocumentViewerResult {
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false); // Closed by default on mobile
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [viewMode, setViewMode] = useState<PdfViewMode>('continuous');
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  // Refs for tracking document changes
  const previousDocumentId = useRef<string | null>(null);

  // Audio player store for word click → audio seek
  const audioPlayerStore = useAudioPlayerStore();
  
  // Get active and hovered word from audio store
  const activeWordIndex = useAudioPlayerStore((state) => state.activeWordIndex);
  const hoveredWordIndex = useAudioPlayerStore((state) => state.hoveredWordIndex);
  
  // Debug: log when activeWordIndex changes
  useEffect(() => {
    console.log(`📍 useDocumentViewer: activeWordIndex changed to ${activeWordIndex}`);
  }, [activeWordIndex]);
  
  // Reset audio player when document changes
  useEffect(() => {
    if (documentId !== previousDocumentId.current) {
      // Document has changed
      if (previousDocumentId.current !== null && documentId !== null) {
        // Switching to a different document (not initial load)
        console.log('Document changed, resetting audio player');
        audioPlayerStore.reset();
      }
      previousDocumentId.current = documentId;
    }
  }, [documentId, audioPlayerStore]);

  // Actions
  const handleDocumentLoad = useCallback((pdfDoc: PDFDocumentProxy) => {
    console.log('PDF Document loaded:', {
      numPages: pdfDoc.numPages,
      fingerprints: pdfDoc.fingerprints,
    });
    setPdfDocument(pdfDoc);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTocNavigate = useCallback((page: number) => {
    setTargetPage(page);
    // Close TOC on mobile after navigation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsTocOpen(false);
    }
    // Reset after navigation
    setTimeout(() => setTargetPage(undefined), 100);
  }, []);

  const toggleToc = useCallback(() => {
    setIsTocOpen((prev) => !prev);
  }, []);

  /**
   * Handle word click - seeks audio to word position using playFromWord()
   * This delegates to the audio store which handles:
   * 1. Finding the correct chunk
   * 2. Generating audio if needed
   * 3. Seeking to the correct position within the chunk
   * 4. Starting playback
   */
  const handleWordClick = useCallback(async (event: { word: any }) => {
    const wordIndex = event.word.globalIndex;
    console.log(`Word clicked: "${event.word.text}" at global index ${wordIndex}`);

    // Use the audio store's playFromWord which handles all the complexity
    audioPlayerStore.playFromWord(wordIndex);
  }, [audioPlayerStore]);

  /**
   * Handle word hover - sets the hovered word for preview highlighting
   */
  const handleWordHover = useCallback((wordIndex: number | null) => {
    audioPlayerStore.setHoveredWord(wordIndex);
  }, [audioPlayerStore]);

  const handleZoomChange = useCallback((newScale: number) => {
    setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const handleViewModeChange = useCallback((mode: PdfViewMode) => {
    setViewMode(mode);
  }, []);

  return {
    // State
    activeWordIndex,
    hoveredWordIndex,
    currentPage,
    targetPage,
    pdfDocument,
    isTocOpen,
    sidebarWidth,
    scale,
    viewMode,
    // Actions
    handleDocumentLoad,
    handlePageChange,
    handleTocNavigate,
    toggleToc,
    handleWordClick,
    handleWordHover,
    handleZoomChange,
    handleSidebarWidthChange,
    handleViewModeChange,
    resetZoom,
    setDocumentId,
  };
}

export default useDocumentViewer;
