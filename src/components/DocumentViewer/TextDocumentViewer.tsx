'use client';

/**
 * TextDocumentViewer Component
 * Renders text-based documents (TXT, etc.)
 */

import { memo } from 'react';
import type { Document } from '@/types';

interface TextDocumentViewerProps {
  /** Document data */
  document: Document;
}

export const TextDocumentViewer = memo(function TextDocumentViewer({
  document,
}: TextDocumentViewerProps) {
  return (
    <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-200px)] overflow-auto">
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Document Header - Mobile optimized */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {document.title}
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              <span>{document.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          {/* Document Content */}
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-200 bg-transparent p-0">
              {document.cleanedText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TextDocumentViewer;
