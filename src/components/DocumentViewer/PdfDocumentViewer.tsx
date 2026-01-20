'use client';

/**
 * PdfDocumentViewer Component
 * Renders PDF with TOC sidebar and pinch-to-zoom support
 */

import { memo, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfWordClickViewer, TocSidebar, useTocOutline } from '@/components/Pdf';
import { usePinchZoom } from './hooks/usePinchZoom';
import type { Document } from '@/types';

interface PdfDocumentViewerProps {
  /** Document data */
  document: Document;
  /** Active word index for TTS highlighting */
  activeWordIndex?: number;
  /** Current page */
  currentPage: number;
  /** Target page for navigation */
  targetPage?: number;
  /** PDF document proxy */
  pdfDocument: PDFDocumentProxy | null;
  /** Whether TOC is open */
  isTocOpen: boolean;
  /** Current zoom scale */
  scale: number;
  /** Callbacks */
  onDocumentLoad: (pdfDoc: PDFDocumentProxy) => void;
  onPageChange: (page: number) => void;
  onTocNavigate: (page: number) => void;
  onToggleToc: () => void;
  onWordClick: (event: { word: any }) => void;
  onZoomChange: (scale: number) => void;
}

export const PdfDocumentViewer = memo(function PdfDocumentViewer({
  document,
  activeWordIndex,
  currentPage,
  targetPage,
  pdfDocument,
  isTocOpen,
  scale,
  onDocumentLoad,
  onPageChange,
  onTocNavigate,
  onToggleToc,
  onWordClick,
  onZoomChange,
}: PdfDocumentViewerProps) {
  // Get TOC from PDF document
  const { items: tocItems, isLoading: isTocLoading } = useTocOutline(pdfDocument);

  // Pinch-to-zoom support
  const { containerRef, setScale } = usePinchZoom({
    minScale: 0.5,
    maxScale: 4,
    initialScale: scale,
    onScaleChange: onZoomChange,
  });

  // Construct PDF URL from stored filename
  const getPdfUrl = useCallback(() => {
    // Use storedFilename if available, otherwise extract from filePath
    if (document.storedFilename) {
      return `http://localhost:3001/uploads/${document.storedFilename}`;
    }
    const filename = document.filePath?.split('/').pop() || document.filename;
    return `http://localhost:3001/uploads/${filename}`;
  }, [document]);

  const pdfUrl = getPdfUrl();

  return (
    <div 
      ref={containerRef}
      className="flex flex-col md:flex-row h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] touch-manipulation"
    >
      {/* TOC Sidebar - Hidden on mobile when closed, slide-over on mobile */}
      <div className={`
        ${isTocOpen ? 'fixed inset-0 z-40 md:relative md:inset-auto' : 'hidden md:block'}
      `}>
        {/* Mobile overlay backdrop */}
        {isTocOpen && (
          <div 
            className="absolute inset-0 bg-black/50 md:hidden"
            onClick={onToggleToc}
          />
        )}
        
        <TocSidebar
          items={tocItems}
          isLoading={isTocLoading}
          onNavigate={onTocNavigate}
          activePage={currentPage}
          isOpen={isTocOpen}
          onToggle={onToggleToc}
          initialWidth={280}
          minWidth={200}
          maxWidth={450}
        />
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <PdfWordClickViewer
          url={pdfUrl}
          onWordClick={onWordClick}
          activeWordIndex={activeWordIndex}
          onDocumentLoad={onDocumentLoad}
          onPageChange={onPageChange}
          externalPage={targetPage}
          initialScale={scale}
          className="h-full"
        />
      </div>
    </div>
  );
});

export default PdfDocumentViewer;
