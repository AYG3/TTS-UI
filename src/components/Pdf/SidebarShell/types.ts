/**
 * PDF Sidebar Shell Types
 * 
 * Shared types for the sidebar container architecture that hosts
 * multiple sidebar panels (TOC, Thumbnails, etc.)
 */

/** Available sidebar panel modes */
export type SidebarMode = 'toc' | 'thumbnails';

/** Props for the main sidebar shell container */
export interface PdfSidebarShellProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Current width in pixels */
  width: number;
  /** Minimum allowed width */
  minWidth: number;
  /** Maximum allowed width */
  maxWidth: number;
  /** Callback when width changes via resize */
  onResize: (width: number) => void;
  /** Callback to close sidebar */
  onClose: () => void;
  /** Sidebar content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/** Props for sidebar header with tabs */
export interface SidebarHeaderProps {
  /** Current active mode */
  mode: SidebarMode;
  /** Callback when mode changes */
  onModeChange: (mode: SidebarMode) => void;
  /** Callback to close sidebar */
  onClose: () => void;
  /** Hide close button (e.g., on desktop) */
  hideClose?: boolean;
}

/** Props for sidebar panel wrapper */
export interface SidebarPanelProps {
  /** Active mode */
  mode: SidebarMode;
  /** Which mode this panel represents */
  panelMode: SidebarMode;
  /** Panel content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}
