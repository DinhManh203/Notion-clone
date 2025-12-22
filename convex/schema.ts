import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // DOCUMENTS
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    isPinned: v.optional(v.boolean()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isPublished: v.boolean(),
    allowEditing: v.optional(v.boolean()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_parent", ["userId", "parentDocument"]),

  // CHAT SESSION
  chatSessions: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    documentId: v.optional(v.id("documents")),
    systemPrompt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_document", ["userId", "documentId"]),

  // CHAT MESSAGES
  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_time", ["sessionId", "createdAt"]),

  // EXTERNAL DATA (Google Sheet)
  externalData: defineTable({
    userId: v.string(),
    source: v.union(
      v.literal("google_sheet"),
      v.literal("airtable"),
      v.literal("other")
    ),
    sourceId: v.string(),
    name: v.optional(v.string()),
    content: v.string(),
    lastSyncedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["source", "sourceId"]),
});
