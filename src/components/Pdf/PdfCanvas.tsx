'use client';

/**
 * PdfCanvas Component
 * Pure render-only component for PDF page canvas
 * 
 * Responsibilities:
 * - Render PDF page to canvas
 * - Handle high DPI displays
 * - Apply smart dark mode inversion (text/bg only, not images)
 * - NO interaction logic (that's WordOverlay's job)
 */

import { useRef, useEffect, memo } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { enablePdfSmartInvert } from '@/lib/pdf/invert';

interface PdfCanvasProps {
  page: PDFPageProxy;
  scale: number;
  width: number;
  height: number;
  className?: string;
  /** Whether dark mode is active */
  isDarkMode?: boolean;
  /** Whether to invert PDF colors in dark mode */
  invertPdfInDarkMode?: boolean;
}

function PdfCanvasInner({
  page,
  scale,
  width,
  height,
  className = '',
  isDarkMode = false,
  invertPdfInDarkMode = true,
}: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<ReturnType<typeof page.render> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Cancel any pending render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    // Get device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Set canvas dimensions accounting for device pixel ratio
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    
    // Scale context to match device pixel ratio
    context.scale(devicePixelRatio, devicePixelRatio);
    
    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Get viewport at the desired scale
    const viewport = page.getViewport({ scale });

    // Enable smart dark mode inversion if needed
    // This intercepts canvas operations to invert text/background but NOT images
    let restoreContext: (() => void) | null = null;
    const shouldInvert = isDarkMode && invertPdfInDarkMode;
    
    if (shouldInvert) {
      try {
        restoreContext = enablePdfSmartInvert({
          canvasContext: context,
          pageViewport: viewport,
          backgroundColor: '#1a1a1a', // Dark background
          textColor: '#e5e5e5', // Light text
        });
      } catch (err) {
        // Graceful fallback - continue without inversion
        if (process.env.NODE_ENV === 'development') {
          console.warn('Smart inversion failed, continuing without it:', err);
        }
      }
    }

    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport,
    };

    renderTaskRef.current = page.render(renderContext);

    renderTaskRef.current.promise
      .then(() => {
        // Clean up interception after successful render
        if (restoreContext) {
          restoreContext();
        }
      })
      .catch((err) => {
        // Clean up interception even on error
        if (restoreContext) {
          restoreContext();
        }
        // Ignore cancelled renders
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', err);
        }
      });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      // Clean up interception if component unmounts during render
      if (restoreContext) {
        restoreContext();
      }
    };
  }, [page, scale, width, height, isDarkMode, invertPdfInDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
    />
  );
}

// Memo to prevent unnecessary re-renders
export const PdfCanvas = memo(PdfCanvasInner);
export default PdfCanvas;
