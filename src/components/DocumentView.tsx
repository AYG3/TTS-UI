'use client';

/**
 * DocumentView Component
 * Display uploaded document with PDF viewer for PDFs or text viewer for TXT files
 * Includes collapsible, resizable TOC sidebar for PDF navigation
 */

import { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Document } from '@/types';
import { PdfWordClickViewer, TocSidebar, useTocOutline } from '@/components/Pdf';

interface DocumentViewProps {
  /** The document to display */
  document: Document;
}

export default function DocumentView({ document }: DocumentViewProps) {
  const [activeWordIndex, setActiveWordIndex] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(true);

  // Get TOC from PDF document
  const { items: tocItems, isLoading: isTocLoading, hasToc } = useTocOutline(pdfDocument);

  // Handle PDF document load
  const handleDocumentLoad = useCallback((pdfDoc: PDFDocumentProxy) => {
    console.log('PDF Document loaded:', {
      numPages: pdfDoc.numPages,
      fingerprints: pdfDoc.fingerprints,
    });
    setPdfDocument(pdfDoc);
  }, []);

  // Handle page change from PDF viewer
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle TOC navigation
  const handleTocNavigate = useCallback((page: number) => {
    setTargetPage(page);
    // Reset after navigation
    setTimeout(() => setTargetPage(undefined), 100);
  }, []);

  // Toggle TOC sidebar
  const toggleToc = useCallback(() => {
    setIsTocOpen((prev) => !prev);
  }, []);

  // Handle word click in PDF
  const handleWordClick = useCallback((event: { word: any }) => {
    const wordIndex = event.word.globalIndex;
    console.log(`Word clicked: "${event.word.text}" at global index ${wordIndex}`);
    setActiveWordIndex(wordIndex);
    
    // TODO: When audio player is implemented, seek to this word:
    // audioPlayer.seekToWord(wordIndex);
  }, []);

  // Render PDF viewer with TOC sidebar
  const renderPdfContent = () => {
    // Extract filename from filePath (e.g., "uploads/uuid-filename.pdf" -> "uuid-filename.pdf")
    const filename = document.filePath.split('/').pop() || document.filename;
    const pdfUrl = `http://localhost:3001/uploads/${filename}`;
    
    console.log('Rendering PDF:', {
      filename,
      filePath: document.filePath,
      pdfUrl,
      hasToc,
      tocItemsCount: tocItems.length,
    });

    return (
      <div className="flex h-[calc(100vh-200px)]">
        {/* TOC Sidebar */}
        <TocSidebar
          items={tocItems}
          isLoading={isTocLoading}
          onNavigate={handleTocNavigate}
          activePage={currentPage}
          isOpen={isTocOpen}
          onToggle={toggleToc}
          initialWidth={280}
          minWidth={200}
          maxWidth={450}
        />

        {/* PDF Viewer */}
        <div className="flex-1 min-w-0">
          <PdfWordClickViewer
            url={pdfUrl}
            onWordClick={handleWordClick}
            activeWordIndex={activeWordIndex}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            externalPage={targetPage}
            initialScale={1.5}
            className="h-full"
          />
        </div>
      </div>
    );
  };

  // Render text content for non-PDF files
  const renderTextContent = () => (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {document.title}
          </h2>
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{document.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
          </div>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800 dark:text-gray-200">
            {document.cleanedText}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
      {/* Document Stats Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {document.title}
            </span>
            <span className="text-gray-500 dark:text-gray-400">•</span>
            <span className="text-gray-500 dark:text-gray-400">
              {document.fileType.toUpperCase()}
            </span>
            {document.pageCount && (
              <>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {document.pageCount} pages
                </span>
              </>
            )}
            {document.fileType === 'pdf' && (
              <>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Page {currentPage}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {document.wordCount.toLocaleString()} words
          </div>
        </div>
      </div>

      {/* Document Content */}
      {document.fileType === 'pdf' ? renderPdfContent() : renderTextContent()}
    </div>
  );
}
