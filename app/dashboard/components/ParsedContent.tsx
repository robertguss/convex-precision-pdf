import React, { useEffect, useRef } from 'react';

import { marked } from 'marked';

interface Chunk {
  chunk_id: string;
  chunk_type: string;
  text?: string;
  content?: string;
}

interface ParsedContentProps {
  chunks: Chunk[];
  activeChunkId: string | null;
  multiSelectedChunkIds: string[];
  onChunkClick: (chunkId: string, event: React.MouseEvent<HTMLDivElement>) => void;
  isLoading?: boolean;
  elapsedTime?: number;
}

const ParsedContent: React.FC<ParsedContentProps> = ({
  chunks,
  activeChunkId,
  multiSelectedChunkIds,
  onChunkClick,
  isLoading = false,
  elapsedTime = 0,
}) => {
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (activeChunkId && chunkRefs.current[activeChunkId]) {
      chunkRefs.current[activeChunkId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeChunkId]);

  // Helper: get chunk text from markdown (fallback to chunk.text if needed)
  // For now, just use chunk.text, as markdown is the full doc

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          {/* Spinner */}
          <div className="mb-6 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>

          {/* Main status */}
          <h3 className="mb-3 text-lg font-semibold text-gray-700">
            Extracting Content with AI...
          </h3>

          {/* Progress steps */}
          <div className="mb-6 space-y-3 text-sm">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">
                Document uploaded successfully
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Images generated</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
              <span className="font-medium text-gray-700">
                Analyzing document content...
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
              <span className="text-gray-400">Extracting structured data</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full animate-pulse bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
              style={{ width: `${Math.min(90, 20 + elapsedTime * 2.5)}%` }}
            ></div>
          </div>

          {/* Elapsed time */}
          <div className="mb-4 text-sm font-medium text-gray-600">
            Time elapsed: {elapsedTime}s
          </div>

          {/* Informative text */}
          <p className="text-sm text-gray-600">
            Our AI is analyzing your document to extract tables, forms, and text
            content. This typically takes 15-30 seconds depending on document
            complexity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      {chunks.map((chunk, idx) => {
        const isActive = chunk.chunk_id === activeChunkId;
        const isMultiSelected = multiSelectedChunkIds.includes(chunk.chunk_id);

        let chunkClassName =
          'relative group p-4 rounded-md transition-all duration-100 cursor-pointer';

        if (isActive) {
          chunkClassName += ' border-2 border-green-600 bg-green-400/30 z-20';
        } else if (isMultiSelected) {
          chunkClassName += ' border-2 border-blue-500 bg-blue-300/20 z-10';
        } else {
          chunkClassName +=
            ' border border-gray-200 bg-white hover:border-green-400 hover:bg-green-100/10 z-10';
        }

        return (
          <div
            key={chunk.chunk_id}
            id={chunk.chunk_id}
            ref={(el) => {
              chunkRefs.current[chunk.chunk_id] = el;
            }}
            onClick={(event) => onChunkClick(chunk.chunk_id, event)}
            className={chunkClassName}
          >
            <div className="mb-1 text-xs text-gray-400">
              {idx + 1} -{' '}
              {chunk.chunk_type
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </div>
            {chunk.chunk_type === 'table' || chunk.chunk_type === 'form' ? (
              <div
                className="prose prose-sm max-w-none overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: marked(chunk.text || chunk.content || '') }}
              />
            ) : (
              <div
                className="whitespace-pre-line text-gray-800"
                dangerouslySetInnerHTML={{ __html: marked(chunk.text || chunk.content || '') }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParsedContent;
