import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentProcessor } from '@/app/dashboard/components/hooks/useDocumentProcessor';
import { renderWithProviders } from '@/tests/utils';

/**
 * Unit tests for useDocumentProcessor hook
 * Tests file upload, example loading, error handling, and state management
 */

// Mock fetch globally
global.fetch = vi.fn();

describe('useDocumentProcessor Hook', () => {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useDocumentProcessor());

      expect(result.current.documentId).toBeNull();
      expect(result.current.documentBasename).toBe('');
      expect(result.current.docData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isExtractingContent).toBe(false);
      expect(result.current.currentExampleStaticBasePath).toBeNull();
    });
  });

  describe('File Upload', () => {
    it('should handle successful progressive file upload', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/upload-document-progressive', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(result.current.documentId).toBe('doc-123');
      expect(result.current.documentBasename).toBe('test');
      expect(result.current.docData).toEqual({
        markdown: '',
        chunks: [],
        errors: [],
        num_pages: 5
      });
      expect(result.current.isExtractingContent).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle file upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'File too large'
        })
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.error).toBe('Failed to upload test.pdf: File too large');
      expect(result.current.documentId).toBeNull();
      expect(result.current.isExtractingContent).toBe(false);
    });

    it('should handle network errors during upload', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.error).toContain('Failed to upload test.pdf');
      expect(result.current.error).toContain('Network error');
    });

    it('should extract basename correctly', async () => {
      const testCases = [
        { filename: 'document.pdf', expected: 'document' },
        { filename: 'file.with.dots.pdf', expected: 'file.with.dots' },
        { filename: 'noextension', expected: 'noextension' },
        { filename: '.hidden.pdf', expected: '.hidden' }
      ];

      for (const { filename, expected } of testCases) {
        const mockFile = new File(['content'], filename, { 
          type: 'application/pdf' 
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            documentId: 'doc-123',
            num_pages: 1
          })
        });

        const { result } = renderHook(() => useDocumentProcessor(), {
          wrapper: TestWrapper
        });

        await act(async () => {
          await result.current.handleFileUpload(mockFile);
        });

        expect(result.current.documentBasename).toBe(expected);

        // Reset for next iteration
        act(() => {
          result.current.resetDocument();
        });
      }
    });
  });

  describe('Example Loading', () => {
    const mockExample = {
      title: 'Sample Document',
      dataUrl: '/examples/sample.json',
      staticImageBasePath: '/examples/sample-images'
    };

    it('should load example data successfully', async () => {
      const mockExampleData = {
        markdown: '# Sample Document',
        chunks: [
          { chunk_id: '1', content: 'Test content', page: 0 }
        ],
        errors: [],
        num_pages: 3
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExampleData
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        result.current.handleExampleSelected(mockExample);
      });

      await waitFor(() => {
        expect(result.current.docData).toEqual(mockExampleData);
      });

      expect(result.current.documentBasename).toBe('sample');
      expect(result.current.currentExampleStaticBasePath).toBe('/examples/sample-images');
      expect(result.current.error).toBeNull();
    });

    it('should handle example loading errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'File not found'
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        result.current.handleExampleSelected(mockExample);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load example: Sample Document');
        expect(result.current.error).toContain('404 Not Found');
      });

      expect(result.current.docData).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        result.current.handleExampleSelected(mockExample);
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Failed to load example');
      });
    });
  });

  describe('Content Extraction Polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should poll for content after progressive upload', async () => {
      // Initial upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      // First poll - still processing
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasExtractedContent: false
        })
      });

      // Second poll - content ready
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasExtractedContent: true
        })
      });

      // Full data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Processed Document',
          chunks: [{ chunk_id: '1', content: 'Content', page: 0 }],
          errors: []
        })
      });

      const { result } = renderHook(() => useDocumentProcessor());

      const mockFile = new File(['content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.isExtractingContent).toBe(true);

      // Advance timer for first poll
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Advance timer for second poll
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.isExtractingContent).toBe(false);
      });

      expect(result.current.docData?.markdown).toBe('# Processed Document');
      expect(result.current.docData?.chunks).toHaveLength(1);
    });

    it('should stop polling after timeout', async () => {
      // Initial upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      // All polls return not ready
      for (let i = 0; i < 65; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            hasExtractedContent: false
          })
        });
      }

      const { result } = renderHook(() => useDocumentProcessor());

      const mockFile = new File(['content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      // Simulate timeout by advancing through all polling attempts
      for (let i = 0; i < 60; i++) {
        await act(async () => {
          vi.advanceTimersByTime(5000);
        });
      }

      await waitFor(() => {
        expect(result.current.isExtractingContent).toBe(false);
      });

      // Should have made ~60 polling attempts
      const pollCalls = mockFetch.mock.calls.filter(call => 
        call[0].includes('/api/documents/') && call[0].includes('/status')
      );
      expect(pollCalls.length).toBeGreaterThanOrEqual(30);
    });

    it('should handle polling errors gracefully', async () => {
      // Initial upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      // Poll fails with error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useDocumentProcessor());

      const mockFile = new File(['content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      // Advance timer for poll
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isExtractingContent).toBe(false);
      });
    });
  });

  describe('State Management', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useDocumentProcessor());

      // Set error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset all state', async () => {
      const { result } = renderHook(() => useDocumentProcessor());

      // Set various states
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      expect(result.current.documentId).toBeTruthy();
      expect(result.current.docData).toBeTruthy();

      // Reset everything
      act(() => {
        result.current.resetDocument();
      });

      expect(result.current.documentId).toBeNull();
      expect(result.current.documentBasename).toBe('');
      expect(result.current.docData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isExtractingContent).toBe(false);
      expect(result.current.currentExampleStaticBasePath).toBeNull();
    });

    it('should clear polling timeout on reset', async () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { result } = renderHook(() => useDocumentProcessor());

      // Start upload with polling
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      // Reset while polling is active
      act(() => {
        result.current.resetDocument();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file upload response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // Empty response
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      // Should handle gracefully with defaults
      expect(result.current.docData).toEqual({
        markdown: '',
        chunks: [],
        errors: [],
        num_pages: 0
      });
    });

    it('should handle 202 status for partial upload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 202,
        json: async () => ({
          error: 'Processing failed',
          processingError: 'Landing AI unavailable'
        })
      });

      const { result } = renderHook(() => useDocumentProcessor());

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      expect(result.current.error).toContain('Document uploaded but processing failed');
      expect(result.current.documentId).toBeNull();
    });

    it('should clear error when starting new upload', async () => {
      const { result } = renderHook(() => useDocumentProcessor());

      // First upload fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'First error' })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test1.pdf'));
      });

      expect(result.current.error).toContain('First error');

      // Second upload succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documentId: 'doc-123',
          num_pages: 5
        })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test2.pdf'));
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear error when loading example', async () => {
      const { result } = renderHook(() => useDocumentProcessor());

      // Set error state
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Upload error' })
      });

      await act(async () => {
        await result.current.handleFileUpload(new File([''], 'test.pdf'));
      });

      expect(result.current.error).toBeTruthy();

      // Load example
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ markdown: '# Example', chunks: [], errors: [] })
      });

      await act(async () => {
        result.current.handleExampleSelected({
          title: 'Example',
          dataUrl: '/example.json'
        } as any);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});