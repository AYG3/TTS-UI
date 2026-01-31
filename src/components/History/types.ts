/**
 * History Module Types
 * Type definitions for document history functionality
 */

export interface HistoryDocument {
  id: string;
  title: string;
  fileType: 'pdf' | 'txt';
  pageCount?: number;
  wordCount: number;
  uploadedAt: string;
  /** Whether audio has been generated for this document */
  hasAudio?: boolean;
}

export interface DocumentHistoryProps {
  /** Callback when a document is selected from history */
  onSelectDocument?: (documentId: string) => void;
  /** Maximum number of documents to show */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}
