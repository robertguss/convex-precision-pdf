import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConvexTestingHelper } from '@/tests/utils/convex/setup';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { mockUsers, mockDocuments, mockSubscriptions } from '@/tests/mocks/generators';

/**
 * Unit tests for document processing functions in Convex
 * Tests state transitions, creation, updates, and queries
 */

describe('Convex Document Functions', () => {
  let testHelper: ConvexTestingHelper;
  let mockUser: any;
  let mockDocument: any;

  beforeEach(async () => {
    testHelper = new ConvexTestingHelper();
    await testHelper.setup();
    
    // Create a mock authenticated user
    mockUser = mockUsers.generateMockUser();
    testHelper.setMockAuth(mockUser);
    
    // Set up mock subscription for the user
    const mockSubscription = mockSubscriptions.generateMockSubscription({
      userId: mockUser._id,
      status: 'active',
      plan: 'business',
      pageLimit: 1000,
      pagesUsed: 0
    });
    
    // Mock the subscription check
    vi.spyOn(testHelper.ctx, 'runQuery').mockImplementation(async (fn, args) => {
      if (fn === api.subscriptions.checkPageLimit) {
        return { allowed: true, reason: null };
      }
      return null;
    });
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('createDocument', () => {
    it('should create a document with initial processing state', async () => {
      const storageId = 'storage123' as Id<'_storage'>;
      const args = {
        title: 'test-document.pdf',
        storageId,
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        estimatedPageCount: 5
      };

      const documentId = await testHelper.runMutation(api.documents.createDocument, args);

      expect(documentId).toBeDefined();
      
      // Verify the document was created with correct initial state
      const document = await testHelper.ctx.db.get(documentId);
      expect(document).toMatchObject({
        userId: mockUser._id,
        title: args.title,
        fileId: storageId,
        status: 'processing',
        fileSize: args.fileSize,
        mimeType: args.mimeType
      });
      expect(document?.createdAt).toBeDefined();
      expect(document?.updatedAt).toBeDefined();
    });

    it('should reject document creation when user lacks pages', async () => {
      // Mock insufficient pages
      vi.spyOn(testHelper.ctx, 'runQuery').mockImplementation(async (fn, args) => {
        if (fn === api.subscriptions.checkPageLimit) {
          return { 
            allowed: false, 
            reason: 'Insufficient pages remaining. You have 0 pages left.'
          };
        }
        return null;
      });

      const storageId = 'storage123' as Id<'_storage'>;
      const args = {
        title: 'test-document.pdf',
        storageId,
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf',
        estimatedPageCount: 10
      };

      await expect(
        testHelper.runMutation(api.documents.createDocument, args)
      ).rejects.toThrow('Insufficient pages remaining');
    });

    it('should use default page count of 1 when not provided', async () => {
      const storageId = 'storage123' as Id<'_storage'>;
      const args = {
        title: 'test-image.png',
        storageId,
        fileSize: 500 * 1024,
        mimeType: 'image/png'
        // estimatedPageCount not provided
      };

      const documentId = await testHelper.runMutation(api.documents.createDocument, args);

      expect(documentId).toBeDefined();
      
      // Verify checkPageLimit was called with 1 page
      expect(testHelper.ctx.runQuery).toHaveBeenCalledWith(
        api.subscriptions.checkPageLimit,
        { requiredPages: 1 }
      );
    });
  });

  describe('updateDocumentStatus', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      // Create a test document
      mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'processing'
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should transition from processing to completed', async () => {
      const chunks = [
        {
          chunk_id: 'chunk-1',
          content: 'Test content',
          page: 0,
          metadata: { chunk_type: 'text' }
        }
      ];

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        markdown: '# Test Document',
        chunks,
        pageCount: 5
      });

      const updatedDoc = await testHelper.ctx.db.get(documentId);
      expect(updatedDoc).toMatchObject({
        status: 'completed',
        markdown: '# Test Document',
        chunks,
        pageCount: 5
      });
      expect(updatedDoc?.updatedAt).toBeGreaterThan(mockDocument.updatedAt);
    });

    it('should transition from processing to failed with error', async () => {
      const errorMessage = 'Failed to process document: Invalid format';

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'failed',
        errorMessage
      });

      const updatedDoc = await testHelper.ctx.db.get(documentId);
      expect(updatedDoc).toMatchObject({
        status: 'failed',
        errorMessage
      });
    });

    it('should record page usage when transitioning to completed', async () => {
      // Mock the recordPageUsage mutation
      vi.spyOn(testHelper.ctx, 'runMutation').mockImplementation(async (fn, args) => {
        if (fn === api.internal.subscriptions.recordPageUsage) {
          // Simulate recording page usage
          return { success: true };
        }
        return null;
      });

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 10
      });

      // Verify page usage was recorded
      expect(testHelper.ctx.runMutation).toHaveBeenCalledWith(
        api.internal.subscriptions.recordPageUsage,
        expect.objectContaining({
          userId: mockUser._id,
          documentId,
          pageCount: 10
        })
      );
    });

    it('should not record page usage if already recorded', async () => {
      // Add existing page usage record
      await testHelper.ctx.db.insert('pageUsage', {
        userId: mockUser._id,
        documentId,
        pageCount: 10,
        createdAt: Date.now()
      });

      const runMutationSpy = vi.spyOn(testHelper.ctx, 'runMutation');

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 10
      });

      // Verify page usage was NOT recorded again
      expect(runMutationSpy).not.toHaveBeenCalledWith(
        api.internal.subscriptions.recordPageUsage,
        expect.any(Object)
      );
    });

    it('should handle optional fields correctly', async () => {
      const pageImages = ['img1', 'img2'] as Id<'_storage'>[];
      const landingAiResponse = { processed: true, data: 'test' };

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'processing',
        pageImages,
        landingAiResponse
      });

      const updatedDoc = await testHelper.ctx.db.get(documentId);
      expect(updatedDoc).toMatchObject({
        status: 'processing',
        pageImages,
        landingAiResponse
      });
    });

    it('should reject updates from unauthorized users', async () => {
      // Create document for different user
      const otherUser = mockUsers.generateMockUser();
      const otherDoc = mockDocuments.generateMockDocument({
        userId: otherUser._id
      });
      const otherDocId = await testHelper.ctx.db.insert('documents', otherDoc);

      await expect(
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId: otherDocId,
          status: 'completed'
        })
      ).rejects.toThrow('Document not found or access denied');
    });
  });

  describe('listDocuments', () => {
    beforeEach(async () => {
      // Create multiple documents for the user
      const docs = [
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          title: 'Document 1',
          createdAt: Date.now() - 3000
        }),
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          title: 'Document 2',
          createdAt: Date.now() - 2000
        }),
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          title: 'Document 3',
          createdAt: Date.now() - 1000
        })
      ];

      for (const doc of docs) {
        await testHelper.ctx.db.insert('documents', doc);
      }

      // Create a document for another user
      const otherUser = mockUsers.generateMockUser();
      await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: otherUser._id,
          title: 'Other User Document'
        })
      );
    });

    it('should return documents for authenticated user in descending order', async () => {
      const documents = await testHelper.runQuery(api.documents.listDocuments, {});

      expect(documents).toHaveLength(3);
      expect(documents[0].title).toBe('Document 3'); // Most recent
      expect(documents[1].title).toBe('Document 2');
      expect(documents[2].title).toBe('Document 1'); // Oldest
      
      // Verify all documents belong to the current user
      documents.forEach(doc => {
        expect(doc.userId).toBe(mockUser._id);
      });
    });

    it('should return empty array for unauthenticated user', async () => {
      testHelper.setMockAuth(null);

      const documents = await testHelper.runQuery(api.documents.listDocuments, {});

      expect(documents).toEqual([]);
    });
  });

  describe('getDocument', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        title: 'Test Document'
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should return document for authorized user', async () => {
      const document = await testHelper.runQuery(api.documents.getDocument, {
        documentId
      });

      expect(document).toMatchObject({
        _id: documentId,
        userId: mockUser._id,
        title: 'Test Document'
      });
    });

    it('should return null for non-existent document', async () => {
      const fakeId = 'nonexistent' as Id<'documents'>;

      const document = await testHelper.runQuery(api.documents.getDocument, {
        documentId: fakeId
      });

      expect(document).toBeNull();
    });

    it('should return null for unauthorized user', async () => {
      // Create document for different user
      const otherUser = mockUsers.generateMockUser();
      const otherDoc = mockDocuments.generateMockDocument({
        userId: otherUser._id
      });
      const otherDocId = await testHelper.ctx.db.insert('documents', otherDoc);

      const document = await testHelper.runQuery(api.documents.getDocument, {
        documentId: otherDocId
      });

      expect(document).toBeNull();
    });

    it('should return null for unauthenticated user', async () => {
      testHelper.setMockAuth(null);

      const document = await testHelper.runQuery(api.documents.getDocument, {
        documentId
      });

      expect(document).toBeNull();
    });
  });

  describe('Document State Transitions', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      // Create a document in initial state
      const storageId = 'storage123' as Id<'_storage'>;
      documentId = await testHelper.runMutation(api.documents.createDocument, {
        title: 'state-test.pdf',
        storageId,
        fileSize: 1024 * 1024,
        mimeType: 'application/pdf'
      });
    });

    it('should follow valid state transition: processing -> completed', async () => {
      // Initial state should be processing
      let doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('processing');

      // Transition to completed
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 5
      });

      doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
    });

    it('should follow valid state transition: processing -> failed', async () => {
      // Initial state should be processing
      let doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('processing');

      // Transition to failed
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'failed',
        errorMessage: 'Processing error'
      });

      doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('failed');
      expect(doc?.errorMessage).toBe('Processing error');
    });

    it('should allow uploading -> processing transition', async () => {
      // Update to uploading first
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'uploading'
      });

      let doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('uploading');

      // Then to processing
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'processing'
      });

      doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('processing');
    });

    it('should preserve data through state transitions', async () => {
      const chunks = [
        {
          chunk_id: 'chunk-1',
          content: 'Content 1',
          page: 0,
          metadata: { chunk_type: 'text' }
        }
      ];

      // Add data while transitioning
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        markdown: '# Document',
        chunks,
        pageCount: 3
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc).toMatchObject({
        status: 'completed',
        markdown: '# Document',
        chunks,
        pageCount: 3
      });

      // Verify original data is preserved
      expect(doc?.title).toBe('state-test.pdf');
      expect(doc?.fileSize).toBe(1024 * 1024);
    });
  });
});