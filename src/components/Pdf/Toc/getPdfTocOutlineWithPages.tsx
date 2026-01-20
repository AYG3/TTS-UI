

/**
 * Extract PDF Table of Contents with page numbers
 * Handles pdf.js outline format and resolves destinations to page numbers
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TocItemData } from './TocItem';

export async function getPdfTocOutlineWithPages(
  pdf: PDFDocumentProxy
): Promise<TocItemData[]> {
  try {
    // Get the PDF outline (table of contents)
    const outline = await pdf.getOutline();
    
    // Return empty array if no outline exists
    if (!outline || outline.length === 0) {
      console.log('No outline found in PDF document');
      return [];
    }

    console.log(`Found PDF outline with ${outline.length} top-level items`);

    // Recursive function to walk through outline items
    async function walk(items: any[]): Promise<TocItemData[]> {
      const results: TocItemData[] = [];

      for (const item of items) {
        try {
          let pageNumber: number | null = null;

          // Try to resolve the destination to a page number
          if (item.dest) {
            try {
              // dest can be a string (named destination) or array (explicit destination)
              const destination = typeof item.dest === 'string'
                ? await pdf.getDestination(item.dest)
                : item.dest;

              if (destination && Array.isArray(destination) && destination[0]) {
                // Get page index from the reference object
                const pageIndex = await pdf.getPageIndex(destination[0]);
                pageNumber = pageIndex + 1; // Convert to 1-indexed page number
              }
            } catch (destError) {
              console.warn(`Failed to resolve destination for "${item.title}":`, destError);
              // Continue processing even if destination resolution fails
            }
          }

          // Recursively process children
          const children = item.items && item.items.length > 0
            ? await walk(item.items)
            : [];

          results.push({
            title: item.title || 'Untitled',
            pageNumber,
            children,
          });
        } catch (itemError) {
          console.error(`Error processing outline item:`, itemError);
          // Continue with other items even if one fails
        }
      }

      return results;
    }

    const tocItems = await walk(outline);
    console.log(`Successfully extracted ${tocItems.length} TOC items`);
    return tocItems;

  } catch (error) {
    console.error('Error extracting PDF outline:', error);
    return [];
  }
}