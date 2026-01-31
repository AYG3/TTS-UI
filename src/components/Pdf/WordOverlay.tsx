'use client';

/**
 * WordOverlay Component
 * Interaction layer for word-level clicks and highlighting
 * 
 * Responsibilities:
 * - Render invisible clickable word spans
 * - Handle word click events for audio seek
 * - Handle hover events for preview highlighting
 * - Highlight active word during TTS playback
 * - NO rendering logic (that's PdfCanvas's job)
 * 
 * Word visual states:
 * - active: Currently being spoken (yellow background)
 * - hovered: User hovering with intent (light yellow)
 * - normal: Default state (transparent, hover shows light blue)
 * 
 * UI is DUMB and FAST - just renders positioned spans
 */

import { memo, useCallback, useState, useEffect, type CSSProperties } from 'react';
import type { WordItem, OnWordClick } from './types';

interface WordOverlayProps {
  words: WordItem[];
  onWordClick: OnWordClick;
  /** Currently highlighted word index (for TTS sync) */
  activeWordIndex?: number | null;
  /** Externally hovered word (from store) */
  hoveredWordIndex?: number | null;
  /** Callback when hovering over a word */
  onWordHover?: (wordIndex: number | null) => void;
  /** Show word boundaries for debugging */
  debug?: boolean;
  className?: string;
}

function WordOverlayInner({
  words,
  onWordClick,
  activeWordIndex,
  hoveredWordIndex,
  onWordHover,
  debug = false,
  className = '',
}: WordOverlayProps) {
  // Local hover state for immediate feedback when no external handler
  const [localHoveredIndex, setLocalHoveredIndex] = useState<number | null>(null);
  
  const effectiveHoveredIndex = hoveredWordIndex ?? localHoveredIndex;

  // Debug: log when activeWordIndex prop changes
  useEffect(() => {
    console.log(`🖼️ WordOverlay received activeWordIndex: ${activeWordIndex}`);
  }, [activeWordIndex]);

  const handleWordClick = useCallback(
    (word: WordItem) => (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onWordClick({ word, event });
    },
    [onWordClick]
  );

  const handleMouseEnter = useCallback(
    (wordIndex: number) => () => {
      setLocalHoveredIndex(wordIndex);
      onWordHover?.(wordIndex);
    },
    [onWordHover]
  );

  const handleMouseLeave = useCallback(() => {
    setLocalHoveredIndex(null);
    onWordHover?.(null);
  }, [onWordHover]);

  /**
   * Get inline styles for word based on state
   * Priority: active > hovered > normal
   * Using inline styles because Tailwind bg classes don't work reliably here
   */
  const getWordStyle = useCallback(
    (wordIndex: number, baseStyle: CSSProperties): CSSProperties => {
      const isActive = wordIndex === activeWordIndex;
      const isHovered = wordIndex === effectiveHoveredIndex;
      
      if (isActive) {
        // Active word: strong yellow highlight with ring effect
        return {
          ...baseStyle,
          backgroundColor: 'rgba(253, 224, 71, 0.7)', // yellow-300 with opacity
          boxShadow: '0 0 0 2px rgba(250, 204, 21, 0.5)', // ring effect
          borderRadius: '2px',
        };
      }
      if (isHovered) {
        // Hovered word: light yellow preview
        return {
          ...baseStyle,
          backgroundColor: 'rgba(254, 240, 138, 0.5)', // yellow-200 with opacity
          borderRadius: '2px',
        };
      }
      // Normal: transparent
      return baseStyle;
    },
    [activeWordIndex, effectiveHoveredIndex]
  );

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ userSelect: 'text' }}
    >
      {words.map((word) => {
        const baseStyle: CSSProperties = {
          position: 'absolute',
          left: `${word.bounds.x}px`,
          top: `${word.bounds.y}px`,
          width: `${word.bounds.width}px`,
          height: `${word.bounds.height}px`,
          fontSize: `${word.bounds.height * 0.8}px`,
          lineHeight: `${word.bounds.height}px`,
          color: debug ? 'rgba(0,0,255,0.5)' : 'transparent',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'background-color 150ms ease, box-shadow 150ms ease',
          border: debug ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
        };

        return (
          <span
            key={`word-${word.globalIndex}`}
            onClick={handleWordClick(word)}
            onMouseEnter={handleMouseEnter(word.globalIndex)}
            onMouseLeave={handleMouseLeave}
            style={getWordStyle(word.globalIndex, baseStyle)}
            title={debug ? `[${word.globalIndex}] ${word.text}` : word.text}
            data-word-index={word.globalIndex}
            data-page-index={word.pageWordIndex}
            data-page={word.pageNumber}
          >
            {debug ? word.text : '\u00A0'}
          </span>
        );
      })}
    </div>
  );
}

// Heavy memoization - words array is treated as immutable
export const WordOverlay = memo(WordOverlayInner, (prev, next) => {
  return (
    prev.words === next.words &&
    prev.activeWordIndex === next.activeWordIndex &&
    prev.hoveredWordIndex === next.hoveredWordIndex &&
    prev.debug === next.debug &&
    prev.onWordClick === next.onWordClick &&
    prev.onWordHover === next.onWordHover
  );
});

export default WordOverlay;
