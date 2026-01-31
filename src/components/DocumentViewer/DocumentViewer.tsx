'use client';

/**
 * DocumentViewer Component
 * Main orchestrator for viewing uploaded documents
 * Supports PDF with TOC and pinch-to-zoom, and text files
 */

import { memo, useEffect } from 'react';
import type { Document } from '@/types';
import { useDocumentViewer } from './hooks/useDocumentViewer';
import { DocumentStatsBar } from './DocumentStatsBar';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import { TextDocumentViewer } from './TextDocumentViewer';

interface DocumentViewerProps {
  /** The document to display */
  document: Document;
}

export const DocumentViewer = memo(function DocumentViewer({ document }: DocumentViewerProps) {
  const {
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
  } = useDocumentViewer();

  // Set document ID when document changes - enables word click → audio seek
  // and resets audio player when switching documents
  useEffect(() => {
    setDocumentId(document.id);
  }, [document.id, setDocumentId]);

  const isPdf = document.fileType === 'pdf';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border border-gray-200 dark:border-gray-800">
      {/* Stats Bar */}
      <DocumentStatsBar
        document={document}
        currentPage={isPdf ? currentPage : undefined}
        scale={isPdf ? scale : undefined}
        isTocOpen={isTocOpen}
        onToggleToc={isPdf ? toggleToc : undefined}
      />

      {/* Document Content */}
      {isPdf ? (
        <PdfDocumentViewer
          document={document}
          activeWordIndex={activeWordIndex}
          hoveredWordIndex={hoveredWordIndex}
          currentPage={currentPage}
          targetPage={targetPage}
          pdfDocument={pdfDocument}
          isTocOpen={isTocOpen}
          sidebarWidth={sidebarWidth}
          scale={scale}
          viewMode={viewMode}
          onDocumentLoad={handleDocumentLoad}
          onPageChange={handlePageChange}
          onTocNavigate={handleTocNavigate}
          onToggleToc={toggleToc}
          onWordClick={handleWordClick}
          onWordHover={handleWordHover}
          onZoomChange={handleZoomChange}
          onSidebarWidthChange={handleSidebarWidthChange}
          onViewModeChange={handleViewModeChange}
        />
      ) : (
        <TextDocumentViewer document={document} />
      )}
    </div>
  );
});

export default DocumentViewer;
