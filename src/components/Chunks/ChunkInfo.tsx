/**
 * ChunkInfo Component
 * Displays detailed information about chunk metadata
 * 
 * Useful for debugging and analytics view
 */

'use client';

import React from 'react';
import { ChunkMetadata, Chunk } from '@/types';

interface ChunkInfoProps {
  /** Chunk metadata to display */
  chunkMetadata: ChunkMetadata | null;
  /** Currently active chunk ID */
  currentChunkId?: number;
  /** Callback when a chunk is clicked */
  onChunkClick?: (chunk: Chunk) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ChunkInfo({
  chunkMetadata,
  currentChunkId,
  onChunkClick,
  className = '',
}: ChunkInfoProps) {
  if (!chunkMetadata) {
    return (
      <div className={`chunk-info p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">No chunk data available</p>
      </div>
    );
  }

  return (
    <div className={`chunk-info ${className}`}>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Chunks" value={chunkMetadata.totalChunks} />
        <StatCard label="Total Words" value={chunkMetadata.totalWords.toLocaleString()} />
        <StatCard label="Sentences" value={chunkMetadata.totalSentences.toLocaleString()} />
        <StatCard
          label="Est. Duration"
          value={formatDuration(chunkMetadata.totalDurationSec)}
        />
      </div>

      {/* Configuration */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span>Max words/chunk: {chunkMetadata.config.maxWordsPerChunk}</span>
          <span>Target words: {chunkMetadata.config.targetWordsPerChunk}</span>
          <span>Words/minute: {chunkMetadata.config.wordsPerMinute}</span>
          <span>Max duration: {chunkMetadata.config.maxDurationSeconds}s</span>
        </div>
      </div>

      {/* Chunk list */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-700">#</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Words</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Word Range</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Sentences</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Duration</th>
            </tr>
          </thead>
          <tbody>
            {chunkMetadata.chunks.map((chunk) => (
              <tr
                key={chunk.chunkId}
                className={`
                  border-b border-gray-100 transition-colors
                  ${chunk.chunkId === currentChunkId ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${onChunkClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onChunkClick?.(chunk)}
              >
                <td className="py-2 px-3">
                  <span
                    className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                      ${
                        chunk.chunkId === currentChunkId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {chunk.chunkId + 1}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-900">{chunk.wordCount}</td>
                <td className="py-2 px-3 text-gray-500 font-mono text-xs">
                  {chunk.startWordId} - {chunk.endWordId}
                </td>
                <td className="py-2 px-3 text-gray-500">{chunk.sentenceCount}</td>
                <td className="py-2 px-3 text-gray-500">
                  {formatDuration(chunk.estimatedDurationSec)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-400">
        Generated: {new Date(chunkMetadata.generatedAt).toLocaleString()} • Version:{' '}
        {chunkMetadata.version}
      </div>
    </div>
  );
}

/**
 * Simple stat card component
 */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default ChunkInfo;
