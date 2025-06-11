/**
 * Hook for handling file downloads in a React-idiomatic way
 * Manages download state and provides a trigger function
 */

import { useState, useCallback } from 'react';

interface DownloadOptions {
  filename: string;
  content: string | Blob;
  mimeType?: string;
}

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(({ filename, content, mimeType }: DownloadOptions) => {
    setIsDownloading(true);

    try {
      // Create blob if content is string
      const blob = content instanceof Blob 
        ? content 
        : new Blob([content], { type: mimeType || 'text/plain' });

      // Create object URL
      const url = URL.createObjectURL(blob);

      // Create and trigger download using a temporary anchor
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, 100);

    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
      throw error;
    }
  }, []);

  return { download, isDownloading };
}

/**
 * Alternative approach using a hidden anchor element that persists
 * This is more React-like but requires a ref in the component
 */
export function useDownloadWithRef() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const triggerDownload = useCallback(({ filename, content, mimeType }: DownloadOptions) => {
    // Clean up previous URL if exists
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    // Create blob and URL
    const blob = content instanceof Blob 
      ? content 
      : new Blob([content], { type: mimeType || 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    
    setDownloadUrl(url);
    setDownloadFilename(filename);

    // Cleanup after download
    setTimeout(() => {
      URL.revokeObjectURL(url);
      setDownloadUrl(null);
      setDownloadFilename('');
    }, 1000);
  }, [downloadUrl]);

  return { downloadUrl, downloadFilename, triggerDownload };
}