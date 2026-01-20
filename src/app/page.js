'use client';

/**
 * TTS Reader - Main Page
 * Mobile-first responsive document reader
 */

import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import UploadView from '@/components/UploadView';
import { DocumentViewer } from '@/components/DocumentViewer';

export default function Home() {
  const {
    currentDocument,
    isUploading,
    uploadProgress,
    error,
    uploadDocument,
    clearDocument,
    clearError,
  } = useDocumentStore();

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    clearError();
    
    try {
      await uploadDocument(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleReset = () => {
    clearDocument();
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        documentTitle={currentDocument?.title}
        hasDocument={!!currentDocument}
        onReset={handleReset}
      />

      {/* Main Content */}
      <main className={`
        flex-1
        ${currentDocument 
          ? 'px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4' 
          : 'px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 md:py-8'
        }
      `}>
        {!currentDocument ? (
          <div className="max-w-2xl mx-auto">
            <UploadView
              selectedFile={selectedFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              error={error}
              onFileSelect={handleFileSelect}
            />
          </div>
        ) : (
          <DocumentViewer document={currentDocument} />
        )}
      </main>

      {/* Footer - Hidden when viewing document on mobile */}
      <div className={currentDocument ? 'hidden md:block' : ''}>
        <Footer />
      </div>
    </div>
  );
}