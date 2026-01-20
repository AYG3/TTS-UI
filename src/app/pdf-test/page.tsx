'use client';

/**
 * PDF Viewer Test Page
 * Tests the PdfWordClickViewer component with a sample PDF or uploaded PDF
 */

import { useState } from 'react';
import { PdfWordClickViewer } from '@/components/Pdf';

export default function PdfTestPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | undefined>(undefined);
  const [clickLog, setClickLog] = useState<Array<{ word: string; index: number; time: string }>>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setActiveWordIndex(undefined);
      setClickLog([]);
    }
  };

  const handleWordClick = ({ word, event }: { word: any; event: React.MouseEvent }) => {
    console.log('Word clicked:', word);
    setActiveWordIndex(word.globalIndex);
    
    // Add to click log
    setClickLog(prev => [
      {
        word: word.text,
        index: word.globalIndex,
        time: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9), // Keep last 10 clicks
    ]);
  };

  const handleSimulatePlayback = () => {
    // Simulate TTS playback by incrementing active word
    setActiveWordIndex(prev => (prev === undefined ? 0 : prev + 1));
  };

  const handleReset = () => {
    setActiveWordIndex(undefined);
    setClickLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          PDF Word-Click Viewer Test
        </h1>

        {/* File Upload */}
        {!pdfUrl && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Upload a PDF to Test
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF files only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}

        {pdfUrl && (
          <>
            {/* Controls */}
            <div className="mb-6 flex gap-4 items-center flex-wrap">
              <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition cursor-pointer">
                Change PDF
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                />
              </label>
              <button
                onClick={handleSimulatePlayback}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Simulate Playback (Next Word)
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                Reset
              </button>
              <span className="text-gray-700 dark:text-gray-300">
                Active Word Index: <strong>{activeWordIndex ?? 'None'}</strong>
              </span>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  PDF Viewer
                </h2>
                <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                  <PdfWordClickViewer
                    url={pdfUrl}
                    onWordClick={handleWordClick}
                    activeWordIndex={activeWordIndex}
                    initialScale={1.0}
                    debug={true}
                  />
                </div>
              </div>

              {/* Click Log Sidebar */}
              <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Click Log
                </h2>
                <div className="space-y-2 max-h-150 overflow-y-auto">
                  {clickLog.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Click on words in the PDF to see them logged here
                    </p>
                  ) : (
                    clickLog.map((log, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          "{log.word}"
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Index: {log.index}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {log.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                Test Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>• Click on any word in the PDF to highlight it and see its global index</li>
                <li>• Use "Simulate Playback" to test highlighting during audio playback</li>
                <li>• Zoom in/out using the controls in the PDF viewer</li>
                <li>• Navigate pages if your PDF has multiple pages</li>
                <li>• The click log shows the last 10 clicked words with their indices</li>
                <li>• Yellow highlight = active word (currently playing in TTS)</li>
                <li>• Hover over words to see the hover effect</li>
              </ul>
            </div>
          </>
        )}

        {/* Technical Info */}
        <div className="mt-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Technical Details
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>• <strong>PDF Library:</strong> pdfjs-dist@4.1.392</li>
            <li>• <strong>Architecture:</strong> Modular hooks-based with aggressive caching</li>
            <li>• <strong>Word Detection:</strong> Extracted from pdf.js text geometry</li>
            <li>• <strong>Bounding Boxes:</strong> Computed from PDF coordinates transformed to canvas</li>
            <li>• <strong>Performance:</strong> Document, page, text, and layout all cached</li>
            <li>• <strong>Use Case:</strong> TTS synchronization with click-to-seek functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
