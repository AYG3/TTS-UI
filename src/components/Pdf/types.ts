/**
 * PDF Viewer Type Definitions
 * Centralized types for word-level PDF interaction
 */

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/** Bounding box in PDF coordinate space (bottom-left origin) */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single word with its position and global index */
export interface WordItem {
  /** The word text */
  text: string;
  /** Bounding box in canvas coordinates (top-left origin) */
  bounds: BoundingBox;
  /** Global word index across entire document */
  globalIndex: number;
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Word index within the page */
  pageWordIndex: number;
}

/** Text item from pdf.js with transform matrix */
export interface PdfTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

/** Page text content with words and metadata */
export interface PageTextContent {
  pageNumber: number;
  words: WordItem[];
  rawText: string;
}

/** PDF view mode */
export type PdfViewMode = 'continuous' | 'single';

/** Document-level text data */
export interface DocumentTextContent {
  pages: PageTextContent[];
  totalWords: number;
  totalPages: number;
}

/** PDF document state */
export interface PdfDocumentState {
  document: PDFDocumentProxy | null;
  isLoading: boolean;
  error: Error | null;
  numPages: number;
}

/** PDF page state */
export interface PdfPageState {
  page: PDFPageProxy | null;
  isLoading: boolean;
  error: Error | null;
  viewport: {
    width: number;
    height: number;
    scale: number;
  } | null;
}

/** Word click event payload */
export interface WordClickEvent {
  word: WordItem;
  event: React.MouseEvent;
}

/** Props for word click callback */
export type OnWordClick = (event: WordClickEvent) => void;

/** Cache key for memoization */
export type CacheKey = string;

/** Word layout computation result */
export interface WordLayoutResult {
  words: WordItem[];
  isComputing: boolean;
  error: Error | null;
}
