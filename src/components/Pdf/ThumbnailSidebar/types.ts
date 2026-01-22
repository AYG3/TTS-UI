/**
 * PDF Thumbnail Types
 * Type definitions for thumbnail sidebar
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';

/** A single rendered thumbnail */
export interface ThumbnailItem {
  /** Page number (1-indexed) */
  page: number;
  /** Rendered canvas element */
  canvas: HTMLCanvasElement;
  /** Thumbnail width in pixels */
  width: number;
  /** Thumbnail height in pixels */
  height: number;
}

/** Thumbnail rendering options */
export interface ThumbnailOptions {
  /** Scale factor for thumbnail (0.15-0.3 recommended) */
  scale?: number;
  /** Target width in pixels (120-160 recommended) */
  targetWidth?: number;
  /** Whether to render progressively */
  progressive?: boolean;
  /** Number of pages to render initially (progressive mode) */
  initialPages?: number;
}

/** Thumbnail sidebar props */
export interface ThumbnailSidebarProps {
  /** PDF document instance */
  pdf: PDFDocumentProxy | null;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Callback when thumbnail is clicked */
  onPageSelect: (page: number) => void;
  /** Whether sidebar is open */
  isOpen?: boolean;
  /** Toggle sidebar open/close */
  onToggle?: () => void;
  /** Rendering options */
  options?: ThumbnailOptions;
  /** Additional CSS classes */
  className?: string;
  /** Show loading state */
  isLoading?: boolean;
  /** Initial width of sidebar */
  initialWidth?: number;
  /** Minimum width of sidebar */
  minWidth?: number;
  /** Maximum width of sidebar */
  maxWidth?: number;
}

/** Single thumbnail component props */
export interface PdfThumbnailProps {
  /** Thumbnail data */
  thumbnail: ThumbnailItem;
  /** Whether this thumbnail is the current page */
  isActive: boolean;
  /** Click handler */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
}
