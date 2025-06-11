'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

// import '../styles/index.css'; // Removed - styles not present in this project
import { DocumentHeader } from './DocumentHeader';
import DocumentViewer from './DocumentViewer';
import ParsedContent from './ParsedContent';
import { useChunkSelection } from './hooks/useChunkSelection';
import { DocData, ExportFormat } from './types';
import { calculateNumberOfPages } from './utils/documentUtils';
import { downloadFile, exportChunks } from './utils/exportUtils';

// Configuration for the backend API
// API_BASE_URL is still needed for DocumentViewer component to load images
const API_BASE_URL = process.env.NEXT_PUBLIC_FAST_API_URL || 'http://localhost:8000';

interface DocumentViewerWrapperProps {
  document: NonNullable<typeof api.documents.getDocument._returnType>;
  isDemo?: boolean;
}

export function DocumentViewerWrapper({
  document: initialDocument,
  isDemo = false,
}: DocumentViewerWrapperProps) {
  const documentId = initialDocument._id;
  
  // Poll for updates while processing (only for non-demo documents)
  const liveDocument = useQuery(
    api.documents.getDocument,
    isDemo ? "skip" : { documentId: documentId as Id<"documents"> }
  );
  
  // Use live document if available, otherwise use initial document
  const document = liveDocument ?? initialDocument;
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('');
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [docData, setDocData] = useState<DocData | null>(null);
  const [extractionStartTime, setExtractionStartTime] = useState<number | null>(
    null,
  );
  const [elapsedTime, setElapsedTime] = useState(0);

  // Get the static base path for example documents
  const exampleBasePath = document?.landingAiResponse?.isExample 
    ? document?.landingAiResponse?.staticBasePath 
    : null;

  const {
    activeChunkId,
    multiSelectedChunkIds,
    handleChunkClick,
    clearSelection,
  } = useChunkSelection();

  // Initialize docData from document
  useEffect(() => {
    if (document) {
      // Transform chunks to match the expected format for DocumentViewer
      const transformedChunks = (document.chunks || []).map(chunk => {
        const metadata = chunk.metadata as Record<string, unknown> || {};
        const grounding = metadata.grounding as Array<{
          page: number;
          box: { l: number; t: number; r: number; b: number; };
        }> || [];
        
        return {
          chunk_id: chunk.chunk_id,
          content: chunk.content || '',
          page: chunk.page,
          bbox: chunk.bbox,
          metadata: chunk.metadata,
          // Add properties expected by DocumentViewer
          text: chunk.content || '',
          chunk_type: (metadata.chunk_type as string) || 'text',
          grounding: grounding
        };
      });

      const initialData: DocData = {
        markdown: document.markdown || '',
        chunks: transformedChunks,
        errors: document.errorMessage ? [{ message: document.errorMessage }] : [],
        num_pages: document.pageCount || 0,
      };

      setDocData(initialData);

      // Check if still processing
      if (document.status === 'processing' || document.status === 'uploading') {
        setIsExtractingContent(true);
        if (!extractionStartTime) {
          setExtractionStartTime(Date.now());
        }
      } else {
        setIsExtractingContent(false);
      }
    }
  }, [document, extractionStartTime]);

  // Timer effect to update elapsed time
  useEffect(() => {
    if (isExtractingContent && extractionStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - extractionStartTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isExtractingContent, extractionStartTime]);

  // Convex handles real-time updates automatically, no polling needed

  const handleDownloadSelection = async () => {
    if (multiSelectedChunkIds.length === 0 || !docData) return;

    const chunksToExport = docData.chunks.filter((chunk) =>
      multiSelectedChunkIds.includes(chunk.chunk_id),
    );

    if (chunksToExport.length === 0) {
      console.warn('No matching chunks found for selected IDs.');
      return;
    }

    const filename = document?.title || 'document';
    const basename =
      filename.substring(0, filename.lastIndexOf('.')) || filename;
    await exportChunks(chunksToExport, exportFormat, basename);
  };

  const handleDownloadAll = async () => {
    if (!docData || !docData.markdown) return;
    
    // Use markdown as default if no format is selected
    const format = exportFormat || 'markdown';

    const filename = document?.title || 'document';
    const basename =
      filename.substring(0, filename.lastIndexOf('.')) || filename;

    try {
      let response: Response;
      let content: string | Blob;
      let mimeType: string;
      let fileExtension: string;

      switch (format) {
        case 'json':
          response = await fetch(`/api/export/all-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: docData.markdown }),
          });
          const jsonData = await response.json();
          content = JSON.stringify(jsonData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;

        case 'text':
          response = await fetch(`/api/export/all-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: docData.markdown }),
          });
          content = await response.text();
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;

        case 'docx':
          response = await fetch(`/api/export/all-docx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: docData.markdown }),
          });
          content = await response.blob();
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          fileExtension = 'docx';
          break;

        case 'csv':
          // For CSV, we need to send chunks instead of markdown
          response = await fetch(`/api/export/csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chunks: docData.chunks }),
          });
          content = await response.text();
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;

        case 'xlsx':
          // For XLSX, we need to send the appropriate data structure
          response = await fetch(`/api/export/all-xlsx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: docData }),
          });
          content = await response.blob();
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;

        case 'markdown':
        default:
          response = await fetch(`/api/export/all-markdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown: docData.markdown }),
          });
          content = await response.text();
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Export failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      // Download the file
      if (content instanceof Blob) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${basename}_complete.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        downloadFile(
          content,
          mimeType,
          `${basename}_complete.${fileExtension}`,
        );
      }
    } catch (err) {
      console.error('Failed to export:', err);
      alert(
        `Error exporting to ${format}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  const handleBack = () => {
    router.push(isDemo ? '/demo' : '/dashboard');
  };

  if (!docData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-lg text-gray-700">Loading document...</p>
        </div>
      </div>
    );
  }

  const numberOfPages = calculateNumberOfPages(docData);

  return (
    <div className="custom-allotment flex h-screen flex-col overflow-hidden text-gray-800 antialiased">
      <DocumentHeader
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onDownloadSelection={handleDownloadSelection}
        onClearSelection={clearSelection}
        onBack={handleBack}
        hasSelection={multiSelectedChunkIds.length > 0}
        onDownloadAll={handleDownloadAll}
        hasMarkdown={!!docData.markdown}
        documentTitle={document?.title}
        selectionCount={multiSelectedChunkIds.length}
      />

      <Allotment defaultSizes={[700, 300]} className="flex-grow" data-tour="resizable-divider">
        <Allotment.Pane minSize={400} preferredSize="70%">
          <div className="h-full overflow-y-auto border-r border-gray-200 bg-white document-viewer-container" data-tour="document-chunks">
            <DocumentViewer
              pages={numberOfPages}
              chunks={(docData.chunks || []).map(chunk => ({
                chunk_id: chunk.chunk_id,
                chunk_type: chunk.chunk_type || 'text',
                grounding: chunk.grounding
              }))}
              activeChunkId={activeChunkId}
              multiSelectedChunkIds={multiSelectedChunkIds}
              onChunkClick={handleChunkClick}
              documentBasename={document?.title || 'document'}
              backendUrl={API_BASE_URL}
              currentExampleStaticBasePath={exampleBasePath || null}
              documentId={documentId}
            />
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={250} preferredSize="30%">
          <div className="h-full overflow-y-auto bg-gray-50" data-tour="parsed-content">
            <ParsedContent
              chunks={docData.chunks || []}
              activeChunkId={activeChunkId}
              multiSelectedChunkIds={multiSelectedChunkIds}
              onChunkClick={handleChunkClick}
              isLoading={isExtractingContent}
              elapsedTime={elapsedTime}
            />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
