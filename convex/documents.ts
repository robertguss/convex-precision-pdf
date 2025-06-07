import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow, getCurrentUser } from "./users";

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