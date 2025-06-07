// ABOUTME: This file handles document uploads, processing, and management
// ABOUTME: Includes mutations for file storage and actions for Landing AI integration

import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { ConvexError } from "convex/values";

export const generateUploadUrl = mutation(async (ctx) => {
  const user = await ctx.auth.getUserIdentity();
  if (!user) {
    throw new ConvexError("User not authenticated");
  }
  
  return await ctx.storage.generateUploadUrl();
});

export const createDocument = mutation({
  args: {
    title: v.string(),
    storageId: v.id("_storage"),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("User not authenticated");
    }
    
    const users = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", user.subject))
      .collect();
    
    if (users.length === 0) {
      throw new ConvexError("User not found in database");
    }
    
    const userId = users[0]._id;
    
    const documentId = await ctx.db.insert("documents", {
      userId,
      title: args.title,
      fileId: args.storageId,
      status: "uploading",
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return documentId;
  },
});

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
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("User not authenticated");
    }
    
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new ConvexError("Document not found");
    }
    
    await ctx.db.patch(args.documentId, {
      status: args.status,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const storeProcessingResults = mutation({
  args: {
    documentId: v.id("documents"),
    landingAiResponse: v.any(),
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
    marginalia: v.optional(v.array(v.any())),
    pageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new ConvexError("User not authenticated");
    }
    
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new ConvexError("Document not found");
    }
    
    await ctx.db.patch(args.documentId, {
      landingAiResponse: args.landingAiResponse,
      markdown: args.markdown,
      chunks: args.chunks,
      marginalia: args.marginalia,
      pageCount: args.pageCount,
      status: "completed",
      updatedAt: Date.now(),
    });
  },
});

export const processDocumentWithLandingAI = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.runQuery(api.documents.getDocument, {
      documentId: args.documentId,
    });
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    await ctx.runMutation(api.documents.updateDocumentStatus, {
      documentId: args.documentId,
      status: "processing",
    });
    
    try {
      const fileUrl = await ctx.storage.getUrl(document.fileId);
      if (!fileUrl) {
        throw new Error("Could not get file URL");
      }
      
      const fileResponse = await fetch(fileUrl);
      const fileBlob = await fileResponse.blob();
      
      const formData = new FormData();
      formData.append("file", fileBlob, document.title);
      formData.append("include_marginalia", "true");
      formData.append("include_metadata_in_markdown", "true");
      
      const landingAiApiKey = process.env.LANDING_AI_API_KEY;
      if (!landingAiApiKey) {
        throw new Error("Landing AI API key not configured");
      }
      
      const response = await fetch("https://api.va.landing.ai/v1/tools/agentic-document-analysis", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${landingAiApiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Landing AI API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      const markdown = result.markdown || "";
      const marginalia = result.marginalia || [];
      const pageCount = result.page_count || result.pages || null;
      
      // Format chunks to match our schema
      const formattedChunks = (result.chunks || []).map((chunk: any, index: number) => ({
        chunk_id: chunk.id || `chunk_${index}`,
        content: chunk.content || chunk.text || "",
        page: chunk.page || chunk.page_number || 1,
        bbox: chunk.bbox ? {
          x: chunk.bbox.x || 0,
          y: chunk.bbox.y || 0,
          width: chunk.bbox.width || 0,
          height: chunk.bbox.height || 0,
        } : undefined,
        metadata: chunk.metadata || {},
      }));
      
      await ctx.runMutation(api.documents.storeProcessingResults, {
        documentId: args.documentId,
        landingAiResponse: result,
        markdown,
        chunks: formattedChunks,
        marginalia,
        pageCount,
      });
      
    } catch (error) {
      console.error("Error processing document:", error);
      await ctx.runMutation(api.documents.updateDocumentStatus, {
        documentId: args.documentId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const getUserDocuments = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return [];
    }
    
    const users = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", user.subject))
      .collect();
    
    if (users.length === 0) {
      return [];
    }
    
    const userId = users[0]._id;
    
    return await ctx.db
      .query("documents")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});