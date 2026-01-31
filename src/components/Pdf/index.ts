/**
 * PDF Viewer Module
 * 
 * A high-performance, word-level interactive PDF viewer for TTS applications.
 * 
 * Architecture:
 * ├── types.ts                - Type definitions
 * ├── usePdfDocument.ts       - Document loading hook (cached)
 * ├── usePdfPage.ts           - Page loading hook (cached)
 * ├── usePdfText.ts           - Text extraction hook (cached)
 * ├── useWordLayout.ts        - Word bounding box computation (heavy logic, cached)
 * ├── usePageWordOffsets.ts   - Global word offsets across pages (for TTS sync)
 * ├── PdfCanvas.tsx           - Pure render component (dumb, fast)
 * ├── WordOverlay.tsx         - Interaction layer (dumb, fast)
 * ├── PdfPageView.tsx         - Single page view with canvas + overlay (memoized)
 * └── PdfWordClickViewer.tsx  - Orchestrator with continuous vertical scroll
 * 
 * Usage:
 * ```tsx
 * import { PdfWordClickViewer } from '@/components/Pdf';
 * 
 * function MyComponent() {
 *   const handleWordClick = ({ word }) => {
 *     console.log(`Seek to word ${word.globalIndex}`);
 *     audioPlayer.seekToWord(word.globalIndex);
 *   };
 * 
 *   return (
 *     <PdfWordClickViewer
 *       url="/my-document.pdf"
 *       onWordClick={handleWordClick}
 *       activeWordIndex={currentWordIndex}
 *     />
 *   );
 * }
 * ```
 * 
 * Key Features:
 * - Word-level bounding boxes using pdf.js text geometry
 * - Click-to-seek functionality for TTS sync
 * - Active word highlighting during playback
 * - Aggressive caching at document, page, text, and layout levels
 * - High DPI canvas rendering
 * - Zoom and pagination controls
 * 
 * Performance Notes:
 * - Document is loaded once and cached
 * - Pages are cached after first load
 * - Word layout is computed once per page/scale combination
 * - UI components are heavily memoized
 * - Text layout is treated as immutable data
 */

// Main component
export { PdfWordClickViewer, default } from './PdfWordClickViewer';

// Page component (for continuous scroll layout)
export { PdfPageView } from './PdfPageView';

// Hooks (for advanced usage)
export { usePdfDocument, clearDocumentCache } from './usePdfDocument';
export { usePdfPage, clearPageCache } from './usePdfPage';
export { usePdfText, useFullDocumentText, clearTextCache } from './usePdfText';
export { useWordLayout, clearLayoutCache } from './useWordLayout';
export { usePageWordOffsets } from './usePageWordOffsets';

// UI Components (for custom compositions)
export { PdfCanvas } from './PdfCanvas';
export { WordOverlay } from './WordOverlay';

// TOC Components
export { TocItem, useTocOutline, getPdfTocOutlineWithPages } from './Toc';
export type { TocItemData } from './Toc';

// Types
export type {
  BoundingBox,
  WordItem,
  PdfTextItem,
  PageTextContent,
  DocumentTextContent,
  PdfDocumentState,
  PdfPageState,
  WordClickEvent,
  OnWordClick,
  WordLayoutResult,
  PdfViewMode,
} from './types';

// Cache management utility
export function clearAllCaches(): void {
  const { clearDocumentCache } = require('./usePdfDocument');
  const { clearPageCache } = require('./usePdfPage');
  const { clearTextCache } = require('./usePdfText');
  const { clearLayoutCache } = require('./useWordLayout');
  
  clearDocumentCache();
  clearPageCache();
  clearTextCache();
  clearLayoutCache();
}
