/**
 * AudioPlayerGeneration Component
 * UI states for audio generation and progress
 */

'use client';

import React from 'react';
import { GenerationStatus } from '@/types';

interface AudioPlayerGenerationProps {
  /** Current generation status */
  status: 'idle' | 'generating' | 'complete' | 'error';
  /** Generation progress (0-100) */
  progress?: number;
  /** Whether player is in loading state */
  isLoading: boolean;
  /** Document ID for generation */
  documentId: string | null;
  /** Callback to start audio generation */
  onGenerate: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function AudioPlayerGeneration({
  status,
  progress = 0,
  isLoading,
  documentId,
  onGenerate,
  className = '',
}: AudioPlayerGenerationProps) {
  // Show generation UI if no audio
  if (status === 'idle') {
    return (
      <div className={`audio-player-generate ${className}`}>
        <div className="bg-gray-900 text-white rounded-2xl p-6 mx-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-4">
              Generate audio to start listening
            </p>
            <button
              onClick={onGenerate}
              disabled={isLoading || !documentId}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Generate Audio'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show generation progress
  if (status === 'generating') {
    return (
      <div className={`audio-player-generating ${className}`}>
        <div className="bg-gray-900 text-white rounded-2xl p-6 mx-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Generating audio...</p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progress}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default AudioPlayerGeneration;
