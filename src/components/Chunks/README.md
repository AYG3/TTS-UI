# Chunks Module

Components for displaying and navigating text chunks.

## Structure

```
Chunks/
├── ChunkNavigator.tsx    # Chunk navigation controls
├── ChunkInfo.tsx         # Detailed chunk metadata display
└── index.ts              # Module exports
```

## Components

### ChunkNavigator
Displays chunk navigation controls and progress information.

**Props:**
- `documentId: string | null` - Document ID to load chunks for
- `activeWordIndex?: number` - Current word index for tracking playback position
- `onChunkChange?: (chunk: Chunk) => void` - Callback when chunk changes
- `onSeekToWord?: (wordId: number) => void` - Callback when user clicks a word
- `compact?: boolean` - Show compact view
- `className?: string` - Additional CSS classes

**Features:**
- Previous/Next chunk buttons
- Current chunk indicator
- Total duration display
- Progress bar
- Click-to-jump to specific chunk
- Compact and full view modes

### ChunkInfo
Displays detailed information about chunk metadata, useful for debugging and analytics.

**Props:**
- `chunkMetadata: ChunkMetadata | null` - Chunk metadata to display
- `currentChunkId?: number` - Currently active chunk ID
- `onChunkClick?: (chunk: Chunk) => void` - Callback when a chunk is clicked
- `className?: string` - Additional CSS classes

**Features:**
- Summary statistics (total chunks, words, sentences, duration)
- Configuration details
- Detailed chunk list with word ranges
- Interactive chunk selection
- Active chunk highlighting

## Usage

```tsx
import { ChunkNavigator, ChunkInfo } from '@/components/Chunks';

// Compact navigation
<ChunkNavigator
  documentId="doc-123"
  activeWordIndex={42}
  compact
  onChunkChange={(chunk) => console.log('Now on chunk:', chunk.chunkId)}
/>

// Full navigation with click-to-jump
<ChunkNavigator
  documentId="doc-123"
  onSeekToWord={(wordId) => player.seekToWord(wordId)}
/>

// Detailed metadata view
<ChunkInfo
  chunkMetadata={metadata}
  currentChunkId={currentChunk}
  onChunkClick={(chunk) => navigateToChunk(chunk)}
/>
```

## Integration

ChunkNavigator uses the `useChunks` hook which provides:
- Chunk loading and caching
- Navigation helpers (`goToNextChunk`, `goToPreviousChunk`, `goToChunk`)
- Progress calculation
- Active chunk detection based on word index

## Styling

- Mobile-first responsive design
- Touch-friendly interactive elements
- Clear visual indicators for active chunk
- Accessible keyboard navigation
