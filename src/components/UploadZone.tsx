'use client';

/**
 * Upload Zone Component
 * Drag-and-drop file upload with validation
 */

import { useCallback, useState } from 'react';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function UploadZone({
  onFileSelect,
  accept = '.pdf,.txt',
  maxSizeMB = 50,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      // Check file type
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const acceptedTypes = accept.split(',').map((t) => t.trim());

      if (!acceptedTypes.includes(fileExtension)) {
        setError(`Please upload ${accept.replace(/\./g, '').toUpperCase()} files only`);
        return false;
      }

      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return false;
      }

      if (file.size === 0) {
        setError('File is empty');
        return false;
      }

      return true;
    },
    [accept, maxSizeMB]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg md:rounded-xl p-4 sm:p-6 md:p-8 transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${selectedFile ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
        `}
      >
        <input
          type="file"
          id="file-upload"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {selectedFile ? (
            <>
              <FiFile className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mb-3 md:mb-4" />
              <div className="text-center">
                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white break-all px-2">
                  {selectedFile.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  clearFile();
                }}
                className="mt-3 md:mt-4 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-2"
              >
                <FiX className="w-3 h-3 md:w-4 md:h-4" />
                Remove
              </button>
            </>
          ) : (
            <>
              <FiUploadCloud className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400 dark:text-gray-500 mb-3 md:mb-4" />
              <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 md:mb-2">
                Drop your document here
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">
                or click to browse
              </p>
              <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-500 text-white text-sm md:text-base rounded-lg hover:bg-blue-600 transition-colors">
                Choose File
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 md:mt-4">
                Supported: {accept.replace(/\./g, '').toUpperCase()} • Max {maxSizeMB}MB
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-2 md:mt-3 p-2.5 md:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs md:text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
