/**
 * Convex testing helper class for unit tests
 * Provides utilities for testing Convex functions with mocked context
 */

import { vi } from 'vitest';
import { Id } from '@/convex/_generated/dataModel';

interface MockAuth {
  getUserIdentity: () => Promise<any>;
}

interface MockStorage {
  generateUploadUrl: () => Promise<string>;
  getUrl: (storageId: Id<'_storage'>) => Promise<string | null>;
}

interface MockDb {
  get: (id: Id<any>) => Promise<any>;
  insert: (table: string, document: any) => Promise<Id<any>>;
  patch: (id: Id<any>, updates: any) => Promise<void>;
  query: (table: string) => any;
  replace: (id: Id<any>, document: any) => Promise<void>;
  delete: (id: Id<any>) => Promise<void>;
}

interface MockContext {
  auth: MockAuth;
  storage: MockStorage;
  db: MockDb;
  runQuery: (fn: any, args: any) => Promise<any>;
  runMutation: (fn: any, args: any) => Promise<any>;
  runAction: (fn: any, args: any) => Promise<any>;
}

export class ConvexTestingHelper {
  public ctx: MockContext;
  private mockData: Map<string, any> = new Map();
  private mockUser: any = null;
  private queryResults: Map<string, any> = new Map();
  private subscriptions: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.ctx = this.createMockContext();
  }

  async setup() {
    // Initialize any necessary test data
    this.mockData.clear();
    this.queryResults.clear();
    this.subscriptions.clear();
  }

  async cleanup() {
    // Clean up test data
    this.mockData.clear();
    this.queryResults.clear();
    this.subscriptions.clear();
    this.mockUser = null;
    vi.clearAllMocks();
  }

  setMockAuth(user: any) {
    this.mockUser = user;
  }

  async runQuery(fn: any, args: any) {
    // Simple mock implementation
    const fnName = fn.name || fn.toString();
    
    if (fnName.includes('listDocuments')) {
      if (!this.mockUser) return [];
      
      const documents = Array.from(this.mockData.values())
        .filter(doc => doc._table === 'documents' && doc.userId === this.mockUser._id)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      return documents;
    }
    
    if (fnName.includes('getDocument')) {
      if (!this.mockUser) return null;
      
      const doc = this.mockData.get(args.documentId);
      if (!doc || doc.userId !== this.mockUser._id) return null;
      
      return doc;
    }
    
    // Default: check if we have a pre-set result
    const key = `${fnName}-${JSON.stringify(args)}`;
    return this.queryResults.get(key) || null;
  }

  async runMutation(fn: any, args: any) {
    const fnName = fn.name || fn.toString();
    
    if (fnName.includes('createDocument')) {
      if (!this.mockUser) throw new Error('User not authenticated');
      
      const documentId = `doc_${Date.now()}` as Id<'documents'>;
      const document = {
        _id: documentId,
        _table: 'documents',
        userId: this.mockUser._id,
        title: args.title,
        fileId: args.storageId,
        status: 'processing',
        fileSize: args.fileSize,
        mimeType: args.mimeType,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      this.mockData.set(documentId, document);
      return documentId;
    }
    
    if (fnName.includes('updateDocumentStatus')) {
      if (!this.mockUser) throw new Error('User not authenticated');
      
      const doc = this.mockData.get(args.documentId);
      if (!doc || doc.userId !== this.mockUser._id) {
        throw new Error('Document not found or access denied');
      }
      
      const updates = {
        status: args.status,
        ...(args.errorMessage !== undefined && { errorMessage: args.errorMessage }),
        ...(args.markdown !== undefined && { markdown: args.markdown }),
        ...(args.chunks !== undefined && { chunks: args.chunks }),
        ...(args.pageCount !== undefined && { pageCount: args.pageCount }),
        ...(args.pageImages !== undefined && { pageImages: args.pageImages }),
        ...(args.landingAiResponse !== undefined && { landingAiResponse: args.landingAiResponse }),
        updatedAt: Date.now()
      };
      
      Object.assign(doc, updates);
      this.mockData.set(args.documentId, doc);
      
      // Notify subscribers
      this.notifySubscribers(`documents-${args.documentId}`, doc);
    }
    
    if (fnName.includes('generateUploadUrl')) {
      if (!this.mockUser) throw new Error('User not authenticated');
      return 'https://storage.convex.dev/upload/test-upload-url';
    }
    
    return null;
  }

  async runAction(fn: any, args: any) {
    const fnName = fn.name || fn.toString();
    
    if (fnName.includes('processDocumentWithLandingAI')) {
      const doc = this.mockData.get(args.documentId);
      if (!doc || !doc.fileId) {
        throw new Error('Document not found or has no file');
      }
      
      // Simulate processing
      return { success: true };
    }
    
    return null;
  }

  subscribeToQuery(fn: any, args: any, callback: (data: any) => void) {
    const key = `${fn.name || fn.toString()}-${JSON.stringify(args)}`;
    this.subscriptions.set(key, callback);
    
    // Send initial data
    this.runQuery(fn, args).then(data => callback(data));
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(key);
    };
  }

  private notifySubscribers(key: string, data: any) {
    this.subscriptions.forEach((callback, subKey) => {
      if (subKey.includes(key)) {
        callback(data);
      }
    });
  }

  private createMockContext(): MockContext {
    return {
      auth: {
        getUserIdentity: async () => this.mockUser
      },
      storage: {
        generateUploadUrl: vi.fn().mockResolvedValue('https://storage.convex.dev/upload/test'),
        getUrl: vi.fn().mockImplementation(async (storageId: Id<'_storage'>) => {
          return `https://storage.convex.dev/files/${storageId}`;
        })
      },
      db: {
        get: async (id: Id<any>) => {
          return this.mockData.get(id);
        },
        insert: async (table: string, document: any) => {
          const id = `${table}_${Date.now()}` as Id<any>;
          const docWithMeta = {
            ...document,
            _id: id,
            _table: table
          };
          this.mockData.set(id, docWithMeta);
          return id;
        },
        patch: async (id: Id<any>, updates: any) => {
          const existing = this.mockData.get(id);
          if (!existing) throw new Error('Document not found');
          
          Object.assign(existing, updates);
          this.mockData.set(id, existing);
        },
        query: (table: string) => {
          const self = this;
          return {
            withIndex: (indexName: string, filterFn?: any) => ({
              order: (order: string) => ({
                collect: async () => {
                  const docs = Array.from(self.mockData.values())
                    .filter(doc => doc._table === table);
                  
                  if (filterFn) {
                    // Simple filter implementation
                    const filtered = docs.filter(doc => {
                      // This is a simplified version - real implementation would parse the filter
                      return true;
                    });
                    return order === 'desc' 
                      ? filtered.sort((a, b) => b.createdAt - a.createdAt)
                      : filtered.sort((a, b) => a.createdAt - b.createdAt);
                  }
                  
                  return docs;
                },
                first: async () => {
                  const docs = await this.collect();
                  return docs[0] || null;
                }
              }),
              first: async () => {
                const docs = Array.from(self.mockData.values())
                  .filter(doc => doc._table === table);
                return docs[0] || null;
              }
            }),
            collect: async () => {
              return Array.from(self.mockData.values())
                .filter(doc => doc._table === table);
            }
          };
        },
        replace: vi.fn(),
        delete: vi.fn()
      },
      runQuery: vi.fn().mockImplementation((fn, args) => this.runQuery(fn, args)),
      runMutation: vi.fn().mockImplementation((fn, args) => this.runMutation(fn, args)),
      runAction: vi.fn().mockImplementation((fn, args) => this.runAction(fn, args))
    };
  }
}