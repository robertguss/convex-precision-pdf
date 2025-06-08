import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
    
    // Polar subscription fields
    polarCustomerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("trialing"),
      v.literal("free")
    )),
    subscriptionTier: v.optional(v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro")
    )),
    
    // Credit tracking
    creditsUsed: v.optional(v.number()),
    creditsLimit: v.optional(v.number()),
    creditsResetDate: v.optional(v.number()),
  }).index("byExternalId", ["externalId"]),
  
  documents: defineTable({
    userId: v.id("users"),
    title: v.string(),
    fileId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
    
    // Landing AI API response data
    landingAiResponse: v.optional(v.any()),
    
    // Extracted data from Landing AI response
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
    
    // Page images stored in Convex storage
    pageImages: v.optional(v.array(v.id("_storage"))),
    
    // Metadata
    pageCount: v.optional(v.number()),
    fileSize: v.number(),
    mimeType: v.string(),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStatus", ["status"])
    .index("byCreatedAt", ["createdAt"]),
});
