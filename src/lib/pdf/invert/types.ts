/**
 * Type definitions for PDF smart inversion
 */

import type { PageViewport } from 'pdfjs-dist';

/**
 * Configuration for smart PDF inversion
 */
export interface PdfInvertConfig {
  /** Canvas rendering context to wrap */
  canvasContext: CanvasRenderingContext2D;
  /** PDF page viewport for dimension calculations */
  pageViewport: PageViewport;
  /** Background color to use (dark mode background) */
  backgroundColor?: string;
  /** Text color to use (dark mode text) */
  textColor?: string;
}

/**
 * State tracking for the interception logic
 */
export interface InversionState {
  /** Whether we're currently drawing an image */
  inImageDraw: boolean;
  /** Whether background has been inverted */
  backgroundInverted: boolean;
  /** Original context methods (for restoration) */
  originalMethods: {
    fillRect: typeof CanvasRenderingContext2D.prototype.fillRect;
    fillText: typeof CanvasRenderingContext2D.prototype.fillText;
    strokeText: typeof CanvasRenderingContext2D.prototype.strokeText;
    drawImage: typeof CanvasRenderingContext2D.prototype.drawImage;
  };
}
