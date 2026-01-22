# Upload Module

Components for document upload with drag-and-drop support and progress tracking.

## Structure

```
Upload/
├── UploadView.tsx       # Main upload interface with features showcase
├── UploadZone.tsx       # Drag-and-drop file upload area
├── UploadProgress.tsx   # Upload progress display
└── index.ts             # Module exports
```

## Components

### UploadView
Mobile-first document upload interface with features showcase.

**Props:**
- `selectedFile: File | null` - Currently selected file
- `isUploading: boolean` - Whether upload is in progress
- `uploadProgress: number` - Upload progress percentage (0-100)
- `error: string | null` - Error message if upload failed
- `onFileSelect: (file: File) => void` - Callback when file is selected

**Features:**
- Integrated upload zone
- Progress tracking
- Feature highlights (Multiple formats, Smart extraction, Privacy)
- Mobile-optimized layout
- Error handling

### UploadZone
Drag-and-drop file upload with validation.

**Props:**
- `onFileSelect: (file: File) => void` - Callback when file is selected
- `accept?: string` - Accepted file types (default: '.pdf,.txt')
- `maxSizeMB?: number` - Maximum file size in MB (default: 50)

**Features:**
- Drag-and-drop support
- Click to browse
- File type validation
- File size validation
- Visual feedback on drag over
- Selected file preview
- Remove file option

### UploadProgress
Display upload progress with animation.

**Props:**
- `progress: number` - Progress percentage (0-100)
- `isUploading: boolean` - Whether upload is in progress
- `error: string | null` - Error message if upload failed
- `fileName?: string` - Name of file being uploaded

**Features:**
- Animated progress bar
- Status icons (loading, success, error)
- File name display
- Error messages
- Success confirmation

## Usage

```tsx
import { UploadView, UploadZone, UploadProgress } from '@/components/Upload';

// Full upload view with features
<UploadView
  selectedFile={file}
  isUploading={uploading}
  uploadProgress={progress}
  error={error}
  onFileSelect={handleFileSelect}
/>

// Standalone upload zone
<UploadZone
  onFileSelect={handleFileSelect}
  accept=".pdf,.txt,.doc"
  maxSizeMB={100}
/>

// Standalone progress indicator
<UploadProgress
  progress={75}
  isUploading={true}
  fileName="document.pdf"
/>
```

## File Validation

UploadZone performs automatic validation:
- **File Type:** Checks extension against accepted types
- **File Size:** Ensures file is within size limit
- **Empty Files:** Rejects 0-byte files
- **Error Display:** Shows user-friendly error messages

## Styling

- Mobile-first responsive design
- Touch-friendly drag-and-drop area
- Clear visual states (idle, dragging, selected, error, success)
- Smooth transitions and animations
- Accessible color contrasts and focus states

## Integration

These components work with:
- `useDocumentStore` for document management
- Document API for file upload
- NLP service for text extraction
