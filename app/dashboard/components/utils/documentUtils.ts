// ABOUTME: Utility functions for document processing and calculations
// ABOUTME: Includes page count calculation from chunks and grounding data
import { DocData } from '../types';

export function calculateNumberOfPages(docData: DocData | null): number {
  if (!docData) return 0;

  // Use num_pages if provided
  if (docData.num_pages !== undefined) {
    return docData.num_pages;
  }

  // Calculate from chunks if num_pages not available
  if (docData.chunks && docData.chunks.length > 0) {
    const numberOfPages =
      docData.chunks.reduce((maxPage, chunk) => {
        if (chunk.grounding && chunk.grounding.length > 0) {
          const chunkMaxPage = chunk.grounding.reduce(
            (maxGPage: number, g) => Math.max(maxGPage, g.page),
            -1,
          );
          return Math.max(maxPage, chunkMaxPage);
        }
        return maxPage;
      }, -1) + 1; // Add 1 because page numbers are 0-indexed

    // Handle edge cases
    if (numberOfPages === 0 && docData.chunks.length > 0) {
      const hasAnyGrounding = docData.chunks.some(
        (c) =>
          c.grounding &&
          c.grounding.length > 0 &&
          c.grounding[0]?.page !== undefined,
      );

      if (!hasAnyGrounding && docData.chunks.length > 0) {
        return 1; // Default to 1 page if chunks exist but no grounding info
      }
    }

    return Math.max(0, numberOfPages); // Ensure non-negative
  }

  return 0; // No chunks, no num_pages field
}
