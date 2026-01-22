'use client';

/**
 * Upload Progress Component
 * Display upload progress with animation
 */

import { FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';


interface UploadProgressProps {
  progress: number;
  isUploading: boolean;
  error: string | null;
  fileName?: string;
}

export default function UploadProgress({
  progress,
  isUploading,
  error,
  fileName,
}: UploadProgressProps) {
  if (!isUploading && !error && progress === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {error ? (
            <FiXCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 shrink-0" />
          ) : progress === 100 ? (
            <FiCheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 shrink-0" />
          ) : (
            <FiLoader className="w-5 h-5 md:w-6 md:h-6 text-blue-500 animate-spin shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
              {error
                ? 'Upload Failed'
                : progress === 100
                ? 'Processing Complete'
                : 'Uploading Document'}
            </p>
            {fileName && (
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{fileName}</p>
            )}
          </div>
        </div>
        <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white shrink-0 ml-2">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 md:h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${
            error
              ? 'bg-red-500'
              : progress === 100
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && (
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs md:text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {progress === 100 && !error && (
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs md:text-sm text-green-600 dark:text-green-400">
            Document processed successfully!
          </p>
        </div>
      )}
    </div>
  );
}
