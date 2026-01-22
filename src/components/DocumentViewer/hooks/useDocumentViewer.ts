'use client';

/**
 * useDocumentViewer Hook
 * Manages document viewer state and interactions
 */

import { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface DocumentViewerState {
  /** Currently active word index for TTS highlighting */
  activeWordIndex: number | undefined;
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
  /** Handle word click */
  handleWordClick: (event: { word: any }) => void;
  /** Handle zoom change */
  handleZoomChange: (newScale: number) => void;
  /** Handle sidebar width change */
  handleSidebarWidthChange: (width: number) => void;
  /** Reset zoom to default */
  resetZoom: () => void;
}

export interface UseDocumentViewerResult extends DocumentViewerState, DocumentViewerActions {}

const DEFAULT_SCALE = 1.5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export function useDocumentViewer(): UseDocumentViewerResult {
  // State
  const [activeWordIndex, setActiveWordIndex] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false); // Closed by default on mobile
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [scale, setScale] = useState(DEFAULT_SCALE);

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

  const handleWordClick = useCallback((event: { word: any }) => {
    const wordIndex = event.word.globalIndex;
    console.log(`Word clicked: "${event.word.text}" at global index ${wordIndex}`);
    setActiveWordIndex(wordIndex);
    // TODO: When audio player is implemented, seek to this word
  }, []);

  const handleZoomChange = useCallback((newScale: number) => {
    setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale)));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  return {
    // State
    activeWordIndex,
    currentPage,
    targetPage,
    pdfDocument,
    isTocOpen,
    sidebarWidth,
    scale,
    // Actions
    handleDocumentLoad,
    handlePageChange,
    handleTocNavigate,
    toggleToc,
    handleWordClick,
    handleZoomChange,
    handleSidebarWidthChange,
    resetZoom,
  };
}

export default useDocumentViewer;
