// NLP types (matching TTS-NLP service contract)
export interface NlpWord {
  /** Global word index (0-based, stable across document) */
  index: number;
  /** Word text content */
  text: string;
  /** Parent sentence index */
  sentenceIndex: number;
}

export interface NlpSentence {
  /** Sentence index (0-based) */
  index: number;
  /** First word index in sentence */
  startWord: number;
  /** Last word index in sentence (inclusive) */
  endWord: number;
  /** Full sentence text */
  text: string;
}

export interface NlpDocumentResult {
  /** Detected language code (e.g., 'en') */
  language: string;
  /** Total word count */
  wordCount: number;
  /** Total sentence count */
  sentenceCount: number;
  /** Ordered list of all words */
  words: NlpWord[];
  /** Ordered list of all sentences */
  sentences: NlpSentence[];
}

// Chunk types (matching backend chunk.ts)
export interface ChunkConfig {
  /** Maximum words per chunk */
  maxWordsPerChunk: number;
  /** Target words per chunk */
  targetWordsPerChunk: number;
  /** Estimated words per minute for speech */
  wordsPerMinute: number;
  /** Maximum duration per chunk in seconds */
  maxDurationSeconds: number;
}

export interface Chunk {
  /** Unique chunk identifier (0-based, sequential) */
  chunkId: number;
  /** First word index in chunk (inclusive) */
  startWordId: number;
  /** Last word index in chunk (inclusive) */
  endWordId: number;
  /** Number of words in this chunk */
  wordCount: number;
  /** First sentence index in chunk */
  startSentenceId: number;
  /** Last sentence index in chunk */
  endSentenceId: number;
  /** Number of sentences in this chunk */
  sentenceCount: number;
  /** Estimated duration in seconds */
  estimatedDurationSec: number;

  audioUrl?: string;
}

export interface ChunkMetadata {
  /** Document ID this chunk data belongs to */
  documentId: string;
  /** Total number of chunks */
  totalChunks: number;
  /** Total word count */
  totalWords: number;
  /** Total sentence count */
  totalSentences: number;
  /** Total estimated duration in seconds */
  totalDurationSec: number;
  /** Configuration used to generate chunks */
  config: ChunkConfig;
  /** Ordered list of chunks */
  chunks: Chunk[];
  /** Timestamp when chunks were generated */
  generatedAt: string;
  /** Version for cache invalidation */
  version: string;
}

export interface ChunkLookupResult {
  /** The chunk containing the word */
  chunk: Chunk;
  /** Position within chunk (0.0 - 1.0) */
  positionInChunk: number;
  /** Whether this is the first chunk */
  isFirstChunk: boolean;
  /** Whether this is the last chunk */
  isLastChunk: boolean;
}

export interface ChunkNavigation {
  /** Current chunk */
  current: Chunk;
  /** Previous chunk (null if at start) */
  previous: Chunk | null;
  /** Next chunk (null if at end) */
  next: Chunk | null;
  /** Current position (0 to totalChunks - 1) */
  currentIndex: number;
  /** Total chunks */
  totalChunks: number;
}

// Document types (matching backend)
export interface Document {
  id: string;
  title: string;
  originalFilename: string;
  storedFilename: string;
  filename: string; // deprecated
  filePath: string;
  fileType: 'pdf' | 'txt' | 'docx' | 'epub';
  fileSize: number;
  cleanedText: string;
  wordCount: number;
  pageCount?: number;
  uploadedAt: string;
  metadata?: DocumentMetadata;
  /** NLP analysis result - populated if available */
  nlp?: NlpDocumentResult;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// TTS Types (matching backend tts.ts)
export type TtsProvider = 'elevenlabs' | 'google' | 'azure' | 'openai';

export interface Voice {
  /** Unique voice identifier */
  id: string;
  /** Human-readable voice name */
  name: string;
  /** Voice description */
  description?: string;
  /** Language code */
  language: string;
  /** Voice gender */
  gender?: 'male' | 'female' | 'neutral';
  /** Voice style tags */
  tags?: string[];
  /** Preview audio URL */
  previewUrl?: string;
  /** Provider */
  provider: TtsProvider;
}

/**
 * Word timing for precise audio-text synchronization
 * Used for real-time word highlighting during playback
 */
export interface WordTiming {
  /** Global word index (matches NlpWord.index) */
  wordIndex: number;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/**
 * Sentence timing for phrase-level highlighting
 * Good fallback when word timestamps unavailable
 */
export interface SentenceTiming {
  /** Sentence index */
  sentenceIndex: number;
  /** First word index in sentence */
  startWordId: number;
  /** Last word index in sentence */
  endWordId: number;
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

export interface AudioFileMetadata {
  documentId: string;
  chunkId: number;
  voiceId: string;
  provider: TtsProvider;
  filePath: string;
  fileSize: number;
  durationSec: number;
  startWordId: number;
  endWordId: number;
  charactersUsed: number;
  generatedAt: string;
  /** Word-level timing (Level 1 - best) */
  wordTimings?: WordTiming[];
  /** Sentence-level timing (Level 2 - fallback) */
  sentenceTimings?: SentenceTiming[];
}

/** Info about a chunk's audio generation status */
export interface ChunkAudioInfo {
  chunkId: number;
  hasAudio: boolean;
  durationSec?: number;
  startWordId?: number;
  endWordId?: number;
  wordCount?: number;
  /** Word-level timing (Level 1 - best) */
  wordTimings?: WordTiming[];
  /** Sentence-level timing (Level 2 - fallback) */
  sentenceTimings?: SentenceTiming[];
}

export interface DocumentAudioMetadata {
  documentId: string;
  voiceId: string;
  provider: TtsProvider;
  chunks: Chunk[];
  totalChunks: number;
  totalDurationSec: number;
  /** Estimated total duration (available immediately, before generation) */
  estimatedTotalDurationSec?: number;
  totalCharactersUsed: number;
  audioFiles: AudioFileMetadata[];
  /** Info about which chunks have audio generated */
  chunkInfo?: ChunkAudioInfo[];
  generatedAt: string;
  completedAt?: string;
  status: 'pending' | 'generating' | 'ready' | 'completed' | 'failed';
  error?: string;
}

export interface GenerationStatus {
  status: 'none' | 'pending' | 'generating' | 'ready' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  metadata?: DocumentAudioMetadata;
  /** Estimated duration available immediately */
  estimatedTotalDurationSec?: number;
  /** Number of chunks that have audio generated */
  generatedChunks?: number;
  /** IDs of chunks that have audio ready */
  chunksWithAudio?: number[];
}
