'use client';

/**
 * Sidebar Panel Wrapper
 * 
 * Conditionally renders panel content based on active mode.
 * Provides consistent styling and behavior for all panels.
 */

import type { SidebarPanelProps } from './types';

export function SidebarPanel({
  mode,
  panelMode,
  children,
  className = '',
}: SidebarPanelProps) {
  // Only render when this panel is active
  if (mode !== panelMode) {
    return null;
  }

  return (
    <div className={`flex-1 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
