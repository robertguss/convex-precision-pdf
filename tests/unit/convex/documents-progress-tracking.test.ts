import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConvexTestingHelper } from '@/tests/utils/convex/setup';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { mockUsers, mockDocuments } from '@/tests/mocks/generators';
import { waitForRealtimeUpdate } from '@/tests/utils/convex/realtime-helpers';

/**
 * Unit tests for progress tracking and real-time updates in document processing
 * Tests status updates, progress calculation, and real-time subscriptions
 */

describe('Document Progress Tracking and Real-time Updates', () => {
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

  describe('Progress State Tracking', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      const mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'uploading'
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should track progress through all processing stages', async () => {
      const stages = [
        { status: 'uploading' as const, progress: 25 },
        { status: 'processing' as const, progress: 50 },
        { status: 'completed' as const, progress: 100 }
      ];

      for (const stage of stages) {
        await testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: stage.status
        });

        const doc = await testHelper.ctx.db.get(documentId);
        expect(doc?.status).toBe(stage.status);
        
        // Calculate progress based on status
        const progress = calculateProgress(doc?.status || 'uploading');
        expect(progress).toBe(stage.progress);
      }
    });

    it('should maintain timestamp progression', async () => {
      const initialDoc = await testHelper.ctx.db.get(documentId);
      const initialTimestamp = initialDoc?.updatedAt || 0;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'processing'
      });

      const processingDoc = await testHelper.ctx.db.get(documentId);
      expect(processingDoc?.updatedAt).toBeGreaterThan(initialTimestamp);

      await new Promise(resolve => setTimeout(resolve, 10));

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 5
      });

      const completedDoc = await testHelper.ctx.db.get(documentId);
      expect(completedDoc?.updatedAt).toBeGreaterThan(processingDoc?.updatedAt || 0);
    });

    it('should track partial completion with chunks', async () => {
      const totalChunks = 10;
      
      // Simulate gradual chunk processing
      for (let i = 1; i <= totalChunks; i++) {
        const chunks = Array.from({ length: i }, (_, idx) => ({
          chunk_id: `chunk-${idx}`,
          content: `Content ${idx}`,
          page: Math.floor(idx / 3),
          metadata: { chunk_type: 'text' }
        }));

        await testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'processing',
          chunks
        });

        const doc = await testHelper.ctx.db.get(documentId);
        expect(doc?.chunks).toHaveLength(i);
        
        // Progress should increase with chunks
        const progress = calculateChunkProgress(i, totalChunks);
        expect(progress).toBe(Math.round((i / totalChunks) * 50) + 50); // 50-100% range
      }
    });
  });

  describe('Real-time Update Subscriptions', () => {
    it('should emit updates when document status changes', async () => {
      // Create document
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          status: 'processing'
        })
      );

      // Set up subscription
      const updates: any[] = [];
      const unsubscribe = testHelper.subscribeToQuery(
        api.documents.getDocument,
        { documentId },
        (data) => updates.push(data)
      );

      // Trigger update
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 3
      });

      // Wait for real-time update
      await waitForRealtimeUpdate(() => 
        updates.some(update => update?.status === 'completed')
      );

      expect(updates).toHaveLength(2); // Initial + update
      expect(updates[1]?.status).toBe('completed');
      expect(updates[1]?.pageCount).toBe(3);

      unsubscribe();
    });

    it('should batch multiple rapid updates', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          status: 'processing'
        })
      );

      const updates: any[] = [];
      const unsubscribe = testHelper.subscribeToQuery(
        api.documents.getDocument,
        { documentId },
        (data) => updates.push(data)
      );

      // Rapid updates
      await Promise.all([
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'processing',
          pageCount: 1
        }),
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'processing',
          pageCount: 2
        }),
        testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'processing',
          pageCount: 3
        })
      ]);

      await waitForRealtimeUpdate(() => updates.length >= 2);

      // Should receive batched updates
      const lastUpdate = updates[updates.length - 1];
      expect(lastUpdate?.pageCount).toBe(3);

      unsubscribe();
    });

    it('should handle subscription to document list updates', async () => {
      const listUpdates: any[] = [];
      const unsubscribe = testHelper.subscribeToQuery(
        api.documents.listDocuments,
        {},
        (data) => listUpdates.push(data)
      );

      // Create new document
      const newDocId = await testHelper.runMutation(api.documents.createDocument, {
        title: 'real-time-test.pdf',
        storageId: 'storage123' as Id<'_storage'>,
        fileSize: 1024,
        mimeType: 'application/pdf'
      });

      await waitForRealtimeUpdate(() => 
        listUpdates.some(update => 
          update?.some((doc: any) => doc._id === newDocId)
        )
      );

      const lastListUpdate = listUpdates[listUpdates.length - 1];
      expect(lastListUpdate).toContainEqual(
        expect.objectContaining({
          _id: newDocId,
          title: 'real-time-test.pdf'
        })
      );

      unsubscribe();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate correct progress for each status', () => {
      const testCases = [
        { status: 'uploading' as const, expectedProgress: 25 },
        { status: 'processing' as const, expectedProgress: 50 },
        { status: 'completed' as const, expectedProgress: 100 },
        { status: 'failed' as const, expectedProgress: 0 }
      ];

      testCases.forEach(({ status, expectedProgress }) => {
        const progress = calculateProgress(status);
        expect(progress).toBe(expectedProgress);
      });
    });

    it('should calculate chunk-based progress', () => {
      const testCases = [
        { processed: 0, total: 10, expected: 50 },   // 0% chunks = 50% total
        { processed: 5, total: 10, expected: 75 },   // 50% chunks = 75% total
        { processed: 10, total: 10, expected: 100 }, // 100% chunks = 100% total
      ];

      testCases.forEach(({ processed, total, expected }) => {
        const progress = calculateChunkProgress(processed, total);
        expect(progress).toBe(expected);
      });
    });

    it('should handle edge cases in progress calculation', () => {
      expect(calculateChunkProgress(0, 0)).toBe(50); // No chunks
      expect(calculateChunkProgress(10, 5)).toBe(100); // More processed than total
      expect(calculateChunkProgress(-1, 10)).toBe(50); // Negative processed
    });
  });

  describe('Page Processing Progress', () => {
    let documentId: Id<'documents'>;

    beforeEach(async () => {
      const mockDocument = mockDocuments.generateMockDocument({
        userId: mockUser._id,
        status: 'processing',
        pageCount: 10
      });
      documentId = await testHelper.ctx.db.insert('documents', mockDocument);
    });

    it('should track page image generation progress', async () => {
      const totalPages = 10;
      
      for (let i = 1; i <= totalPages; i++) {
        const pageImages = Array.from({ length: i }, (_, idx) => 
          `img-${idx}` as Id<'_storage'>
        );

        await testHelper.runMutation(api.documents.updateDocumentStatus, {
          documentId,
          status: 'processing',
          pageImages
        });

        const doc = await testHelper.ctx.db.get(documentId);
        expect(doc?.pageImages).toHaveLength(i);
        
        // Calculate page processing progress
        const progress = calculatePageProgress(i, totalPages);
        expect(progress).toBeGreaterThanOrEqual(25); // Min 25% for processing status
        expect(progress).toBeLessThanOrEqual(75); // Max 75% until chunks are processed
      }
    });

    it('should complete progress when all components are ready', async () => {
      // Add all components
      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageImages: Array.from({ length: 10 }, (_, i) => `img-${i}` as Id<'_storage'>),
        chunks: Array.from({ length: 20 }, (_, i) => ({
          chunk_id: `chunk-${i}`,
          content: `Content ${i}`,
          page: Math.floor(i / 2),
          metadata: {}
        })),
        markdown: '# Complete Document',
        pageCount: 10
      });

      const doc = await testHelper.ctx.db.get(documentId);
      expect(doc?.status).toBe('completed');
      
      const progress = calculateDocumentProgress(doc);
      expect(progress).toBe(100);
    });
  });

  describe('Long-running Process Tracking', () => {
    it('should handle timeout scenarios', async () => {
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          status: 'processing',
          createdAt: Date.now() - 10 * 60 * 1000 // 10 minutes ago
        })
      );

      const doc = await testHelper.ctx.db.get(documentId);
      const isTimedOut = isProcessingTimedOut(doc);
      
      expect(isTimedOut).toBe(true);
    });

    it('should track processing duration', async () => {
      const startTime = Date.now();
      const documentId = await testHelper.ctx.db.insert('documents', 
        mockDocuments.generateMockDocument({
          userId: mockUser._id,
          status: 'processing',
          createdAt: startTime
        })
      );

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      await testHelper.runMutation(api.documents.updateDocumentStatus, {
        documentId,
        status: 'completed',
        pageCount: 5
      });

      const doc = await testHelper.ctx.db.get(documentId);
      const processingDuration = (doc?.updatedAt || 0) - startTime;
      
      expect(processingDuration).toBeGreaterThanOrEqual(100);
      expect(processingDuration).toBeLessThan(200);
    });
  });
});

// Helper functions for progress calculation
function calculateProgress(status: 'uploading' | 'processing' | 'completed' | 'failed'): number {
  switch (status) {
    case 'uploading': return 25;
    case 'processing': return 50;
    case 'completed': return 100;
    case 'failed': return 0;
    default: return 0;
  }
}

function calculateChunkProgress(processed: number, total: number): number {
  if (total === 0) return 50;
  const chunkProgress = Math.max(0, Math.min(processed / total, 1));
  return Math.round(50 + chunkProgress * 50); // 50-100% range
}

function calculatePageProgress(processed: number, total: number): number {
  if (total === 0) return 25;
  const pageProgress = Math.max(0, Math.min(processed / total, 1));
  return Math.round(25 + pageProgress * 50); // 25-75% range
}

function calculateDocumentProgress(doc: any): number {
  if (!doc) return 0;
  if (doc.status === 'completed') return 100;
  if (doc.status === 'failed') return 0;
  
  let progress = calculateProgress(doc.status);
  
  // Add chunk progress if available
  if (doc.chunks && doc.pageCount) {
    const expectedChunks = doc.pageCount * 2; // Estimate
    progress = Math.max(progress, calculateChunkProgress(doc.chunks.length, expectedChunks));
  }
  
  return progress;
}

function isProcessingTimedOut(doc: any, timeoutMs: number = 5 * 60 * 1000): boolean {
  if (!doc || doc.status !== 'processing') return false;
  return Date.now() - doc.createdAt > timeoutMs;
}