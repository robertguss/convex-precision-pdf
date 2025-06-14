import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDownload, useDownloadWithRef } from '@/app/dashboard/components/hooks/useDownload';

/**
 * Unit tests for useDownload and useDownloadWithRef hooks
 * Tests file download functionality including blob creation and cleanup
 */

describe('useDownload Hook', () => {
  let originalCreateElement: typeof document.createElement;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: any;

  beforeEach(() => {
    // Mock DOM methods
    clickSpy = vi.fn();
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: clickSpy,
    };

    // Store original createElement
    originalCreateElement = document.createElement.bind(document);

    // Mock createElement
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') {
        return mockLink;
      }
      return originalCreateElement(tag);
    });

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    
    // Mock URL methods
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore createElement
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Download Functionality', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDownload());

      expect(result.current.isDownloading).toBe(false);
      expect(typeof result.current.download).toBe('function');
    });

    it('should download string content as text file', async () => {
      const { result } = renderHook(() => useDownload());

      const downloadOptions = {
        filename: 'test.txt',
        content: 'Hello, World!',
        mimeType: 'text/plain',
      };

      act(() => {
        result.current.download(downloadOptions);
      });

      // Verify download state
      expect(result.current.isDownloading).toBe(true);

      // Verify blob creation
      expect(URL.createObjectURL).toHaveBeenCalledWith(
        new Blob(['Hello, World!'], { type: 'text/plain' })
      );

      // Verify link creation and click
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();

      // Advance timers to trigger cleanup
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Verify cleanup
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.isDownloading).toBe(false);
    });

    it('should download blob content directly', async () => {
      const { result } = renderHook(() => useDownload());

      const blobContent = new Blob(['Binary data'], { type: 'application/octet-stream' });
      const downloadOptions = {
        filename: 'data.bin',
        content: blobContent,
      };

      act(() => {
        result.current.download(downloadOptions);
      });

      // Verify blob was used directly
      expect(URL.createObjectURL).toHaveBeenCalledWith(blobContent);

      // Verify download triggered
      expect(clickSpy).toHaveBeenCalled();

      // Cleanup
      act(() => {
        vi.advanceTimersByTime(100);
      });
    });

    it('should use default mime type when not provided', async () => {
      const { result } = renderHook(() => useDownload());

      const downloadOptions = {
        filename: 'test.txt',
        content: 'Plain text content',
      };

      act(() => {
        result.current.download(downloadOptions);
      });

      // Verify default mime type
      expect(URL.createObjectURL).toHaveBeenCalledWith(
        new Blob(['Plain text content'], { type: 'text/plain' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during download', () => {
      const { result } = renderHook(() => useDownload());

      // Mock createObjectURL to throw error
      createObjectURLSpy.mockImplementation(() => {
        throw new Error('Failed to create URL');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const downloadOptions = {
        filename: 'test.txt',
        content: 'Content',
      };

      // Should throw error
      expect(() => {
        act(() => {
          result.current.download(downloadOptions);
        });
      }).toThrow('Failed to create URL');

      // Should reset downloading state
      expect(result.current.isDownloading).toBe(false);

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith('Download failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors in cleanup phase', () => {
      const { result } = renderHook(() => useDownload());

      // Mock removeChild to throw error
      removeChildSpy.mockImplementation(() => {
        throw new Error('Failed to remove child');
      });

      const downloadOptions = {
        filename: 'test.txt',
        content: 'Content',
      };

      // Download should work initially
      act(() => {
        result.current.download(downloadOptions);
      });

      expect(result.current.isDownloading).toBe(true);

      // Advance timers - cleanup error should be handled gracefully
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // State should still be reset despite error
      expect(result.current.isDownloading).toBe(false);
    });
  });

  describe('Link Element Properties', () => {
    it('should set correct link properties', () => {
      const { result } = renderHook(() => useDownload());

      const downloadOptions = {
        filename: 'document.pdf',
        content: 'PDF content',
        mimeType: 'application/pdf',
      };

      let localMockLink: any;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          localMockLink = {
            href: '',
            download: '',
            style: { display: '' },
            click: clickSpy,
          };
          return localMockLink;
        }
        return originalCreateElement(tag);
      });

      act(() => {
        result.current.download(downloadOptions);
      });

      // Verify link properties
      expect(localMockLink.href).toBe('blob:mock-url');
      expect(localMockLink.download).toBe('document.pdf');
      expect(localMockLink.style.display).toBe('none');
    });
  });

  describe('Multiple Downloads', () => {
    it('should handle multiple sequential downloads', async () => {
      const { result } = renderHook(() => useDownload());

      // First download
      act(() => {
        result.current.download({
          filename: 'file1.txt',
          content: 'Content 1',
        });
      });

      expect(result.current.isDownloading).toBe(true);

      // Complete first download
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isDownloading).toBe(false);

      // Second download
      act(() => {
        result.current.download({
          filename: 'file2.txt',
          content: 'Content 2',
        });
      });

      expect(result.current.isDownloading).toBe(true);

      // Complete second download
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isDownloading).toBe(false);

      // Verify both downloads occurred
      expect(clickSpy).toHaveBeenCalledTimes(2);
      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const { result } = renderHook(() => useDownload());

      act(() => {
        result.current.download({
          filename: 'empty.txt',
          content: '',
        });
      });

      expect(URL.createObjectURL).toHaveBeenCalledWith(
        new Blob([''], { type: 'text/plain' })
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });
    });

    it('should handle special characters in filename', () => {
      const { result } = renderHook(() => useDownload());

      let localMockLink: any;
      document.createElement = vi.fn((tag: string) => {
        if (tag === 'a') {
          localMockLink = {
            href: '',
            download: '',
            style: { display: '' },
            click: clickSpy,
          };
          return localMockLink;
        }
        return originalCreateElement(tag);
      });

      const specialFilename = 'file with spaces & special#chars.txt';

      act(() => {
        result.current.download({
          filename: specialFilename,
          content: 'Content',
        });
      });

      expect(localMockLink.download).toBe(specialFilename);
    });

    it('should handle large content', () => {
      const { result } = renderHook(() => useDownload());

      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB

      act(() => {
        result.current.download({
          filename: 'large.txt',
          content: largeContent,
        });
      });

      expect(URL.createObjectURL).toHaveBeenCalledWith(
        new Blob([largeContent], { type: 'text/plain' })
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });
    });
  });
});

describe('useDownloadWithRef Hook', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      expect(result.current.downloadUrl).toBeNull();
      expect(result.current.downloadFilename).toBe('');
      expect(typeof result.current.triggerDownload).toBe('function');
    });

    it('should set download URL and filename', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: 'test.txt',
          content: 'Hello, World!',
        });
      });

      expect(result.current.downloadUrl).toBe('blob:mock-url');
      expect(result.current.downloadFilename).toBe('test.txt');
    });

    it('should cleanup after timeout', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: 'test.txt',
          content: 'Content',
        });
      });

      expect(result.current.downloadUrl).toBe('blob:mock-url');

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.downloadUrl).toBeNull();
      expect(result.current.downloadFilename).toBe('');
    });
  });

  describe('URL Management', () => {
    it('should revoke previous URL before creating new one', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      // First download
      createObjectURLSpy.mockReturnValueOnce('blob:url-1');
      
      act(() => {
        result.current.triggerDownload({
          filename: 'file1.txt',
          content: 'Content 1',
        });
      });

      expect(result.current.downloadUrl).toBe('blob:url-1');

      // Second download before cleanup
      createObjectURLSpy.mockReturnValueOnce('blob:url-2');
      
      act(() => {
        result.current.triggerDownload({
          filename: 'file2.txt',
          content: 'Content 2',
        });
      });

      // Should revoke first URL
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url-1');
      expect(result.current.downloadUrl).toBe('blob:url-2');
    });
  });

  describe('Content Handling', () => {
    it('should handle string content', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: 'text.txt',
          content: 'Text content',
          mimeType: 'text/plain',
        });
      });

      expect(createObjectURLSpy).toHaveBeenCalledWith(
        new Blob(['Text content'], { type: 'text/plain' })
      );
    });

    it('should handle blob content', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      const blob = new Blob(['Binary'], { type: 'application/octet-stream' });

      act(() => {
        result.current.triggerDownload({
          filename: 'data.bin',
          content: blob,
        });
      });

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    });

    it('should use default mime type', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: 'file.txt',
          content: 'Content',
        });
      });

      expect(createObjectURLSpy).toHaveBeenCalledWith(
        new Blob(['Content'], { type: 'text/plain' })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive downloads', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      // Create multiple URLs
      createObjectURLSpy
        .mockReturnValueOnce('blob:url-1')
        .mockReturnValueOnce('blob:url-2')
        .mockReturnValueOnce('blob:url-3');

      // Trigger downloads rapidly
      act(() => {
        result.current.triggerDownload({ filename: 'file1.txt', content: 'Content 1' });
      });

      act(() => {
        result.current.triggerDownload({ filename: 'file2.txt', content: 'Content 2' });
      });

      act(() => {
        result.current.triggerDownload({ filename: 'file3.txt', content: 'Content 3' });
      });

      // Should have revoked previous URLs
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url-1');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url-2');

      // Current URL should be the latest
      expect(result.current.downloadUrl).toBe('blob:url-3');
      expect(result.current.downloadFilename).toBe('file3.txt');
    });

    it('should handle empty filename', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: '',
          content: 'Content',
        });
      });

      expect(result.current.downloadFilename).toBe('');
      expect(result.current.downloadUrl).toBe('blob:mock-url');
    });

    it('should handle null content gracefully', () => {
      const { result } = renderHook(() => useDownloadWithRef());

      act(() => {
        result.current.triggerDownload({
          filename: 'null.txt',
          content: null as any, // Testing edge case
        });
      });

      // Should create blob with null content
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });
});