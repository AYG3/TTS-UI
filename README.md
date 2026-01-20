# TTS Reader - Frontend Application

> Modern Next.js frontend for the TTS Reader application with real-time text highlighting and audio synchronization.

## 🎨 Features

- **📖 Document Viewer**: Clean, readable display of uploaded documents
- **🎵 Audio Player**: Custom controls with play/pause, speed adjustment
- **🗣️ Voice Selection**: Dropdown to choose from available AI voices
- **✨ Real-time Highlighting**: Word-by-word highlighting synchronized with audio
- **🎯 Click Navigation**: Click any word to jump to that position in narration
- **⚡ Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 15.x (App Router)
- **Language**: TypeScript/JavaScript
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Hooks + Context API
- **HTTP Client**: Fetch API
- **Audio**: HTML5 Audio API

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📁 Project Structure

```
tts-ui/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Home page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/             # React components (to be created)
│   │   ├── DocumentViewer/    # Document display with highlighting
│   │   ├── AudioPlayer/       # Custom audio controls
│   │   ├── UploadZone/        # Drag-and-drop file upload
│   │   ├── VoiceSelector/     # Voice dropdown
│   │   └── SpeedControl/      # Speed adjustment slider
│   │
│   ├── lib/                    # Utilities (to be created)
│   │   ├── api.js             # API client functions
│   │   ├── audio-sync.js      # Audio synchronization logic
│   │   └── utils.js           # Helper functions
│   │
│   └── types/                  # Type definitions (to be created)
│
├── public/                     # Static assets
│
└── Configuration files
    ├── next.config.mjs
    ├── tailwind.config.js
    ├── jsconfig.json
    └── eslint.config.mjs
```

## 🎯 Key Components (To Be Implemented)

### DocumentViewer
- Displays document text
- Handles word-level highlighting
- Manages click-to-jump interactions
- Responsive text sizing

### AudioPlayer
- Play/pause controls
- Progress bar with seek functionality
- Speed adjustment (0.5x - 2.0x)
- Volume control
- Current time / total duration display

### UploadZone
- Drag-and-drop file upload
- File type validation (PDF, DOCX, TXT, EPUB)
- Upload progress indicator
- Success/error feedback

### VoiceSelector
- Dropdown of available voices
- Voice metadata (language, gender)
- Save voice preference

## 🔗 API Integration

Example API calls to backend:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Upload document
const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

// Generate audio
const generateAudio = async (documentId, voice, speed) => {
  const response = await fetch(`${API_URL}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, voice, speed }),
  });
  return response.json();
};

// Get available voices
const getVoices = async () => {
  const response = await fetch(`${API_URL}/api/voices`);
  return response.json();
};
```

## 🎨 Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing (4px/8px grid)
- Ensure WCAG AA accessibility standards

## 🧪 Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📱 Responsive Breakpoints

```css
/* Mobile: default (< 640px) */
/* Tablet: sm (≥ 640px) */
/* Desktop: md (≥ 768px) */
/* Large: lg (≥ 1024px) */
/* XLarge: xl (≥ 1280px) */
```

## ♿ Accessibility

- Keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader compatibility
- Focus management
- High contrast mode support

## 🚀 Deployment

Built with Next.js - deploy to Vercel or any Node.js hosting:

```bash
# Build optimized production bundle
npm run build

# Deploy to Vercel
vercel deploy

# Or start production server
npm start
```

## 📝 Next Steps (Week 3-4)

1. Create component structure
2. Implement DocumentViewer with highlighting
3. Build custom AudioPlayer
4. Integrate API calls
5. Add synchronization logic
6. Implement click-to-jump
7. Polish UI/UX

---

**Status**: Week 1 - Foundation Phase  
**Last Updated**: January 16, 2026

For backend documentation, see [TTS-NODE README](../TTS-NODE/README.md)  
For architecture details, see [ARCHITECTURE.md](../ARCHITECTURE.md)
