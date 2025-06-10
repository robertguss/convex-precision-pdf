// ABOUTME: Custom hook for handling document upload and processing logic
// ABOUTME: Manages file uploads, example loading, and document status polling
import { useState, useCallback } from 'react';

import { DocData, Example } from '../types';
// import { useDocumentRealtime } from './useDocumentRealtime';
// import { Doc } from '@/convex/_generated/dataModel';

// type DocumentRow = Doc<"documents">;

interface UseDocumentProcessorReturn {
  documentId: string | null;
  documentBasename: string;
  docData: DocData | null;
  error: string | null;
  isExtractingContent: boolean;
  currentExampleStaticBasePath: string | null;
  handleFileUpload: (file: File) => Promise<void>;
  handleExampleSelected: (example: Example) => void;
  clearError: () => void;
  resetDocument: () => void;
}

export function useDocumentProcessor(): UseDocumentProcessorReturn {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentBasename, setDocumentBasename] = useState('');
  const [docData, setDocData] = useState<DocData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [currentExampleStaticBasePath, setCurrentExampleStaticBasePath] =
    useState<string | null>(null);
  const [useProgressiveUpload] = useState(true);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const clearError = () => setError(null);

  const resetDocument = () => {
    setDocData(null);
    setDocumentId(null);
    setDocumentBasename('');
    setCurrentExampleStaticBasePath(null);
    setError(null);
    setIsExtractingContent(false);
    // Clear any pending polling timeouts
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }
  };

  const handleFileProcessed = (data: DocData, basename: string) => {
    setDocData(data);
    setDocumentBasename(basename);
    setError(null);
  };

  // Handle realtime document updates
  // TODO: Implement Convex realtime subscription
  // const handleRealtimeDocumentUpdate = useCallback((document: DocumentRow) => {
  //   console.log('[Hook] Received realtime document update');
  //   
  //   if (document.markdown || document.chunks) {
  //     // Content is ready
  //     const chunks = document.chunks || [];
  //     const errors = document.errorMessage 
  //       ? [{ message: document.errorMessage }] 
  //       : [];
  //       
  //     setDocData((prevData) => ({
  //       ...prevData!,
  //       markdown: document.markdown || '',
  //       chunks,
  //       errors,
  //       num_pages: document.pageCount || 0,
  //     }));
  //     setIsExtractingContent(false);
  //     
  //     // Clear any pending polling since realtime update succeeded
  //     if (pollingTimeoutId) {
  //       clearTimeout(pollingTimeoutId);
  //       setPollingTimeoutId(null);
  //     }
  //   }
  // }, [pollingTimeoutId]);

  // Use realtime subscription when extracting content
  // TODO: Implement Convex realtime subscription
  // useDocumentRealtime({
  //   documentId: isExtractingContent ? documentId : null,
  //   onDocumentUpdate: handleRealtimeDocumentUpdate,
  //   enabled: isExtractingContent,
  // });

  // Polling function to check document status (fallback for realtime)
  const pollDocumentStatus = useCallback(async (docId: string) => {
    const maxAttempts = 60; // 60 attempts = 2 minutes max
    let attempts = 0;

    console.log('[Polling] Starting fallback polling for document:', docId);

    const checkStatus = async () => {
      // Don't continue if we're no longer extracting (realtime update may have completed)
      if (!isExtractingContent) {
        console.log('[Polling] Stopping - extraction no longer in progress');
        return;
      }

      try {
        // Use minimal mode for polling to reduce data transfer
        const response = await fetch(`/api/documents/${docId}/status?minimal=true`);
        const result = await response.json();

        if (response.ok && result.hasExtractedContent) {
          console.log('[Polling] Content ready, fetching full data');
          // Content is ready - now fetch the full data
          const fullResponse = await fetch(`/api/documents/${docId}/status`);
          const fullResult = await fullResponse.json();
          
          if (fullResponse.ok) {
            setDocData((prevData) => ({
              ...prevData!,
              markdown: fullResult.markdown,
              chunks: fullResult.chunks,
              errors: fullResult.errors,
            }));
          }
          setIsExtractingContent(false);
          setPollingTimeoutId(null);
          return; // Stop polling
        }

        // Continue polling if not ready
        attempts++;
        if (attempts < maxAttempts && isExtractingContent) {
          // Increase polling interval based on attempts for better production performance
          const delay = attempts < 10 ? 2000 : attempts < 30 ? 3000 : 5000;
          console.log(`[Polling] Attempt ${attempts}, next check in ${delay}ms`);
          const timeoutId = setTimeout(checkStatus, delay);
          setPollingTimeoutId(timeoutId);
        } else {
          setIsExtractingContent(false);
          setPollingTimeoutId(null);
          console.warn('[Polling] Timeout - content extraction taking too long');
        }
      } catch (error) {
        console.error('[Polling] Error checking document status:', error);
        setIsExtractingContent(false);
        setPollingTimeoutId(null);
      }
    };

    // Start with a small delay to give realtime a chance to connect
    const initialTimeoutId = setTimeout(checkStatus, 1000);
    setPollingTimeoutId(initialTimeoutId);
  }, [isExtractingContent]);

  const handleExampleSelected = (example: Example) => {
    setError(null);
    setCurrentExampleStaticBasePath(example.staticImageBasePath || null);

    fetch(example.dataUrl)
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to load example ${example.title} from ${example.dataUrl}: ${res.status} ${res.statusText} - ${errorText}`,
          );
        }
        return res.json();
      })
      .then((data) => {
        const basename =
          example.dataUrl.split('/').pop()?.replace('.json', '') || '';
        handleFileProcessed(data, basename);
      })
      .catch((err) => {
        console.error(err);
        setError(
          `Failed to load example: ${example.title}. ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      });
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setCurrentExampleStaticBasePath(null);

    const basename =
      file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (useProgressiveUpload) {
        // Progressive upload - show images immediately
        const response = await fetch('/api/upload-document-progressive', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload document');
        }

        // Show document view with images immediately
        setDocumentId(result.documentId);
        setDocumentBasename(basename);
        setDocData({
          markdown: '',
          chunks: [],
          errors: [],
          num_pages: result.num_pages || 0,
        });
        setIsExtractingContent(true);

        // Start polling for content
        pollDocumentStatus(result.documentId);
      } else {
        // Traditional upload - wait for everything
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 202) {
            console.warn(
              'Document uploaded but processing failed:',
              result.processingError,
            );
            setError(
              result.error ||
                'Document uploaded but processing failed. Please try again later.',
            );
            return;
          }
          throw new Error(result.error || 'Failed to upload document');
        }

        setDocumentId(result.documentId);
        handleFileProcessed(
          {
            markdown: result.markdown || '',
            chunks: result.chunks || [],
            errors: result.errors || [],
            num_pages: result.pageCount || 0,
          },
          basename,
        );
      }
    } catch (err) {
      console.error('Error during file upload:', err);
      setError(
        `Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  return {
    documentId,
    documentBasename,
    docData,
    error,
    isExtractingContent,
    currentExampleStaticBasePath,
    handleFileUpload,
    handleExampleSelected,
    clearError,
    resetDocument,
  };
}
