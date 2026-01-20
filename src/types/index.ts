// Document types (matching backend)
export interface Document {
  id: string;
  title: string;
  originalFilename: string;
  storedFilename: string;
  filename: string; // deprecated
  filePath: string;
  fileType: 'pdf' | 'txt' | 'docx' | 'epub';
  fileSize: number;
  cleanedText: string;
  wordCount: number;
  pageCount?: number;
  uploadedAt: string;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}
