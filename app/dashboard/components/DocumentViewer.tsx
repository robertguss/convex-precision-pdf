import React, { useEffect, useRef, useState } from 'react';

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

interface Grounding {
  page: number;
  box: Box;
}

interface Chunk {
  chunk_id: string;
  chunk_type: string;
  grounding?: Grounding[];
}

interface RenderableInstance {
  original_chunk_id: string;
  chunk_type: string;
  page: number;
  box: Box;
  instanceKey: string;
}

interface DocumentViewerProps {
  pages: number;
  chunks: Chunk[];
  activeChunkId: string | null;
  multiSelectedChunkIds: string[];
  onChunkClick: (chunkId: string, event: React.MouseEvent) => void;
  documentBasename: string;
  backendUrl: string;
  currentExampleStaticBasePath: string | null;
  documentId: string | null;
}

/**
 * DocumentViewer
 * @param {Object} props
 * @param {number} pages - number of pages
 * @param {Array} chunks - array of chunk objects (with grounding info)
 * @param {string|null} activeChunkId - The ID of the primarily active chunk
 * @param {Array} multiSelectedChunkIds - Array of all selected chunk IDs
 * @param {function} onChunkClick - Handler from App.jsx (chunkId, event) => void
 * @param {string} documentBasename - Add documentBasename prop
 * @param {string} backendUrl - Add backendUrl to props destructuring
 * @param {string|null} currentExampleStaticBasePath - Path to static images for examples
 * @param {string|null} documentId - Document ID for fetching page images
 */
const DocumentViewer: React.FC<DocumentViewerProps> = ({
  pages,
  chunks,
  activeChunkId, // New: ID of the primarily active chunk
  multiSelectedChunkIds, // New: Array of all selected chunk IDs
  onChunkClick, // New: Handler from App.jsx (chunkId, event) => void
  documentBasename, // Add documentBasename prop
  backendUrl, // Add backendUrl to props destructuring
  currentExampleStaticBasePath, // New prop for static image path
  documentId, // New prop for document ID
}) => {
  const [hoveredChunkId, setHoveredChunkId] = useState<string | null>(null); // Local state for hover
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]); // Create refs for page containers

  // Group chunks by page and also create a map from chunkId to pageIdx
  // For examples, ensure at least 1 page even if pages prop is 0
  const pageCount = currentExampleStaticBasePath && pages === 0 ? 1 : pages;
  const chunksByPage: RenderableInstance[][] = Array.from(
    { length: pageCount },
    () => [],
  );
  const chunkToPageMap = useRef<Record<string, number>>({}); // For scrolling based on activeChunkId (original chunk_id)

  // Ensure chunks is an array
  const safeChunks = Array.isArray(chunks) ? chunks : [];

  // Populate chunksByPage with renderable instances, one for each grounding box
  safeChunks.forEach((originalChunk) => {
    let primaryPageForChunk: number | null = null;

    if (originalChunk.grounding && Array.isArray(originalChunk.grounding)) {
      originalChunk.grounding.forEach((g, groundingIndex) => {
        // Ensure g, g.page is a number, g.box exist, and page index is valid
        if (
          g &&
          typeof g.page === 'number' &&
          g.box &&
          g.page >= 0 &&
          g.page < chunksByPage.length
        ) {
          const renderableInstance = {
            original_chunk_id: originalChunk.chunk_id,
            chunk_type: originalChunk.chunk_type,
            // Add any other necessary properties from originalChunk here

            // Grounding-specific details for this instance
            page: g.page,
            box: g.box,
            instanceKey: `${originalChunk.chunk_id}-${groundingIndex}`, // Unique key for React
          };
          const pageChunks = chunksByPage[g.page];
          if (pageChunks) {
            pageChunks.push(renderableInstance);
          }

          if (primaryPageForChunk === null) {
            primaryPageForChunk = g.page;
          }
        }
      });
    }

    // Map original chunk_id to its primary page for scrolling
    if (primaryPageForChunk !== null && originalChunk.chunk_id) {
      chunkToPageMap.current[originalChunk.chunk_id] = primaryPageForChunk;
    }
  });

  // Effect to scroll the page into view when activeChunkId changes
  useEffect(() => {
    if (activeChunkId && chunkToPageMap.current[activeChunkId] !== undefined) {
      const pageIdx = chunkToPageMap.current[activeChunkId];
      if (pageRefs.current[pageIdx]) {
        pageRefs.current[pageIdx].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeChunkId]);

  // Show a placeholder only if we have no pages to display and it's not an example
  if (documentId && !currentExampleStaticBasePath && pages === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">
            PDF Visualization Coming Soon
          </h3>
          <p className="mb-4 text-blue-700">
            The PDF pages will be displayed here once the document processing is
            complete. For now, you can view the extracted content in the right
            panel.
          </p>
          <div className="text-sm text-blue-600">
            <p>Document ID: {documentId}</p>
            <p>Total pages: {pages}</p>
            <p>Total chunks: {safeChunks.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4">
      {chunksByPage.map((pageChunks, pageIdx) => (
        <div
          key={pageIdx}
          ref={(el) => {
            pageRefs.current[pageIdx] = el;
          }} // Assign ref to page container
          className="relative mx-auto w-full max-w-3xl"
        >
          {/* Full-page image */}
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(() => {
                const src = currentExampleStaticBasePath
                  ? `${currentExampleStaticBasePath}/images/page_${pageIdx}.png`
                  : documentId
                    ? `/api/documents/${documentId}/page-image/${pageIdx}`
                    : `${backendUrl}/api/document/${documentBasename}/page_image/${pageIdx}`;

                return src;
              })()}
              alt={`Page ${pageIdx + 1}`}
              className="w-full border object-contain shadow"
              onError={(e) => {
                const imageSrc = e.currentTarget.src;
                console.error('Image failed to load:', imageSrc);
                console.error('Debug info:', {
                  documentId,
                  pageIdx,
                  currentExampleStaticBasePath,
                  pages,
                  documentBasename,
                });

                // If image fails to load, show a placeholder
                e.currentTarget.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className =
                  'flex items-center justify-center h-96 bg-gray-100 border rounded';
                placeholder.innerHTML = `<p class="text-gray-500">Page ${pageIdx + 1}</p>`;
                e.currentTarget.parentNode?.replaceChild(
                  placeholder,
                  e.currentTarget,
                );
              }}
            />
          </div>
          {/* Overlays */}
          <div className="pointer-events-none absolute inset-0">
            {pageChunks.map((instance) => {
              // instance is a renderableInstance object
              // const box = chunk.grounding?.box || chunk.grounding[0]?.box; // Adapt based on actual structure // REMOVED
              // if (!box) return null; // Skip if no box // REMOVED

              const isActive = instance.original_chunk_id === activeChunkId;
              const isMultiSelected = multiSelectedChunkIds.includes(
                instance.original_chunk_id,
              );
              const isHovered = instance.original_chunk_id === hoveredChunkId;

              let overlayClassName =
                'absolute border-2 pointer-events-auto cursor-pointer'; // Removed transition for less flicker

              if (isActive) {
                overlayClassName += ' border-green-600 bg-green-400/30 z-20'; // Distinct active style
              } else if (isMultiSelected) {
                overlayClassName += ' border-blue-500 bg-blue-300/20 z-10'; // Multi-selected style (e.g., blue)
              } else if (isHovered) {
                overlayClassName += ' border-green-400 bg-green-200/20 z-10'; // Hover style with more opacity
              } else {
                overlayClassName +=
                  ' border-transparent hover:border-green-400 hover:bg-green-200/10 z-0';
              }

              return (
                <div
                  key={instance.instanceKey} // Use the new unique key
                  className={overlayClassName}
                  style={{
                    left: `${instance.box.l * 100}%`,
                    top: `${instance.box.t * 100}%`,
                    width: `${(instance.box.r - instance.box.l) * 100}%`,
                    height: `${(instance.box.b - instance.box.t) * 100}%`,
                  }}
                  onMouseEnter={() =>
                    setHoveredChunkId(instance.original_chunk_id)
                  }
                  onMouseLeave={() => setHoveredChunkId(null)}
                  onClick={(event) =>
                    onChunkClick(instance.original_chunk_id, event)
                  } // Use onChunkClick prop
                  title={instance.chunk_type}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentViewer;
