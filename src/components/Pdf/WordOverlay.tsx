'use client';

/**
 * WordOverlay Component
 * Interaction layer for word-level clicks
 * 
 * Responsibilities:
 * - Render invisible clickable word spans
 * - Handle word click events
 * - Highlight active word during TTS playback
 * - NO rendering logic (that's PdfCanvas's job)
 * 
 * UI is DUMB and FAST - just renders positioned spans
 */

import { memo, useCallback } from 'react';
import type { WordItem, OnWordClick } from './types';

interface WordOverlayProps {
  words: WordItem[];
  onWordClick: OnWordClick;
  /** Currently highlighted word index (for TTS sync) */
  activeWordIndex?: number;
  /** Show word boundaries for debugging */
  debug?: boolean;
  className?: string;
}

function WordOverlayInner({
  words,
  onWordClick,
  activeWordIndex,
  debug = false,
  className = '',
}: WordOverlayProps) {
  const handleWordClick = useCallback(
    (word: WordItem) => (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onWordClick({ word, event });
    },
    [onWordClick]
  );

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ userSelect: 'text' }}
    >
      {words.map((word) => {
        const isActive = word.globalIndex === activeWordIndex;
        
        return (
          <span
            key={`word-${word.globalIndex}`}
            onClick={handleWordClick(word)}
            className={`
              absolute pointer-events-auto cursor-pointer
              ${debug ? 'border border-blue-500/30' : ''}
              ${isActive ? 'bg-yellow-300/50 dark:bg-yellow-500/40' : 'hover:bg-blue-200/30 dark:hover:bg-blue-600/30'}
              transition-colors duration-100
            `}
            style={{
              left: `${word.bounds.x}px`,
              top: `${word.bounds.y}px`,
              width: `${word.bounds.width}px`,
              height: `${word.bounds.height}px`,
              // Invisible text for accessibility and selection
              fontSize: `${word.bounds.height * 0.8}px`,
              lineHeight: `${word.bounds.height}px`,
              color: debug ? 'rgba(0,0,255,0.5)' : 'transparent',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
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
  // Only re-render if these change
  return (
    prev.words === next.words &&
    prev.activeWordIndex === next.activeWordIndex &&
    prev.debug === next.debug &&
    prev.onWordClick === next.onWordClick
  );
});

export default WordOverlay;
