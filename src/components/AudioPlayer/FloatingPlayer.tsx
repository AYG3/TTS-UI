/**
 * FloatingPlayer Component
 * A hovering audio player fixed at the bottom center of the screen
 * Matches the design from the reference images
 * 
 * Features:
 * - Fixed position at bottom center
 * - Play/Pause with skip controls
 * - Chapter title display
 * - Time display (current / total)
 * - Speed control
 * - Language/voice indicator
 * - Works on mobile and desktop
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAudioPlayerStore, formatTime, PLAYBACK_SPEEDS } from '@/store/audioPlayerStore';
import { VoiceSelector } from './VoiceSelector';

interface FloatingPlayerProps {
  /** Document ID to load audio for */
  documentId?: string | null;
  /** Chapter/section title to display */
  chapterTitle?: string;
  /** Callback to expand to full player view */
  onExpand?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function FloatingPlayer({
  documentId,
  chapterTitle,
  onExpand,
  className = '',
}: FloatingPlayerProps) {
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    currentChunkId,
    totalChunks,
    playbackSpeed,
    audioMetadata,
    generationStatus,
    selectedVoiceId,
    availableVoices,
    play,
    pause,
    seekTo,
    setPlaybackSpeed,
    loadDocument,
    generateAudio,
    loadVoices,
  } = useAudioPlayerStore();

  // Voice selector state
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);

  // Load document audio when documentId changes
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);

  // Load voices on mount
  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Skip forward 10 seconds
  const skipForward = useCallback(() => {
    seekTo(Math.min(currentTime + 10, duration));
  }, [currentTime, duration, seekTo]);

  // Skip backward 10 seconds
  const skipBackward = useCallback(() => {
    seekTo(Math.max(currentTime - 10, 0));
  }, [currentTime, seekTo]);

  // Cycle through playback speeds
  const cycleSpeed = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  }, [playbackSpeed, setPlaybackSpeed]);

  // Calculate total duration from metadata
  const totalDuration = audioMetadata?.totalDurationSec || 0;

  // Display title
  const displayTitle = chapterTitle || `Segment ${currentChunkId + 1} of ${totalChunks}`;

  // Get current voice info
  const currentVoice = availableVoices.find(
    (v) => v.id === selectedVoiceId
  );
  const getLanguageFlag = (language?: string): string => {
    if (!language) return '🌍';
    const langLower = language.toLowerCase();
    if (langLower.includes('en-gb') || langLower.includes('british')) return '🇬🇧';
    if (langLower.includes('en-us') || langLower.includes('american') || langLower === 'en') return '🇺🇸';
    if (langLower.includes('en-au')) return '🇦🇺';
    if (langLower.includes('en-ie')) return '🇮🇪';
    if (langLower.includes('de')) return '🇩🇪';
    if (langLower.includes('fr')) return '🇫🇷';
    if (langLower.includes('es')) return '🇪🇸';
    return '🌍';
  };
  const voiceFlag = getLanguageFlag(currentVoice?.language);

  // Show generation UI if no audio
  if (!audioMetadata && generationStatus?.status !== 'generating') {
    return (
      <>
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none ${className}`}
        >
          <div className="pointer-events-auto w-full max-w-lg bg-gray-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl border border-gray-800 p-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">
                Generate audio to start listening
              </p>
              
              {/* Voice selector button */}
              <button
                onClick={() => setIsVoiceSelectorOpen(true)}
                className="flex items-center gap-2 mx-auto mb-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-xl">{voiceFlag}</span>
                <span className="text-sm">
                  {currentVoice?.name || 'Select Voice'}
                </span>
                <ChevronDownIcon />
              </button>

              <button
                onClick={() => generateAudio(selectedVoiceId || undefined)}
                disabled={isLoading || !documentId}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                {isLoading ? 'Loading...' : '🎧 Generate Audio'}
              </button>
            </div>
          </div>
        </div>
        <VoiceSelector
          isOpen={isVoiceSelectorOpen}
          onClose={() => setIsVoiceSelectorOpen(false)}
        />
      </>
    );
  }

  // Show generation progress
  if (generationStatus?.status === 'generating') {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none ${className}`}
      >
        <div className="pointer-events-auto w-full max-w-lg bg-gray-900/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl border border-gray-800 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Generating audio...</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationStatus.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {generationStatus.progress || 0}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 pointer-events-none ${className}`}
      >
        <div className="pointer-events-auto w-full max-w-lg bg-gray-900/95 text-white rounded-2xl shadow-2xl border border-gray-800">
          {/* Chapter title row */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 cursor-pointer"
          onClick={onExpand}
          role={onExpand ? 'button' : undefined}
        >
          {/* Current time */}
          <span className="text-sm font-mono text-gray-300 min-w-[50px]">
            {formatTime(currentTime)}
          </span>

          {/* Chapter title with expand indicator */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
            className="flex items-center gap-1 text-sm font-medium text-white hover:text-blue-400 transition-colors truncate max-w-[200px] mx-2"
          >
            <span className="truncate">{displayTitle}</span>
            {onExpand && <ChevronRightIcon />}
          </button>

          {/* Total duration */}
          <span className="text-sm font-mono text-gray-400 min-w-[65px] text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-4 pb-4">
          {/* Language/Voice indicator */}
          <button
            onClick={() => setIsVoiceSelectorOpen(true)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
            aria-label="Change voice"
          >
            <span className="text-2xl">{voiceFlag}</span>
          </button>

          {/* Skip backward 10s */}
          <button
            onClick={skipBackward}
            className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            aria-label="Skip backward 10 seconds"
          >
            <SkipBackIcon />
          </button>

          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-16 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : isPlaying ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={skipForward}
            className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForwardIcon />
          </button>

          {/* Speed control */}
          <button
            onClick={cycleSpeed}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm font-bold transition-colors"
            aria-label={`Playback speed: ${playbackSpeed}x`}
          >
            {playbackSpeed}×
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{
                width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
    <VoiceSelector
      isOpen={isVoiceSelectorOpen}
      onClose={() => setIsVoiceSelectorOpen(false)}
    />
    </>
  );
}

// Icon components
function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Circular arrow pointing left/back */}
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      {/* 10 text in center */}
      <text
        x="9"
        y="15"
        fontSize="7"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui"
      >
        10
      </text>
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Circular arrow pointing right/forward */}
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      {/* 10 text in center */}
      <text
        x="9"
        y="15"
        fontSize="7"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui"
      >
        10
      </text>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default FloatingPlayer;
