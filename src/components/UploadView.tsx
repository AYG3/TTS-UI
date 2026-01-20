'use client';

/**
 * UploadView Component
 * Mobile-first document upload interface with features showcase
 */

import UploadZone from '@/components/UploadZone';
import UploadProgress from '@/components/UploadProgress';

interface UploadViewProps {
  /** Currently selected file */
  selectedFile: File | null;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Error message if upload failed */
  error: string | null;
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
}

export default function UploadView({
  selectedFile,
  isUploading,
  uploadProgress,
  error,
  onFileSelect,
}: UploadViewProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          Upload Your Document
        </h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Upload a PDF or TXT file to get started
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone
        onFileSelect={onFileSelect}
        accept=".pdf,.txt"
        maxSizeMB={50}
      />

      {/* Upload Progress */}
      {(isUploading || error || uploadProgress > 0) && (
        <div className="mt-4 md:mt-6">
          <UploadProgress
            progress={uploadProgress}
            isUploading={isUploading}
            error={error}
            fileName={selectedFile?.name}
          />
        </div>
      )}

      {/* Features */}
      <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
          Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {/* Multiple Formats */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent sm:dark:bg-transparent sm:p-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-blue-600 dark:text-blue-400">📄</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Multiple Formats
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, TXT supported
              </p>
            </div>
          </div>

          {/* Smart Extraction */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent sm:dark:bg-transparent sm:p-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-green-600 dark:text-green-400">✨</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Smart Extraction
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Clean, readable text
              </p>
            </div>
          </div>

          {/* Private & Secure */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent sm:dark:bg-transparent sm:p-0">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-purple-600 dark:text-purple-400">🔒</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Private & Secure
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your data stays local
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
