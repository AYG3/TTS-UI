/**
 * Audio Player Store (Zustand)
 * Global state management for audio playback
 * 
 * Responsibilities:
 * - Manage playback state (play/pause/stop)
 * - Track current position within chunk
 * - Handle chunk transitions
 * - Manage playback speed
 * - Coordinate with chunk store for navigation
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ttsApi } from '@/lib/ttsApi';
import { DocumentAudioMetadata, Voice, GenerationStatus } from '@/types';

interface AudioPlayerState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  
  // Document/chunk tracking
  documentId: string | null;
  currentChunkId: number;
  totalChunks: number;
  
  // Settings
  playbackSpeed: number;
  volume: number;
  
  // Audio metadata
  audioMetadata: DocumentAudioMetadata | null;
  generationStatus: GenerationStatus | null;
  
  // Voice selection
  selectedVoiceId: string | null;
  availableVoices: Voice[];
  
  // Error handling
  error: string | null;
  
  // Actions
  loadDocument: (documentId: string) => Promise<void>;
  generateAudio: (voiceId?: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  goToChunk: (chunkId: number) => void;
  nextChunk: () => void;
  previousChunk: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setSelectedVoice: (voiceId: string) => void;
  loadVoices: () => Promise<void>;
  checkStatus: () => Promise<void>;
  reset: () => void;
  
  // Internal
  _audioElement: HTMLAudioElement | null;
  _setAudioElement: (element: HTMLAudioElement | null) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      documentId: null,
      currentChunkId: 0,
      totalChunks: 0,
      playbackSpeed: 1.0,
      volume: 1.0,
      audioMetadata: null,
      generationStatus: null,
      selectedVoiceId: null,
      availableVoices: [],
      error: null,
      _audioElement: null,

      // Load document and check for existing audio
      loadDocument: async (documentId: string) => {
        set({ isLoading: true, error: null, documentId });

        try {
          // Check generation status
          const status = await ttsApi.getStatus(documentId);
          set({ generationStatus: status });

          if (status.status === 'completed' && status.metadata) {
            set({
              audioMetadata: status.metadata,
              totalChunks: status.metadata.totalChunks,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load document',
            isLoading: false,
          });
        }
      },

      // Generate audio for document
      generateAudio: async (voiceId?: string) => {
        const { documentId, selectedVoiceId } = get();
        if (!documentId) return;

        set({ isLoading: true, error: null });

        try {
          // Start generation
          await ttsApi.generateAudio(documentId, {
            voiceId: voiceId || selectedVoiceId || undefined,
          });

          set({
            generationStatus: { status: 'generating', progress: 0 },
          });

          // Poll for completion
          const pollInterval = setInterval(async () => {
            const status = await ttsApi.getStatus(documentId);
            set({ generationStatus: status });

            if (status.status === 'completed') {
              clearInterval(pollInterval);
              set({
                audioMetadata: status.metadata || null,
                totalChunks: status.metadata?.totalChunks || 0,
                isLoading: false,
              });
            } else if (status.status === 'failed') {
              clearInterval(pollInterval);
              set({
                error: status.error || 'Generation failed',
                isLoading: false,
              });
            }
          }, 2000);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate audio',
            isLoading: false,
          });
        }
      },

      // Play audio
      play: () => {
        const { _audioElement, documentId, currentChunkId, audioMetadata } = get();
        
        if (!audioMetadata || !documentId) {
          set({ error: 'No audio available' });
          return;
        }

        // Create or get audio element
        let audio = _audioElement;
        if (!audio) {
          audio = new Audio();
          audio.preload = 'auto';
          
          // Set up event handlers
          audio.onplay = () => set({ isPlaying: true, isPaused: false });
          audio.onpause = () => set({ isPaused: true, isPlaying: false });
          audio.onended = () => {
            const state = get();
            if (state.currentChunkId < state.totalChunks - 1) {
              state.nextChunk();
            } else {
              set({ isPlaying: false, isPaused: false, currentTime: 0 });
            }
          };
          audio.ontimeupdate = () => {
            const state = get();
            const currentTime = audio!.currentTime;
            const duration = audio!.duration;
            
            set({ currentTime });
            
            // Preload next chunk when 80% through current chunk
            if (duration > 0 && currentTime / duration >= 0.8) {
              const nextChunkId = state.currentChunkId + 1;
              if (nextChunkId < state.totalChunks && state.documentId) {
                // Check if next chunk already has audio
                const hasNextChunk = state.audioMetadata?.chunks?.some(
                  chunk => chunk.chunkId === nextChunkId && chunk.audioUrl
                );
                
                // If not, generate it on-demand
                if (!hasNextChunk) {
                  ttsApi.generateChunk(
                    state.documentId,
                    nextChunkId,
                    state.selectedVoiceId || undefined
                  ).catch(err => {
                    console.warn(`Failed to preload chunk ${nextChunkId}:`, err);
                  });
                }
              }
            }
          };
          audio.ondurationchange = () => {
            set({ duration: audio!.duration });
          };
          audio.onerror = () => {
            set({ error: 'Failed to load audio', isPlaying: false });
          };
          
          set({ _audioElement: audio });
        }

        // Load chunk audio
        const audioUrl = ttsApi.getChunkAudioUrl(documentId, currentChunkId);
        if (audio.src !== audioUrl) {
          audio.src = audioUrl;
        }

        // Apply settings
        audio.playbackRate = get().playbackSpeed;
        audio.volume = get().volume;

        // Play
        audio.play().catch((error) => {
          set({ error: `Playback failed: ${error.message}` });
        });
      },

      // Pause audio
      pause: () => {
        const { _audioElement } = get();
        if (_audioElement) {
          _audioElement.pause();
        }
      },

      // Stop audio
      stop: () => {
        const { _audioElement } = get();
        if (_audioElement) {
          _audioElement.pause();
          _audioElement.currentTime = 0;
        }
        set({ isPlaying: false, isPaused: false, currentTime: 0 });
      },

      // Seek to time
      seekTo: (time: number) => {
        const { _audioElement } = get();
        if (_audioElement) {
          _audioElement.currentTime = time;
          set({ currentTime: time });
        }
      },

      // Go to specific chunk
      goToChunk: (chunkId: number) => {
        const { totalChunks, documentId, _audioElement, isPlaying } = get();
        
        if (chunkId < 0 || chunkId >= totalChunks) return;
        
        set({ currentChunkId: chunkId, currentTime: 0 });
        
        if (_audioElement && documentId) {
          const audioUrl = ttsApi.getChunkAudioUrl(documentId, chunkId);
          _audioElement.src = audioUrl;
          _audioElement.currentTime = 0;
          
          if (isPlaying) {
            _audioElement.play().catch(() => {});
          }
        }
      },

      // Next chunk
      nextChunk: () => {
        const { currentChunkId, totalChunks } = get();
        if (currentChunkId < totalChunks - 1) {
          get().goToChunk(currentChunkId + 1);
        }
      },

      // Previous chunk
      previousChunk: () => {
        const { currentChunkId, currentTime } = get();
        // If more than 3 seconds in, restart current chunk
        if (currentTime > 3) {
          get().seekTo(0);
        } else if (currentChunkId > 0) {
          get().goToChunk(currentChunkId - 1);
        }
      },

      // Set playback speed
      setPlaybackSpeed: (speed: number) => {
        const { _audioElement } = get();
        if (_audioElement) {
          _audioElement.playbackRate = speed;
        }
        set({ playbackSpeed: speed });
      },

      // Set volume
      setVolume: (volume: number) => {
        const { _audioElement } = get();
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (_audioElement) {
          _audioElement.volume = clampedVolume;
        }
        set({ volume: clampedVolume });
      },

      // Set selected voice
      setSelectedVoice: (voiceId: string) => {
        set({ selectedVoiceId: voiceId });
      },

      // Load available voices
      loadVoices: async () => {
        try {
          const result = await ttsApi.getVoices();
          if (result) {
            set({
              availableVoices: result.voices,
              selectedVoiceId: result.defaultVoiceId,
            });
          }
        } catch (error) {
          console.error('Failed to load voices:', error);
        }
      },

      // Check generation status
      checkStatus: async () => {
        const { documentId } = get();
        if (!documentId) return;

        const status = await ttsApi.getStatus(documentId);
        set({
          generationStatus: status,
          audioMetadata: status.metadata || null,
          totalChunks: status.metadata?.totalChunks || 0,
        });
      },

      // Reset state
      reset: () => {
        const { _audioElement } = get();
        if (_audioElement) {
          _audioElement.pause();
          _audioElement.src = '';
        }
        set({
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          currentTime: 0,
          duration: 0,
          documentId: null,
          currentChunkId: 0,
          totalChunks: 0,
          audioMetadata: null,
          generationStatus: null,
          error: null,
          _audioElement: null,
        });
      },

      // Set audio element (internal)
      _setAudioElement: (element) => {
        set({ _audioElement: element });
      },
    }),
    { name: 'AudioPlayerStore' }
  )
);

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Playback speed options
 */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
