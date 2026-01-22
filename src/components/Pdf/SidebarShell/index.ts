/**
 * PDF Sidebar Shell
 * 
 * Professional sidebar architecture that separates concerns:
 * - Shell handles layout, resize, mobile behavior
 * - Header handles tab navigation
 * - Panels stay focused on content only
 * 
 * Usage:
 * ```tsx
 * <PdfSidebarShell
 *   isOpen={isOpen}
 *   width={width}
 *   minWidth={200}
 *   maxWidth={450}
 *   onResize={setWidth}
 *   onClose={handleClose}
 * >
 *   <SidebarHeader
 *     mode={mode}
 *     onModeChange={setMode}
 *     onClose={handleClose}
 *   />
 *   <SidebarPanel mode={mode} panelMode="toc">
 *     <TocSidebar ... />
 *   </SidebarPanel>
 *   <SidebarPanel mode={mode} panelMode="thumbnails">
 *     <ThumbnailSidebar ... />
 *   </SidebarPanel>
 * </PdfSidebarShell>
 * ```
 */

export { PdfSidebarShell } from './PdfSidebarShell';
export { SidebarHeader } from './SidebarHeader';
export { SidebarPanel } from './SidebarPanel';
export type {
  SidebarMode,
  PdfSidebarShellProps,
  SidebarHeaderProps,
  SidebarPanelProps,
} from './types';
