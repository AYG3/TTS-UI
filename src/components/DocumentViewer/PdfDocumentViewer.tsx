'use client';

/**
 * PdfDocumentViewer Component
 * Renders PDF with TOC sidebar and pinch-to-zoom support
 */

import { memo, useCallback, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfWordClickViewer, useTocOutline, type PdfViewMode } from '@/components/Pdf';
import { TocPanel } from '@/components/Pdf/Toc/TocPanel';
import { ThumbnailPanel } from '@/components/Pdf/ThumbnailSidebar/ThumbnailPanel';
import { PdfSidebarShell, SidebarHeader, SidebarPanel, type SidebarMode } from '@/components/Pdf/SidebarShell';
import { usePinchZoom } from './hooks/usePinchZoom';
import { useTheme } from '@/contexts/ThemeContext';
import type { Document } from '@/types';

interface PdfDocumentViewerProps {
  /** Document data */
  document: Document;
  /** Active word index for TTS highlighting */
  activeWordIndex?: number | null;
  /** Hovered word index for preview highlighting */
  hoveredWordIndex?: number | null;
  /** Current page */
  currentPage: number;
  /** Target page for navigation */
  targetPage?: number;
  /** PDF document proxy */
  pdfDocument: PDFDocumentProxy | null;
  /** Whether TOC is open */
  isTocOpen: boolean;
  /** Sidebar width */
  sidebarWidth: number;
  /** Current zoom scale */
  scale: number;
  /** Current view mode */
  viewMode: PdfViewMode;
  /** Callbacks */
  onDocumentLoad: (pdfDoc: PDFDocumentProxy) => void;
  onPageChange: (page: number) => void;
  onTocNavigate: (page: number) => void;
  onToggleToc: () => void;
  onWordClick: (event: { word: any }) => void;
  onWordHover?: (wordIndex: number | null) => void;
  onZoomChange: (scale: number) => void;
  onSidebarWidthChange: (width: number) => void;
  onViewModeChange: (mode: PdfViewMode) => void;
}

export const PdfDocumentViewer = memo(function PdfDocumentViewer({
  document,
  activeWordIndex,
  hoveredWordIndex,
  currentPage,
  targetPage,
  pdfDocument,
  isTocOpen,
  sidebarWidth,
  scale,
  viewMode,
  onDocumentLoad,
  onPageChange,
  onTocNavigate,
  onToggleToc,
  onWordClick,
  onWordHover,
  onZoomChange,
  onSidebarWidthChange,
  onViewModeChange,
}: PdfDocumentViewerProps) {
  // Sidebar mode state: 'toc' or 'thumbnails'
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('toc');

  // Get theme for PDF dark mode inversion
  const { theme, invertPdfInDarkMode } = useTheme();
  const isDarkMode = theme === 'dark';

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
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    if (document.storedFilename) {
      return `${baseUrl}/uploads/${document.storedFilename}`;
    }
    const filename = document.filePath?.split('/').pop() || document.filename;
    return `${baseUrl}/uploads/${filename}`;
  }, [document]);

  const pdfUrl = getPdfUrl();



  return (
    <div 
      ref={containerRef}
      className="flex flex-col md:flex-row h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] touch-manipulation"
    >
      {/* Sidebar Shell */}
      <PdfSidebarShell
        isOpen={isTocOpen}
        width={sidebarWidth}
        minWidth={200}
        maxWidth={450}
        onResize={onSidebarWidthChange}
        onClose={onToggleToc}
      >
        {/* Sidebar Header with Tabs */}
        <SidebarHeader
          mode={sidebarMode}
          onModeChange={setSidebarMode}
          onClose={onToggleToc}
        />

        {/* TOC Panel */}
        <SidebarPanel mode={sidebarMode} panelMode="toc">
          <TocPanel
            items={tocItems}
            isLoading={isTocLoading}
            onNavigate={onTocNavigate}
            activePage={currentPage}
            onClose={onToggleToc}
          />
        </SidebarPanel>

        {/* Thumbnails Panel */}
        <SidebarPanel mode={sidebarMode} panelMode="thumbnails">
          <ThumbnailPanel
            pdf={pdfDocument}
            currentPage={currentPage}
            onPageSelect={onTocNavigate}
            options={{
              scale: 0.25,
              progressive: true,
              initialPages: 10,
            }}
          />
        </SidebarPanel>
      </PdfSidebarShell>

      {/* PDF Viewer */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <PdfWordClickViewer
          url={pdfUrl}
          onWordClick={onWordClick}
          activeWordIndex={activeWordIndex}
          hoveredWordIndex={hoveredWordIndex}
          onWordHover={onWordHover}
          onDocumentLoad={onDocumentLoad}
          onPageChange={onPageChange}
          onViewModeChange={onViewModeChange}
          externalPage={targetPage}
          initialScale={scale}
          initialViewMode={viewMode}
          className="h-full"
          isDarkMode={isDarkMode}
          invertPdfInDarkMode={invertPdfInDarkMode}
        />
      </div>
    </div>
  );
});

export default PdfDocumentViewer;
