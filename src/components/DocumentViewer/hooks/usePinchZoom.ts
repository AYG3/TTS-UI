'use client';

/**
 * usePinchZoom Hook
 * Handles pinch-to-zoom gestures for touch devices
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface PinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  onScaleChange?: (scale: number) => void;
}

interface PinchZoomResult {
  scale: number;
  setScale: (scale: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPinching: boolean;
}

export function usePinchZoom({
  minScale = 0.5,
  maxScale = 4,
  initialScale = 1.5,
  onScaleChange,
}: PinchZoomOptions = {}): PinchZoomResult {
  const [scale, setScaleState] = useState(initialScale);
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track touch state
  const touchStateRef = useRef({
    initialDistance: 0,
    initialScale: initialScale,
    lastScale: initialScale,
  });

  const setScale = useCallback((newScale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    setScaleState(clampedScale);
    onScaleChange?.(clampedScale);
  }, [minScale, maxScale, onScaleChange]);

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        touchStateRef.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
        touchStateRef.current.initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const distanceRatio = currentDistance / touchStateRef.current.initialDistance;
        const newScale = touchStateRef.current.initialScale * distanceRatio;
        
        setScale(newScale);
        touchStateRef.current.lastScale = newScale;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false);
      }
    };

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [scale, isPinching, getDistance, setScale]);

  return {
    scale,
    setScale,
    containerRef,
    isPinching,
  };
}

export default usePinchZoom;
