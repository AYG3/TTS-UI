/**
 * ThumbnailSidebar Module
 * 
 * Client-side PDF thumbnail generation using pdf.js
 * 
 * Architecture:
 * ├── types.ts                 - Type definitions
 * ├── usePdfThumbnails.ts      - Thumbnail generation hook (cached)
 * ├── PdfThumbnail.tsx         - Single thumbnail component (memoized)
 * └── ThumbnailSidebar.tsx     - Sidebar container (orchestrator)
 * 
 * Usage:
 * ```tsx
 * import { ThumbnailSidebar } from '@/components/Pdf/ThumbnailSidebar';
 * import { usePdfDocument } from '@/components/Pdf/usePdfDocument';
 * 
 * function PdfViewer() {
 *   const { document: pdf } = usePdfDocument('/my-document.pdf');
 *   const [currentPage, setCurrentPage] = useState(1);
 * 
 *   return (
 *     <div className="flex">
 *       <ThumbnailSidebar
 *         pdf={pdf}
 *         currentPage={currentPage}
 *         onPageSelect={setCurrentPage}
 *         options={{ scale: 0.25, progressive: true }}
 *       />
 *       <div>Main PDF viewer...</div>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Key Features:
 * - Client-side rendering using pdf.js (NOT backend generation)
 * - Progressive loading (first 10 pages, then rest)
 * - Canvas caching (render once, reuse forever)
 * - Auto-scroll to current page
 * - Keyboard navigation (arrow keys)
 * - Responsive design (desktop/mobile)
 * 
 * Performance:
 * - Scale: 0.25 (25% of full size - recommended range: 0.2-0.3)
 * - Target width: 140px (recommended range: 120-160)
 * - Progressive: First 10 pages load immediately, rest in background
 * - Caching: Thumbnails cached in memory, never re-rendered
 * 
 * Why Client-Side?
 * ✓ Same pdf.js engine as main viewer (perfect accuracy)
 * ✓ Scales correctly for any screen size
 * ✓ No backend overhead or storage
 * ✓ Responsive to user's device capabilities
 * ✓ Works offline once PDF is loaded
 * 
 * Mobile Optimization:
 * - Smaller scale (0.2) for mobile devices
 * - Horizontal strip layout option (TODO)
 * - Touch-friendly tap targets
 */

export { ThumbnailPanel } from './ThumbnailPanel';
export { PdfThumbnail } from './PdfThumbnail';
export { usePdfThumbnails } from './usePdfThumbnails';
export type {
  ThumbnailItem,
  ThumbnailOptions,
  ThumbnailSidebarProps,
  PdfThumbnailProps,
} from './types';
