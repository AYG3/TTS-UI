/**
 * DocumentViewer Module
 * Modular document viewing components
 */

// Main component
export { DocumentViewer, default } from './DocumentViewer';

// Sub-components
export { DocumentStatsBar } from './DocumentStatsBar';
export { PdfDocumentViewer } from './PdfDocumentViewer';
export { TextDocumentViewer } from './TextDocumentViewer';

// Hooks
export { useDocumentViewer, usePinchZoom } from './hooks';
export type { UseDocumentViewerResult } from './hooks';
