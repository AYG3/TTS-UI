/**
 * Audio Player Store (Zustand)
 * Global state management for audio playback
 * 
 * Responsibilities:
 * - Manage playback state (play/pause/stop)
 * - Track current position within chunk
 * - Handle chunk transitions with seamless audio chaining
 * - Manage playback speed
 * - Coordinate prefetch for smooth playback
 * - Show estimated duration before full generation
 * - Track active word for highlighting
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ttsApi } from '@/lib/ttsApi';
import { useChunkStore } from '@/store/chunkStore';
import { DocumentAudioMetadata, Voice, GenerationStatus, Chunk, ChunkAudioInfo, WordTiming, SentenceTiming } from '@/types';

/** Prefetch trigger threshold (0-1) */
const PREFETCH_THRESHOLD = 0.8;

/**
 * Resolve current word index from playback time
 * Uses word timings if available, falls back to proportional mapping
 */
function resolveCurrentWordIndex(
  currentTime: number,
  duration: number,
  chunkInfo: ChunkAudioInfo | undefined,
  audioFileMetadata: { startWordId: number; endWordId: number; wordTimings?: WordTiming[]; sentenceTimings?: SentenceTiming[] } | undefined
): number | null {
  if (!chunkInfo && !audioFileMetadata) return null;
  
  const startWordId = chunkInfo?.startWordId ?? audioFileMetadata?.startWordId ?? 0;
  const endWordId = chunkInfo?.endWordId ?? audioFileMetadata?.endWordId ?? 0;
  const wordTimings = audioFileMetadata?.wordTimings ?? chunkInfo?.wordTimings;
  
  // Level 1: Use word timings if available (best precision)
  if (wordTimings && wordTimings.length > 0) {
    const timing = wordTimings.find(w => currentTime >= w.start && currentTime <= w.end);
    if (timing) return timing.wordIndex;
    // If between words, return the last word we passed
    const passed = wordTimings.filter(w => currentTime >= w.start);
    if (passed.length > 0) return passed[passed.length - 1].wordIndex;
  }
  
  // Level 3: Proportional mapping (fallback)
  if (duration > 0) {
    const totalWords = endWordId - startWordId + 1;
    const ratio = Math.min(currentTime / duration, 1);
    const relativeIndex = Math.floor(ratio * totalWords);
    return startWordId + Math.min(relativeIndex, totalWords - 1);
  }
  
  return startWordId;
}

/**
 * Resolve time offset for a word within a chunk
 * Uses word timings if available, falls back to proportional estimation
 */
function resolveWordTimeOffset(
  wordIndex: number,
  duration: number,
  chunkInfo: ChunkAudioInfo | undefined,
  audioFileMetadata: { startWordId: number; endWordId: number; wordTimings?: WordTiming[] } | undefined
): number {
  if (!chunkInfo && !audioFileMetadata) return 0;
  
  const startWordId = chunkInfo?.startWordId ?? audioFileMetadata?.startWordId ?? 0;
  const endWordId = chunkInfo?.endWordId ?? audioFileMetadata?.endWordId ?? 0;
  const wordTimings = audioFileMetadata?.wordTimings ?? chunkInfo?.wordTimings;
  
  // Level 1: Use word timings if available
  if (wordTimings && wordTimings.length > 0) {
    const timing = wordTimings.find(w => w.wordIndex === wordIndex);
    if (timing) return timing.start;
  }
  
  // Level 3: Proportional mapping
  const totalWords = endWordId - startWordId + 1;
  if (totalWords <= 0) return 0;
  
  const relativeIndex = wordIndex - startWordId;
  const ratio = relativeIndex / totalWords;
  return ratio * duration;
}

/**
 * Compute active word during timeupdate
 * Shared logic for resolving word from current playback position
 */
function computeActiveWordFromState(
  currentTime: number,
  duration: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any
): number | null {
  const { currentChunkId, audioMetadata } = state;
  
  // Get chunk info for word timing - check multiple data sources
  const chunkInfo = audioMetadata?.chunkInfo?.find((c: ChunkAudioInfo) => c.chunkId === currentChunkId);
  const chunk = audioMetadata?.chunks?.find((c: { chunkId: number }) => c.chunkId === currentChunkId);
  const audioFile = audioMetadata?.audioFiles?.find((f: { chunkId: number }) => f.chunkId === currentChunkId);
  
  // Also check chunkStore for chunk metadata
  const chunkStoreState = useChunkStore.getState();
  const chunkFromStore = chunkStoreState.chunkMetadata?.chunks?.find(
    (c: Chunk) => c.chunkId === currentChunkId
  );
  
  // Combine available data sources for word mapping (prioritize most specific)
  const wordBoundary = {
    startWordId: chunkInfo?.startWordId ?? chunk?.startWordId ?? chunkFromStore?.startWordId ?? audioFile?.startWordId ?? 0,
    endWordId: chunkInfo?.endWordId ?? chunk?.endWordId ?? chunkFromStore?.endWordId ?? audioFile?.endWordId ?? 0,
    wordTimings: chunkInfo?.wordTimings ?? audioFile?.wordTimings,
    sentenceTimings: chunkInfo?.sentenceTimings ?? audioFile?.sentenceTimings,
  };
  
  // Debug: log data sources
  console.log(`📊 Word boundary data for chunk ${currentChunkId}:`, {
    chunkInfo: chunkInfo ? `start=${chunkInfo.startWordId}, end=${chunkInfo.endWordId}` : 'null',
    chunk: chunk ? `start=${chunk.startWordId}, end=${chunk.endWordId}` : 'null',
    chunkFromStore: chunkFromStore ? `start=${chunkFromStore.startWordId}, end=${chunkFromStore.endWordId}` : 'null',
    audioFile: audioFile ? `start=${audioFile.startWordId}, end=${audioFile.endWordId}` : 'null',
    result: wordBoundary,
  });
  
  return resolveCurrentWordIndex(currentTime, duration, chunkInfo, wordBoundary);
}

interface AudioPlayerState {
  // Playback state
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isLoadingChunk: boolean; // Loading a specific chunk (for jump-ahead)
  currentTime: number;
  duration: number;
  
  // Document/chunk tracking
  documentId: string | null;
  currentChunkId: number;
  totalChunks: number;
  chunksWithAudio: number[]; // Track which chunks have audio
  
  // Word tracking for highlighting
  activeWordIndex: number | null; // Currently spoken word
  hoveredWordIndex: number | null; // User hovering over word
  
  // Duration tracking
  estimatedTotalDuration: number; // Estimated before full generation
  actualTotalDuration: number; // Sum of generated chunk durations
  
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
  
  // Prefetch tracking
  _prefetchTriggered: Set<number>; // Track which chunks triggered prefetch
  
  // Actions
  loadDocument: (documentId: string) => Promise<void>;
  generateAudio: (voiceId?: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  goToChunk: (chunkId: number, autoPlay?: boolean) => void;
  nextChunk: () => void;
  previousChunk: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setSelectedVoice: (voiceId: string) => void;
  /** Switch voice mid-playback: regenerates current chunk with new voice and continues */
  switchVoice: (voiceId: string) => Promise<void>;
  /** Whether currently switching voice */
  isSwitchingVoice: boolean;
  loadVoices: () => Promise<void>;
  checkStatus: () => Promise<void>;
  reset: () => void;
  triggerPrefetch: (currentChunkId: number) => void;
  
  // Word interaction actions
  playFromWord: (wordIndex: number) => Promise<void>;
  setHoveredWord: (wordIndex: number | null) => void;
  
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
      isLoadingChunk: false,
      isSwitchingVoice: false,
      currentTime: 0,
      duration: 0,
      documentId: null,
      currentChunkId: 0,
      totalChunks: 0,
      chunksWithAudio: [],
      activeWordIndex: null,
      hoveredWordIndex: null,
      estimatedTotalDuration: 0,
      actualTotalDuration: 0,
      playbackSpeed: 1.0,
      volume: 1.0,
      audioMetadata: null,
      generationStatus: null,
      selectedVoiceId: null,
      availableVoices: [],
      error: null,
      _prefetchTriggered: new Set(),
      _audioElement: null,

      // Load document and check for existing audio
      loadDocument: async (documentId: string) => {
        set({ isLoading: true, error: null, documentId, _prefetchTriggered: new Set() });

        try {
          // Check generation status
          const status = await ttsApi.getStatus(documentId);
          set({ generationStatus: status });

          // Extract chunks that have audio
          const chunksWithAudio = status.chunksWithAudio || [];
          
          // Use estimated duration if available, otherwise actual
          const estimatedTotal = status.estimatedTotalDurationSec || 0;
          const actualTotal = status.metadata?.totalDurationSec || 0;

          if ((status.status === 'completed' || status.status === 'ready') && status.metadata) {
            set({
              audioMetadata: status.metadata,
              totalChunks: status.metadata.totalChunks,
              chunksWithAudio,
              estimatedTotalDuration: estimatedTotal,
              actualTotalDuration: actualTotal,
              isLoading: false,
            });
          } else if (status.metadata?.totalChunks) {
            // Partial status - have metadata but not complete
            set({
              totalChunks: status.metadata.totalChunks,
              chunksWithAudio,
              estimatedTotalDuration: estimatedTotal,
              actualTotalDuration: actualTotal,
              audioMetadata: status.metadata || null,
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
          // Start generation (progressive mode - generates initial chunks)
          const result = await ttsApi.generateAudio(documentId, {
            voiceId: voiceId || selectedVoiceId || undefined,
          });

          // Set estimated duration immediately
          if (result?.estimatedTotalDurationSec) {
            set({
              estimatedTotalDuration: result.estimatedTotalDurationSec,
              totalChunks: result.totalChunks || 0,
            });
          }

          set({
            generationStatus: { status: 'generating', progress: 0 },
          });

          // Poll for initial chunks completion
          const pollInterval = setInterval(async () => {
            const status = await ttsApi.getStatus(documentId);
            set({ 
              generationStatus: status,
              chunksWithAudio: status.chunksWithAudio || [],
            });

            // Consider "ready" when we have at least one chunk
            if (status.generatedChunks && status.generatedChunks > 0) {
              clearInterval(pollInterval);
              set({
                audioMetadata: status.metadata || null,
                totalChunks: status.metadata?.totalChunks || 0,
                estimatedTotalDuration: status.estimatedTotalDurationSec || 0,
                actualTotalDuration: status.metadata?.totalDurationSec || 0,
                chunksWithAudio: status.chunksWithAudio || [],
                isLoading: false,
                generationStatus: { ...status, status: 'ready' },
              });
            } else if (status.status === 'failed') {
              clearInterval(pollInterval);
              set({
                error: status.error || 'Generation failed',
                isLoading: false,
              });
            }
          }, 1500);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate audio',
            isLoading: false,
          });
        }
      },

      // Trigger prefetch for upcoming chunks
      triggerPrefetch: (currentChunkId: number) => {
        const { documentId, selectedVoiceId, _prefetchTriggered, totalChunks } = get();
        if (!documentId) return;
        
        // Don't prefetch if already triggered for this chunk or at last chunk
        if (_prefetchTriggered.has(currentChunkId) || currentChunkId >= totalChunks - 1) {
          return;
        }
        
        // Mark as triggered
        _prefetchTriggered.add(currentChunkId);
        set({ _prefetchTriggered: new Set(_prefetchTriggered) });
        
        // Trigger prefetch in background
        console.log(`🔮 Triggering prefetch from chunk ${currentChunkId}`);
        ttsApi.prefetchChunks(documentId, currentChunkId, selectedVoiceId || undefined)
          .catch(err => console.warn('Prefetch failed:', err));
      },

      // Play audio
      play: () => {
        const { _audioElement, documentId, currentChunkId, audioMetadata, chunksWithAudio } = get();
        
        // Check if we have any audio to play
        const hasAudioForCurrentChunk = chunksWithAudio.includes(currentChunkId);
        if (!documentId || (!audioMetadata && !hasAudioForCurrentChunk)) {
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
            
            // Compute active word from playback time using shared logic
            const activeWordIndex = computeActiveWordFromState(currentTime, duration, state);
            
            // Debug logging
            if (activeWordIndex !== state.activeWordIndex) {
              console.log(`🎯 Word highlight: ${activeWordIndex} at ${currentTime.toFixed(2)}s (chunk ${state.currentChunkId})`);
            }
            
            set({ currentTime, activeWordIndex });
            
            // Trigger prefetch when ~80% through current chunk
            if (duration > 0 && currentTime / duration >= PREFETCH_THRESHOLD) {
              state.triggerPrefetch(state.currentChunkId);
            }
          };
          audio.ondurationchange = () => {
            set({ duration: audio!.duration });
          };
          audio.onerror = () => {
            set({ error: 'Failed to load audio', isPlaying: false, isLoadingChunk: false });
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
      // If chunk doesn't have audio, generate it on-demand (shows loading state)
      // autoPlay: force playback after loading (used for chunk continuation)
      goToChunk: async (chunkId: number, autoPlay: boolean = false) => {
        const { totalChunks, documentId, _audioElement, isPlaying, chunksWithAudio, selectedVoiceId } = get();
        
        if (chunkId < 0 || chunkId >= totalChunks) return;
        if (!documentId) return;
        
        // Determine if we should play after loading
        const shouldPlay = isPlaying || autoPlay;
        
        // Check if chunk has audio
        const hasAudio = chunksWithAudio.includes(chunkId);
        
        if (!hasAudio) {
          // Generate on-demand with loading state
          set({ isLoadingChunk: true, currentChunkId: chunkId, currentTime: 0, isPlaying: shouldPlay });
          
          try {
            console.log(`🎤 Generating chunk ${chunkId} on-demand (jump ahead)`);
            await ttsApi.generateChunk(documentId, chunkId, selectedVoiceId || undefined);
            
            // Update chunks list
            const newChunksWithAudio = [...chunksWithAudio, chunkId];
            set({ chunksWithAudio: newChunksWithAudio, isLoadingChunk: false });
            
            // Refresh status
            const status = await ttsApi.getStatus(documentId);
            set({ 
              audioMetadata: status.metadata || null,
              chunksWithAudio: status.chunksWithAudio || newChunksWithAudio,
            });
          } catch (error) {
            set({ 
              error: `Failed to generate chunk ${chunkId}`, 
              isLoadingChunk: false,
              isPlaying: false,
            });
            return;
          }
        } else {
          set({ currentChunkId: chunkId, currentTime: 0 });
        }
        
        if (_audioElement) {
          const audioUrl = ttsApi.getChunkAudioUrl(documentId, chunkId);
          _audioElement.src = audioUrl;
          _audioElement.currentTime = 0;
          
          if (shouldPlay) {
            _audioElement.play().catch(() => {});
          }
        }
      },

      // Next chunk - continues playing automatically
      nextChunk: () => {
        const { currentChunkId, totalChunks } = get();
        if (currentChunkId < totalChunks - 1) {
          get().goToChunk(currentChunkId + 1, true); // autoPlay=true to continue
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

      // Set selected voice (doesn't regenerate audio)
      setSelectedVoice: (voiceId: string) => {
        set({ selectedVoiceId: voiceId });
      },

      /**
       * Switch voice mid-playback
       * - Saves current word position
       * - Clears existing audio cache for new voice
       * - Regenerates current chunk with new voice
       * - Continues playback from saved position
       */
      switchVoice: async (voiceId: string) => {
        const {
          documentId,
          currentChunkId,
          activeWordIndex,
          isPlaying,
          _audioElement,
          playbackSpeed,
          volume,
        } = get();

        if (!documentId) {
          set({ error: 'No document loaded' });
          return;
        }

        // Save the word we're at for resuming
        const resumeFromWord = activeWordIndex;
        const wasPlaying = isPlaying;

        // Stop current playback
        if (_audioElement) {
          _audioElement.pause();
        }

        // Update voice and show loading state
        set({
          selectedVoiceId: voiceId,
          isSwitchingVoice: true,
          isPlaying: false,
          chunksWithAudio: [], // Clear audio cache - will regenerate with new voice
        });

        try {
          console.log(`🔄 Switching voice to ${voiceId}, regenerating chunk ${currentChunkId}...`);

          // Generate current chunk with new voice
          await ttsApi.generateChunk(documentId, currentChunkId, voiceId);

          // Refresh status to get updated metadata
          const status = await ttsApi.getStatus(documentId);
          
          set({
            audioMetadata: status.metadata || null,
            chunksWithAudio: status.chunksWithAudio || [currentChunkId],
            isSwitchingVoice: false,
          });

          // If we had a word position, play from that word
          if (resumeFromWord !== null && wasPlaying) {
            // Use playFromWord to resume from exact position
            await get().playFromWord(resumeFromWord);
          } else if (wasPlaying) {
            // Just replay current chunk from start
            const audioUrl = ttsApi.getChunkAudioUrl(documentId, currentChunkId);
            if (_audioElement) {
              _audioElement.src = audioUrl;
              _audioElement.playbackRate = playbackSpeed;
              _audioElement.volume = volume;
              await _audioElement.play();
            }
          }

          console.log(`✅ Voice switched to ${voiceId}`);
        } catch (error) {
          console.error('Failed to switch voice:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to switch voice',
            isSwitchingVoice: false,
          });
        }
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
          isLoadingChunk: false,
          currentTime: 0,
          duration: 0,
          documentId: null,
          currentChunkId: 0,
          totalChunks: 0,
          chunksWithAudio: [],
          activeWordIndex: null,
          hoveredWordIndex: null,
          estimatedTotalDuration: 0,
          actualTotalDuration: 0,
          audioMetadata: null,
          generationStatus: null,
          error: null,
          _prefetchTriggered: new Set(),
          _audioElement: null,
        });
      },

      // Set hovered word (for hover highlighting)
      setHoveredWord: (wordIndex: number | null) => {
        set({ hoveredWordIndex: wordIndex });
      },

      // Play audio from a specific word (click-to-seek)
      playFromWord: async (wordIndex: number) => {
        const {
          documentId,
          audioMetadata,
          chunksWithAudio,
          selectedVoiceId,
          _audioElement,
          playbackSpeed,
          volume,
        } = get();

        if (!documentId) {
          set({ error: 'No document loaded' });
          return;
        }

        // Find chunk containing this word
        const chunkInfo = audioMetadata?.chunkInfo?.find(
          c => c.startWordId !== undefined && c.endWordId !== undefined &&
               wordIndex >= c.startWordId && wordIndex <= c.endWordId
        );
        
        // Also check chunks array in metadata
        const metadataChunk = audioMetadata?.chunks?.find(
          c => wordIndex >= c.startWordId && wordIndex <= c.endWordId
        );
        
        const targetChunkId = chunkInfo?.chunkId ?? metadataChunk?.chunkId;
        
        if (targetChunkId === undefined) {
          console.warn(`No chunk found for word ${wordIndex}`);
          set({ error: 'Cannot find audio for this position' });
          return;
        }

        // Ensure chunk has audio generated
        if (!chunksWithAudio.includes(targetChunkId)) {
          set({ isLoadingChunk: true });
          
          try {
            await ttsApi.generateChunk(documentId, targetChunkId, selectedVoiceId || undefined);
            const status = await ttsApi.getStatus(documentId);
            set({
              chunksWithAudio: status.chunksWithAudio || [],
              audioMetadata: status.metadata || audioMetadata,
              isLoadingChunk: false,
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to generate audio',
              isLoadingChunk: false,
            });
            return;
          }
        }

        // Get or create audio element
        let audio = _audioElement;
        if (!audio) {
          audio = new Audio();
          audio.preload = 'auto';
          
          // Copy event handlers from play()
          audio.onplay = () => set({ isPlaying: true, isPaused: false });
          audio.onpause = () => set({ isPaused: true, isPlaying: false });
          audio.onended = () => {
            const state = get();
            if (state.currentChunkId < state.totalChunks - 1) {
              state.nextChunk();
            } else {
              set({ isPlaying: false, isPaused: false, currentTime: 0, activeWordIndex: null });
            }
          };
          audio.ontimeupdate = () => {
            const state = get();
            const currentTime = audio!.currentTime;
            const duration = audio!.duration;
            
            // Compute active word from playback time using shared logic
            const activeWordIndex = computeActiveWordFromState(currentTime, duration, state);
            
            set({ currentTime, activeWordIndex });
            
            if (duration > 0 && currentTime / duration >= PREFETCH_THRESHOLD) {
              state.triggerPrefetch(state.currentChunkId);
            }
          };
          audio.ondurationchange = () => set({ duration: audio!.duration });
          audio.onerror = () => set({ error: 'Failed to load audio', isPlaying: false, isLoadingChunk: false });
          
          set({ _audioElement: audio });
        }

        // Load chunk audio
        const audioUrl = ttsApi.getChunkAudioUrl(documentId, targetChunkId);
        audio.src = audioUrl;
        audio.playbackRate = playbackSpeed;
        audio.volume = volume;

        // Wait for audio to load enough to seek
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            audio!.removeEventListener('canplay', onCanPlay);
            audio!.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            audio!.removeEventListener('canplay', onCanPlay);
            audio!.removeEventListener('error', onError);
            reject(new Error('Failed to load audio'));
          };
          audio!.addEventListener('canplay', onCanPlay);
          audio!.addEventListener('error', onError);
          audio!.load();
        });

        // Calculate time offset for the word
        const updatedChunkInfo = get().audioMetadata?.chunkInfo?.find(c => c.chunkId === targetChunkId);
        const audioFile = get().audioMetadata?.audioFiles?.find(f => f.chunkId === targetChunkId);
        const timeOffset = resolveWordTimeOffset(wordIndex, audio.duration, updatedChunkInfo, audioFile);

        // Seek to word position
        audio.currentTime = timeOffset;

        set({
          currentChunkId: targetChunkId,
          currentTime: timeOffset,
          activeWordIndex: wordIndex,
        });

        // Start playback
        try {
          await audio.play();
        } catch (error) {
          set({ error: `Playback failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
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
