import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getCurrentUserOrThrow, getCurrentUser } from "./users";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Creates an example document from pre-processed data.
 * Used to showcase the app's capabilities without requiring file uploads.
 */
export const createExampleDocument = mutation({
  args: {
    title: v.string(),
    markdown: v.string(),
    chunks: v.array(v.object({
      text: v.string(),
      grounding: v.array(v.object({
        box: v.object({
          l: v.number(),
          t: v.number(),
          r: v.number(),
          b: v.number(),
        }),
        page: v.number(),
      })),
      chunk_type: v.string(),
      chunk_id: v.string(),
    })),
    pageCount: v.number(),
    staticBasePath: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Transform chunks to match the schema format
    const transformedChunks = args.chunks.map(chunk => ({
      chunk_id: chunk.chunk_id,
      content: chunk.text,
      page: chunk.grounding[0]?.page || 0,
      bbox: chunk.grounding[0]?.box ? {
        x: chunk.grounding[0].box.l,
        y: chunk.grounding[0].box.t,
        width: chunk.grounding[0].box.r - chunk.grounding[0].box.l,
        height: chunk.grounding[0].box.b - chunk.grounding[0].box.t,
      } : undefined,
      metadata: {
        chunk_type: chunk.chunk_type,
        grounding: chunk.grounding,
      },
    }));
    
    const documentId = await ctx.db.insert("documents", {
      userId: user._id,
      title: args.title,
      // Example documents don't have actual files in storage
      fileId: undefined,
      status: "completed",
      markdown: args.markdown,
      chunks: transformedChunks,
      pageCount: args.pageCount,
      // Example documents use static images, not stored in Convex
      pageImages: undefined,
      fileSize: 0, // Example documents don't have actual file size
      mimeType: "application/pdf",
      landingAiResponse: {
        staticBasePath: args.staticBasePath,
        isExample: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return documentId;
  },
});

/**
 * Get all documents for the current user
 */
export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    // Return empty array if user is not authenticated
    if (!user) {
      return [];
    }
    
    const documents = await ctx.db
      .query("documents")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    
    return documents;
  },
});

/**
 * Get a single document by ID
 */
export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Return null if user is not authenticated
    if (!user) {
      return null;
    }
    
    const document = await ctx.db.get(args.documentId);
    
    if (!document) {
      return null;
    }
    
    // Ensure the user owns the document
    if (document.userId !== user._id) {
      return null;
    }
    
    return document;
  },
});

/**
 * Generate a pre-signed URL for uploading files to Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    
    // Generate and return the upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a new document entry in the database
 */
export const createDocument = mutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    const documentId = await ctx.db.insert("documents", {
      userId: user._id,
      title: args.title,
      fileId: args.storageId,
      status: "processing",
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return documentId;
  },
});

/**
 * Generate a placeholder image blob for development
 */
async function generatePlaceholderImage(pageNumber: number): Promise<Blob> {
  // Create a simple placeholder image with canvas
  const svg = `
    <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1000" fill="#f0f0f0"/>
      <text x="400" y="500" font-family="Arial" font-size="48" text-anchor="middle" fill="#666">
        Page ${pageNumber + 1}
      </text>
      <text x="400" y="560" font-family="Arial" font-size="24" text-anchor="middle" fill="#999">
        Placeholder Image
      </text>
    </svg>
  `;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return blob;
}

/**
 * Process a document with Landing AI
 */
export const processDocumentWithLandingAI = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Get the document
    const document = await ctx.runQuery(api.documents.getDocument, {
      documentId: args.documentId,
    });
    
    if (!document || !document.fileId) {
      throw new Error("Document not found or has no file");
    }
    
    try {
      // Get the file URL from storage
      const fileUrl = await ctx.storage.getUrl(document.fileId);
      
      if (!fileUrl) {
        throw new Error("Failed to get file URL from storage");
      }
      
      // TODO: Implement Landing AI integration
      // For now, we'll just mark the document as completed with placeholder data
      
      // Don't generate placeholder images if the document already has pageImages
      // (they were generated during the upload process)
      const existingPageImages = document.pageImages;
      const existingPageCount = document.pageCount;
      
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        documentId: args.documentId,
        status: "completed",
        markdown: "# Document Processing\n\nThis is a placeholder. Landing AI integration is not yet implemented.",
        chunks: [{
          chunk_id: "chunk-1",
          content: "This is placeholder content for the document chunks.",
          page: 0,
          metadata: {},
        }],
        // Preserve existing page count and images if they exist
        ...(existingPageCount && { pageCount: existingPageCount }),
        ...(existingPageImages && { pageImages: existingPageImages }),
      });
      
      console.log("Document processing completed (placeholder)");
    } catch (error) {
      console.error("Error processing document:", error);
      
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        documentId: args.documentId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      
      throw error;
    }
  },
});

/**
 * Update document status and processing results
 */
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    markdown: v.optional(v.string()),
    chunks: v.optional(v.array(v.object({
      chunk_id: v.string(),
      content: v.string(),
      page: v.number(),
      bbox: v.optional(v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      })),
      metadata: v.any(),
    }))),
    pageCount: v.optional(v.number()),
    pageImages: v.optional(v.array(v.id("_storage"))),
    landingAiResponse: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Verify the user owns the document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== user._id) {
      throw new Error("Document not found or access denied");
    }
    
    // Update the document
    await ctx.db.patch(args.documentId, {
      status: args.status,
      ...(args.errorMessage !== undefined && { errorMessage: args.errorMessage }),
      ...(args.markdown !== undefined && { markdown: args.markdown }),
      ...(args.chunks !== undefined && { chunks: args.chunks }),
      ...(args.pageCount !== undefined && { pageCount: args.pageCount }),
      ...(args.pageImages !== undefined && { pageImages: args.pageImages }),
      ...(args.landingAiResponse !== undefined && { landingAiResponse: args.landingAiResponse }),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get page image URL for a specific page of a document
 */
export const getPageImageUrl = query({
  args: {
    documentId: v.id("documents"),
    pageIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (!user) {
      return null;
    }
    
    const document = await ctx.db.get(args.documentId);
    
    if (!document || document.userId !== user._id) {
      return null;
    }
    
    // For example documents, return the static path
    if (document.landingAiResponse?.isExample && document.landingAiResponse?.staticBasePath) {
      return `${document.landingAiResponse.staticBasePath}/page_${args.pageIndex}.png`;
    }
    
    // For uploaded documents, return the storage URL
    if (document.pageImages && document.pageImages[args.pageIndex]) {
      const url = await ctx.storage.getUrl(document.pageImages[args.pageIndex]);
      return url;
    }
    
    return null;
  },
});