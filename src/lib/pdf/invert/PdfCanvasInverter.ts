/**
 * PDF Smart Dark Mode Inverter
 * 
 * This module implements intelligent color inversion for PDF rendering in dark mode.
 * 
 * WHY THIS EXISTS:
 * - Traditional CSS `filter: invert()` inverts everything including images
 * - This causes photos, diagrams, and graphics to look incorrect
 * - We need to invert text and background while preserving image colors
 * 
 * HOW IT WORKS:
 * - Intercepts Canvas 2D API calls during PDF.js rendering
 * - Detects whether operations are drawing:
 *   • Page background (full-page rectangles)
 *   • Text content (fillText/strokeText)
 *   • Images (drawImage)
 * - Applies color inversion ONLY to text and background
 * - Lets image operations pass through untouched
 * 
 * WHY INTERNAL (NOT NPM):
 * - Tightly coupled to this app's theme system
 * - PDF.js version-specific (may break on upgrades)
 * - No need for external reusability
 * - Easier to maintain inline
 * 
 * SAFETY:
 * - No global monkey-patching
 * - Scoped to single render operation
 * - Graceful fallback on errors
 * - No performance impact (zero additional canvas passes)
 */

import type { PdfInvertConfig, InversionState } from './types';

/**
 * Default colors for dark mode
 */
const DEFAULT_BG_COLOR = '#1a1a1a';
const DEFAULT_TEXT_COLOR = '#e5e5e5';

/**
 * Parses a CSS color string and returns RGB values
 * @param color CSS color string
 * @returns RGB values [r, g, b] or null if parsing fails
 */
function parseColor(color: string): [number, number, number] | null {
  // Create a temporary canvas to normalize color format
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = color;
  const computed = ctx.fillStyle;

  // Parse hex format (#rrggbb)
  if (computed.startsWith('#')) {
    const hex = computed.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
  }

  // Parse rgb/rgba format
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  return null;
}

/**
 * Calculates relative luminance of a color (0 = black, 1 = white)
 * @param rgb RGB values [r, g, b]
 * @returns Luminance value between 0 and 1
 */
function calculateLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Determines if a color is dark (likely text)
 * @param color CSS color string
 * @returns true if color is dark (luminance < 0.5)
 */
function isColorDark(color: string): boolean {
  const rgb = parseColor(color);
  if (!rgb) return false;
  return calculateLuminance(rgb) < 0.5;
}

/**
 * Determines if a color is very light (likely white background)
 * @param color CSS color string
 * @returns true if color is very light (luminance > 0.9)
 */
function isColorVeryLight(color: string): boolean {
  const rgb = parseColor(color);
  if (!rgb) return false;
  return calculateLuminance(rgb) > 0.9;
}

/**
 * Inverts a color for dark mode based on its luminance
 * @param color Original color
 * @param textColor Replacement color for dark text (becomes light)
 * @param bgColor Replacement color for light backgrounds (becomes dark)
 * @returns Inverted color
 */
function invertColorForDarkMode(
  color: string,
  textColor: string,
  bgColor: string
): string {
  const rgb = parseColor(color);
  if (!rgb) return color; // Can't parse, return original

  const luminance = calculateLuminance(rgb);

  // Very light colors (white, near-white) → dark background
  if (luminance > 0.9) {
    return bgColor;
  }
  
  // Very dark colors (black, near-black) → light text
  if (luminance < 0.2) {
    return textColor;
  }

  // Mid-range colors: invert by flipping luminance
  // This handles grays and mid-tone colors
  if (luminance < 0.5) {
    // Dark-ish → light-ish
    return textColor;
  } else {
    // Light-ish → dark-ish
    return bgColor;
  }
}

/**
 * Wraps a canvas context with smart color inversion
 * 
 * This is the core interception logic. It wraps canvas methods
 * to detect what's being drawn and apply selective inversion.
 * 
 * @param ctx Canvas context to wrap
 * @param state Inversion state tracker
 * @param config Inversion configuration
 */
function wrapCanvasContext(
  ctx: CanvasRenderingContext2D,
  state: InversionState,
  config: PdfInvertConfig
): void {
  const { pageViewport, backgroundColor, textColor } = config;
  const bgColor = backgroundColor || DEFAULT_BG_COLOR;
  const txtColor = textColor || DEFAULT_TEXT_COLOR;

  // Store original methods
  state.originalMethods = {
    fillRect: ctx.fillRect.bind(ctx),
    fillText: ctx.fillText.bind(ctx),
    strokeText: ctx.strokeText.bind(ctx),
    drawImage: ctx.drawImage.bind(ctx),
  };

  // Intercept fillRect - used for backgrounds and shapes
  ctx.fillRect = function (x: number, y: number, w: number, h: number) {
    // Don't intercept if we're inside an image draw
    if (state.inImageDraw) {
      return state.originalMethods.fillRect(x, y, w, h);
    }

    // Save original fill style
    const originalFillStyle = ctx.fillStyle;
    
    // Detect full-page or large background rectangles
    const isLargeRect = w > pageViewport.width * 0.8 && h > pageViewport.height * 0.8;
    const isFullPageRect =
      Math.abs(w - pageViewport.width) < 2 &&
      Math.abs(h - pageViewport.height) < 2;

    // Invert color for all rectangles (backgrounds, shapes, etc.)
    if (typeof originalFillStyle === 'string') {
      // Full page background gets special handling
      if (isFullPageRect && !state.backgroundInverted) {
        ctx.fillStyle = bgColor;
        state.backgroundInverted = true;
      } 
      // Large rectangles that are white/light become dark
      else if (isLargeRect && isColorVeryLight(originalFillStyle)) {
        ctx.fillStyle = bgColor;
      }
      // Regular color inversion for all other rectangles
      else {
        ctx.fillStyle = invertColorForDarkMode(originalFillStyle, txtColor, bgColor);
      }
    }

    state.originalMethods.fillRect(x, y, w, h);
    ctx.fillStyle = originalFillStyle;
  };

  // Intercept fillText - main text rendering
  ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
    // Don't intercept if we're inside an image draw
    if (state.inImageDraw) {
      return maxWidth !== undefined
        ? state.originalMethods.fillText(text, x, y, maxWidth)
        : state.originalMethods.fillText(text, x, y);
    }

    // Invert text color
    const originalFillStyle = ctx.fillStyle;
    if (typeof originalFillStyle === 'string') {
      ctx.fillStyle = invertColorForDarkMode(originalFillStyle, txtColor, bgColor);
    }

    const result = maxWidth !== undefined
      ? state.originalMethods.fillText(text, x, y, maxWidth)
      : state.originalMethods.fillText(text, x, y);

    ctx.fillStyle = originalFillStyle;
    return result;
  };

  // Intercept strokeText - outlined text
  ctx.strokeText = function (text: string, x: number, y: number, maxWidth?: number) {
    // Don't intercept if we're inside an image draw
    if (state.inImageDraw) {
      return maxWidth !== undefined
        ? state.originalMethods.strokeText(text, x, y, maxWidth)
        : state.originalMethods.strokeText(text, x, y);
    }

    // Invert stroke color
    const originalStrokeStyle = ctx.strokeStyle;
    if (typeof originalStrokeStyle === 'string') {
      ctx.strokeStyle = invertColorForDarkMode(originalStrokeStyle, txtColor, bgColor);
    }

    const result = maxWidth !== undefined
      ? state.originalMethods.strokeText(text, x, y, maxWidth)
      : state.originalMethods.strokeText(text, x, y);

    ctx.strokeStyle = originalStrokeStyle;
    return result;
  };

  // Intercept drawImage - CRITICAL: preserve image colors
  // @ts-ignore - drawImage has multiple overloads
  ctx.drawImage = function (...args: any[]) {
    // Set flag to disable inversion during image rendering
    state.inImageDraw = true;

    try {
      // Call original drawImage with all arguments
      // @ts-ignore
      return state.originalMethods.drawImage(...args);
    } finally {
      // Always restore flag, even if drawing fails
      state.inImageDraw = false;
    }
  };
}

/**
 * Restores original canvas context methods
 * 
 * MUST be called after rendering completes to avoid leaking
 * intercepted methods to other rendering operations.
 * 
 * @param ctx Canvas context to restore
 * @param state Inversion state with original methods
 */
function restoreCanvasContext(
  ctx: CanvasRenderingContext2D,
  state: InversionState
): void {
  ctx.fillRect = state.originalMethods.fillRect;
  ctx.fillText = state.originalMethods.fillText;
  ctx.strokeText = state.originalMethods.strokeText;
  ctx.drawImage = state.originalMethods.drawImage;
}

/**
 * Enables smart PDF dark mode inversion for a canvas context
 * 
 * PUBLIC API - Call this before page.render()
 * 
 * USAGE:
 * ```ts
 * const restoreFn = enablePdfSmartInvert({
 *   canvasContext: ctx,
 *   pageViewport: viewport,
 * });
 * 
 * await page.render({ canvasContext: ctx, viewport }).promise;
 * 
 * restoreFn(); // MUST call to clean up
 * ```
 * 
 * @param config Inversion configuration
 * @returns Cleanup function to restore original context
 */
export function enablePdfSmartInvert(config: PdfInvertConfig): () => void {
  const { canvasContext } = config;

  // Initialize state
  const state: InversionState = {
    inImageDraw: false,
    backgroundInverted: false,
    originalMethods: {
      fillRect: canvasContext.fillRect.bind(canvasContext),
      fillText: canvasContext.fillText.bind(canvasContext),
      strokeText: canvasContext.strokeText.bind(canvasContext),
      drawImage: canvasContext.drawImage.bind(canvasContext),
    },
  };

  try {
    // Apply interception
    wrapCanvasContext(canvasContext, state, config);
  } catch (err) {
    // If interception fails, log in dev and return no-op cleanup
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to enable PDF smart inversion:', err);
    }
    return () => {}; // No-op cleanup
  }

  // Return cleanup function
  return () => {
    try {
      restoreCanvasContext(canvasContext, state);
    } catch (err) {
      // Silently fail cleanup - better than blocking render
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to restore canvas context:', err);
      }
    }
  };
}

/**
 * HOW TO SAFELY DISABLE:
 * 
 * 1. In PdfCanvas.tsx, remove the enablePdfSmartInvert() call
 * 2. Restore the CSS filter approach (already in place as fallback)
 * 3. Or set invertPdfInDarkMode=false in theme context
 * 
 * The feature is designed to fail gracefully - if interception
 * doesn't work, rendering continues normally.
 */
