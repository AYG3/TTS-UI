'use client';

/**
 * PdfCanvas Component
 * Pure render-only component for PDF page canvas
 * 
 * Responsibilities:
 * - Render PDF page to canvas
 * - Handle high DPI displays
 * - NO interaction logic (that's WordOverlay's job)
 */

import { useRef, useEffect, memo } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';

interface PdfCanvasProps {
  page: PDFPageProxy;
  scale: number;
  width: number;
  height: number;
  className?: string;
}

function PdfCanvasInner({
  page,
  scale,
  width,
  height,
  className = '',
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

    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport,
    };

    renderTaskRef.current = page.render(renderContext);

    renderTaskRef.current.promise.catch((err) => {
      // Ignore cancelled renders
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
      }
    });

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [page, scale, width, height]);

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
