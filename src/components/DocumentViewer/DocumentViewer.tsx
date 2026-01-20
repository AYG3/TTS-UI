'use client';

/**
 * DocumentViewer Component
 * Main orchestrator for viewing uploaded documents
 * Supports PDF with TOC and pinch-to-zoom, and text files
 */

import { memo } from 'react';
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
    currentPage,
    targetPage,
    pdfDocument,
    isTocOpen,
    scale,
    // Actions
    handleDocumentLoad,
    handlePageChange,
    handleTocNavigate,
    toggleToc,
    handleWordClick,
    handleZoomChange,
    resetZoom,
  } = useDocumentViewer();

  const isPdf = document.fileType === 'pdf';

  // Zoom handlers
  const handleZoomIn = () => handleZoomChange(scale + 0.25);
  const handleZoomOut = () => handleZoomChange(scale - 0.25);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg md:shadow-xl border border-gray-200 dark:border-gray-800">
      {/* Stats Bar */}
      <DocumentStatsBar
        document={document}
        currentPage={isPdf ? currentPage : undefined}
        scale={isPdf ? scale : undefined}
        isTocOpen={isTocOpen}
        onToggleToc={isPdf ? toggleToc : undefined}
        onZoomIn={isPdf ? handleZoomIn : undefined}
        onZoomOut={isPdf ? handleZoomOut : undefined}
        onResetZoom={isPdf ? resetZoom : undefined}
      />

      {/* Document Content */}
      {isPdf ? (
        <PdfDocumentViewer
          document={document}
          activeWordIndex={activeWordIndex}
          currentPage={currentPage}
          targetPage={targetPage}
          pdfDocument={pdfDocument}
          isTocOpen={isTocOpen}
          scale={scale}
          onDocumentLoad={handleDocumentLoad}
          onPageChange={handlePageChange}
          onTocNavigate={handleTocNavigate}
          onToggleToc={toggleToc}
          onWordClick={handleWordClick}
          onZoomChange={handleZoomChange}
        />
      ) : (
        <TextDocumentViewer document={document} />
      )}
    </div>
  );
});

export default DocumentViewer;
