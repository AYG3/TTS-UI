/**
 * VoiceSelector Component
 * A dropdown modal for selecting ElevenLabs voices
 * 
 * Features:
 * - Shows list of available voices from ElevenLabs
 * - Voice preview with accent label
 * - Search/filter functionality
 * - Currently selected voice highlight
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayerStore } from '@/store/audioPlayerStore';
import { Voice } from '@/types';

interface VoiceSelectorProps {
  /** Whether the selector is open */
  isOpen: boolean;
  /** Callback to close the selector */
  onClose: () => void;
  /** Optional callback when voice is selected */
  onVoiceSelect?: (voiceId: string) => void;
}

export function VoiceSelector({ isOpen, onClose, onVoiceSelect }: VoiceSelectorProps) {
  const {
    availableVoices,
    selectedVoiceId,
    loadVoices,
    setSelectedVoice,
    isLoading,
  } = useAudioPlayerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load voices when opened
  useEffect(() => {
    if (isOpen && availableVoices.length === 0) {
      loadVoices();
    }
  }, [isOpen, availableVoices.length, loadVoices]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Filter voices by search query
  const filteredVoices = availableVoices.filter((voice) => {
    const query = searchQuery.toLowerCase();
    return (
      voice.name.toLowerCase().includes(query) ||
      voice.description?.toLowerCase().includes(query) ||
      voice.gender?.toLowerCase().includes(query) ||
      voice.language?.toLowerCase().includes(query) ||
      voice.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Play voice preview
  const playPreview = (voice: Voice) => {
    if (!voice.previewUrl) return;

    // Stop any current preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same voice, just stop
    if (previewingVoice === voice.id) {
      setPreviewingVoice(null);
      return;
    }

    // Play new preview
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;
    setPreviewingVoice(voice.id);

    audio.play().catch(console.error);
    audio.onended = () => {
      setPreviewingVoice(null);
      audioRef.current = null;
    };
  };

  // Handle voice selection
  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceSelect?.(voiceId);
    onClose();
  };

  // Get accent/language flag emoji
  const getLanguageFlag = (language?: string): string => {
    if (!language) return '🌍';
    const langLower = language.toLowerCase();
    
    if (langLower.includes('en-gb') || langLower.includes('british')) return '🇬🇧';
    if (langLower.includes('en-us') || langLower.includes('american') || langLower === 'en') return '🇺🇸';
    if (langLower.includes('en-au') || langLower.includes('australian')) return '🇦🇺';
    if (langLower.includes('en-ie') || langLower.includes('irish')) return '🇮🇪';
    if (langLower.includes('en-in') || langLower.includes('indian')) return '🇮🇳';
    if (langLower.includes('sv') || langLower.includes('swedish')) return '🇸🇪';
    if (langLower.includes('de')) return '🇩🇪';
    if (langLower.includes('fr')) return '🇫🇷';
    if (langLower.includes('es')) return '🇪🇸';
    if (langLower.includes('it')) return '🇮🇹';
    if (langLower.includes('pt')) return '🇵🇹';
    if (langLower.includes('ja')) return '🇯🇵';
    if (langLower.includes('ko')) return '🇰🇷';
    if (langLower.includes('zh')) return '🇨🇳';
    return '🌍';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-24 px-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Select Voice</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search voices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Voice list */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <LoadingSpinner />
              <p className="mt-2">Loading voices...</p>
            </div>
          ) : filteredVoices.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchQuery ? 'No voices match your search' : 'No voices available'}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredVoices.map((voice) => (
                <div
                  key={voice.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                    selectedVoiceId === voice.id
                      ? 'bg-blue-900/30 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleSelectVoice(voice.id)}
                >
                  {/* Language flag */}
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0">
                    {getLanguageFlag(voice.language)}
                  </div>

                  {/* Voice info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {voice.name}
                      </span>
                      {selectedVoiceId === voice.id && (
                        <span className="text-blue-400 text-xs">✓ Selected</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {voice.language && (
                        <span className="uppercase">{voice.language}</span>
                      )}
                      {voice.gender && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{voice.gender}</span>
                        </>
                      )}
                      {voice.tags && voice.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{voice.tags[0]}</span>
                        </>
                      )}
                    </div>
                    {voice.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {voice.description}
                      </p>
                    )}
                  </div>

                  {/* Preview button */}
                  {voice.previewUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(voice);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        previewingVoice === voice.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      aria-label={previewingVoice === voice.id ? 'Stop preview' : 'Play preview'}
                    >
                      {previewingVoice === voice.id ? (
                        <StopIcon />
                      ) : (
                        <PlaySmallIcon />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with selected voice info */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-sm text-gray-400 text-center">
            {availableVoices.length} voices available • Tap to select
          </p>
        </div>
      </div>

      {/* CSS for slide-up animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Icon components
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlaySmallIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-6 h-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default VoiceSelector;
