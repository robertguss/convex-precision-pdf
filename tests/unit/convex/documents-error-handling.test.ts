import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConvexTestingHelper } from '@/tests/utils/convex/setup';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { mockUsers, mockDocuments } from '@/tests/mocks/generators';

/**
 * Unit tests for error handling and recovery in document processing
 * Tests various failure scenarios and recovery mechanisms
 */

describe('Document Processing Error Handling', () => {
  let testHelper: ConvexTestingHelper;
  let mockUser: any;

  beforeEach(async () => {
    testHelper = new ConvexTestingHelper();
    await testHelper.setup();
    
    mockUser = mockUsers.generateMockUser();
    testHelper.setMockAuth(mockUser);
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('processDocumentWithLandingAI Error Handling', () => {
    let documentId: Id<'documents'>;
    let mockFetch: any;

    beforeEach(async () => {
      // Create a test document
      const mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'processing',
        fileId: 'storage123' as Id<'_storage'>
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);

      // Mock fetch globally
      mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Mock storage URL
      vi.spyOn(testHelper.ctx.storage, 'getUrl').mockResolvedValue('https://storage.convex.dev/file123');

      // Mock environment variables
      process.env.FAST_API_SECRET_KEY = 'test-api-key';
      process.env.FAST_API_URL = 'http://localhost:8000';
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete process.env.FAST_API_SECRET_KEY;
      delete process.env.FAST_API_URL;
    });

    it('should handle missing document gracefully', async () => {
      const fakeDocId = 'nonexistent' as Id<'documents'>;

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId: fakeDocId
        })
      ).rejects.toThrow('Document not found or has no file');
    });

    it('should handle storage URL retrieval failure', async () => {
      vi.spyOn(testHelper.ctx.storage, 'getUrl').mockResolvedValue(null);

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId
        })
      ).rejects.toThrow('Failed to get file URL from storage');

      // Verify document was marked as failed
      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('failed');
      expect(doc?.errorMessage).toContain('Failed to get file URL from storage');
    });

    it('should handle file fetch failure from storage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId
        })
      ).rejects.toThrow('Failed to fetch file from storage: 404');

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('failed');
    });

    it('should handle missing API key with placeholder data', async () => {
      delete process.env.FAST_API_SECRET_KEY;

      // Mock successful file fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['pdf content'])
      });

      // Should not throw, but use placeholder data
      await testHelper.runAction(api.documents.processDocumentWithLandingAI, {
        documentId
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
      expect(doc?.markdown).toContain('Landing AI integration requires FAST_API_SECRET_KEY');
      expect(doc?.chunks).toHaveLength(1);
      expect(doc?.chunks?.[0].content).toContain('placeholder content');
    });

    it('should handle FastAPI service connection failure', async () => {
      // Mock successful file fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['pdf content'])
      });

      // Mock FastAPI failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId
        })
      ).rejects.toThrow('Network error');

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('failed');
      expect(doc?.errorMessage).toBe('Network error');
    });

    it('should handle FastAPI error response', async () => {
      // Mock successful file fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['pdf content'])
      });

      // Mock FastAPI error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid PDF format'
      });

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId
        })
      ).rejects.toThrow('FastAPI document processing failed: 400 Invalid PDF format');

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('failed');
    });

    it('should handle malformed Landing AI response', async () => {
      // Mock successful file fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['pdf content'])
      });

      // Mock successful but malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }) // Missing expected fields
      });

      // Should complete but with empty data
      await testHelper.runAction(api.documents.processDocumentWithLandingAI, {
        documentId
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
      expect(doc?.chunks).toEqual([]);
      expect(doc?.markdown).toBe('');
    });

    it('should preserve existing page images on error', async () => {
      // Add existing page images to document
      const pageImages = ['img1', 'img2'] as Id<'_storage'>[];
      await testHelper.ctx.db.patch(documentId, {
        pageImages,
        pageCount: 2
      });

      // Mock file fetch failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        testHelper.runAction(api.documents.processDocumentWithLandingAI, {
          documentId
        })
      ).rejects.toThrow();

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.pageImages).toEqual(pageImages);
      expect(doc?.pageCount).toBe(2);
    });
  });

  describe('File Upload Error Scenarios', () => {
    it('should handle storage upload failure', async () => {
      // Mock storage upload URL generation failure
      vi.spyOn(testHelper.ctx.storage, 'generateUploadUrl').mockRejectedValue(
        new Error('Storage service unavailable')
      );

      await expect(
        testHelper.runMutation(api.documents.generateUploadUrl, {})
      ).rejects.toThrow('Storage service unavailable');
    });

    it('should handle document creation with invalid storage ID', async () => {
      // Mock subscription check
      vi.spyOn(testHelper.ctx, 'runQuery').mockResolvedValue({
        allowed: true,
        reason: null
      });

      const invalidStorageId = '' as Id<'_storage'>;

      await expect(
        testHelper.runMutation(api.documents.createDocument, {
          title: 'test.pdf',
          storageId: invalidStorageId,
          fileSize: 1024,
          mimeType: 'application/pdf'
        })
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Update Handling', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      const mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'processing'
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should handle concurrent status updates gracefully', async () => {
      // Simulate concurrent updates
      const update1 = testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 5
      });

      const update2 = testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'failed',
        errorMessage: 'Concurrent error'
      });

      // Both should complete without throwing
      await Promise.all([update1, update2]);

      // Final state should be one of the updates
      const doc = await testHelper.ctx.db.get(documentId);
      expect(['completed', 'failed']).toContain(doc?.status);
    });
  });

  describe('Recovery Mechanisms', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      const mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'failed',
        errorMessage: 'Initial processing failed'
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should allow retry after failure', async () => {
      // Reset to processing state
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'processing',
        errorMessage: undefined
      });

      let doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('processing');
      expect(doc?.errorMessage).toBeUndefined();

      // Complete successfully
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 3
      });

      doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
    });

    it('should preserve partial data during recovery', async () => {
      // Add partial data
      await testHelper.ctx.db.patch(documentId, {
        pageImages: ['img1'] as Id<'_storage'>[],
        pageCount: 1
      });

      // Retry with new data
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        markdown: '# Recovered Document',
        chunks: [{
          chunk_id: 'chunk-1',
          content: 'Recovered content',
          page: 0,
          metadata: {}
        }]
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
      expect(doc?.pageImages).toEqual(['img1']);
      expect(doc?.markdown).toBe('# Recovered Document');
    });
  });

  describe('Input Validation Errors', () => {
    it('should handle invalid document ID format', async () => {
      const invalidId = 'not-a-valid-id' as Id<'documents'>;

      const result = await testHelper.runQuery(api.documents.getDocument, {
        documentId: invalidId
      });

      expect(result).toBeNull();
    });

    it('should handle missing required fields in updates', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id
        })
      );

      // Status is required
      await expect(
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          // @ts-expect-error - Testing missing required field
          status: undefined
        })
      ).rejects.toThrow();
    });

    it('should validate chunk structure', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id
        })
      );

      const invalidChunks = [
        {
          // Missing required fields
          content: 'Test'
        }
      ];

      await expect(
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'completed',
          // @ts-expect-error - Testing invalid chunk structure
          chunks: invalidChunks
        })
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chunk arrays', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id
        })
      );

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        chunks: [],
        markdown: ''
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
      expect(doc?.chunks).toEqual([]);
    });

    it('should handle very long error messages', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id
        })
      );

      const longError = 'Error: ' + 'x'.repeat(10000);

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'failed',
        errorMessage: longError
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.errorMessage).toBe(longError);
    });

    it('should handle special characters in document titles', async () => {
      const specialTitles = [
        'test@#$%.pdf',
        'test 中文.pdf',
        'test😀emoji.pdf',
        'test\ntab.pdf'
      ];

      for (const title of specialTitles) {
        const docId = await testHelper.runMutation(api.documents.createDocument, {
          title,
          storageId: 'storage123' as Id<'_storage'>,
          fileSize: 1024,
          mimeType: 'application/pdf'
        });

        const doc = await testHelper.ctx.db.get(docId);
        expect(doc?.title).toBe(title);
      }
    });
  });
});