# AudioPlayer Module

Full-featured audio player with mobile-first design and modular architecture.

## Structure

```
AudioPlayer/
├── AudioPlayer.tsx              # Main player component
├── MiniPlayer.tsx               # Compact player variant
├── AudioPlayerHeader.tsx        # Chapter info and metadata display
├── AudioPlayerProgress.tsx      # Interactive progress bar
├── AudioPlayerControls.tsx      # Playback control buttons
├── AudioPlayerGeneration.tsx    # Audio generation UI states
├── AudioPlayerIcons.tsx         # SVG icon components
├── useAudioPlayerLogic.ts       # Business logic hook
└── index.ts                     # Module exports
```

## Components

### AudioPlayer
Main player component with full controls and mobile-optimized touch targets.

**Props:**
- `documentId: string | null` - Document ID to play
- `chapterTitle?: string` - Chapter/section title to display
- `onWordPositionChange?: (wordId: number) => void` - Callback for text highlighting
- `className?: string` - Additional CSS classes

**Features:**
- Play/Pause/Stop controls
- Skip forward/backward 10 seconds
- Chunk navigation (previous/next)
- Playback speed control (0.5x - 2.0x)
- Interactive progress bar with touch support
- Current chapter/section display
- Mobile-optimized touch targets

### MiniPlayer
Compact audio player for embedding in headers or sidebars.

**Props:**
- `onExpand?: () => void` - Callback to expand to full player
- `className?: string` - Additional CSS classes

**Features:**
- Minimal footprint
- Play/pause toggle
- Progress indicator
- Time display
- Chunk indicator
- Expandable to full player

### AudioPlayerHeader
Displays chapter information and time metadata.

**Props:**
- `currentChunkId: number` - Current chunk ID (0-based)
- `totalChunks: number` - Total number of chunks
- `currentTime: number` - Current playback time in seconds
- `audioMetadata: DocumentAudioMetadata | null` - Audio metadata for total duration
- `chapterTitle?: string` - Chapter or section title
- `className?: string` - Additional CSS classes

### AudioPlayerProgress
Interactive progress bar with touch and mouse support.

**Props:**
- `progress: number` - Current progress percentage (0-100)
- `onSeek: (e: MouseEvent | TouchEvent) => void` - Seek callback
- `className?: string` - Additional CSS classes

### AudioPlayerControls
Playback control buttons (play, pause, skip, next/previous chunk).

**Props:**
- `isPlaying: boolean` - Whether audio is currently playing
- `isLoading: boolean` - Whether player is loading
- `currentChunkId: number` - Current chunk ID (0-based)
- `totalChunks: number` - Total number of chunks
- `currentTime: number` - Current playback time in seconds
- `onPlayPause: () => void` - Toggle play/pause
- `onSkipBackward: () => void` - Skip backward 10 seconds
- `onSkipForward: () => void` - Skip forward 10 seconds
- `onPreviousChunk: () => void` - Go to previous chunk
- `onNextChunk: () => void` - Go to next chunk
- `className?: string` - Additional CSS classes

### AudioPlayerGeneration
UI states for audio generation and progress display.

**Props:**
- `status: 'idle' | 'generating' | 'complete' | 'error'` - Generation status
- `progress?: number` - Generation progress (0-100)
- `isLoading: boolean` - Whether player is loading
- `documentId: string | null` - Document ID for generation
- `onGenerate: () => void` - Start audio generation
- `className?: string` - Additional CSS classes

### AudioPlayerIcons
Reusable SVG icon components:
- `PlayIcon` - Play button icon
- `PauseIcon` - Pause button icon
- `PreviousIcon` - Previous chunk icon
- `NextIcon` - Next chunk icon
- `SkipBackIcon` - Skip backward 10s icon
- `SkipForwardIcon` - Skip forward 10s icon
- `LoadingSpinner` - Loading animation

### useAudioPlayerLogic
Custom hook that encapsulates audio player business logic and event handlers.

**Parameters:**
- `documentId: string | null` - Document ID to load
- `onWordPositionChange?: (wordId: number) => void` - Word position callback

**Returns:**
All player state and action handlers from `useAudioPlayerStore`, plus:
- `handlePlayPause: () => void`
- `handleSeek: (e: MouseEvent | TouchEvent) => void`
- `skipForward: () => void`
- `skipBackward: () => void`
- `cycleSpeed: () => void`
- `progress: number` - Progress percentage
- `totalProgress: number` - Total progress across all chunks

## Usage

```tsx
import { AudioPlayer, MiniPlayer } from '@/components/AudioPlayer';

// Full player
<AudioPlayer
  documentId="doc-123"
  chapterTitle="Chapter 1: Introduction"
  onWordPositionChange={(wordId) => console.log(wordId)}
/>

// Mini player
<MiniPlayer
  onExpand={() => setShowFullPlayer(true)}
  className="fixed top-4 right-4"
/>
```

## Architecture Benefits

### Modularity
- Each component has a single, well-defined responsibility
- Easy to test components in isolation
- Simple to modify or extend individual features

### Code Reusability
- Icon components can be used anywhere in the app
- Logic hook can be reused in different player variants
- Header/controls/progress can be composed differently

### Maintainability
- Changes to icons don't affect player logic
- Business logic is centralized in the custom hook
- Clear separation between UI and state management

### Performance
- Smaller bundle sizes through tree-shaking
- Components can be lazy-loaded independently
- Reduced re-renders with targeted memoization

## State Management

The player uses Zustand for global state management via `audioPlayerStore`:

- **Audio state:** `isPlaying`, `isPaused`, `isLoading`
- **Playback:** `currentTime`, `duration`, `playbackSpeed`
- **Chunks:** `currentChunkId`, `totalChunks`
- **Metadata:** `audioMetadata`, `generationStatus`
- **Actions:** `play()`, `pause()`, `seekTo()`, `nextChunk()`, etc.

## Styling

All components use Tailwind CSS with:
- Mobile-first responsive design
- Dark mode support
- Touch-optimized targets (min 44x44px)
- Smooth transitions and animations
- Accessible color contrasts
