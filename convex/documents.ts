import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const archive = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const recursiveArchive = async (documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) => (
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                ))
                .collect();

            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isArchived: true,
                });

                await recursiveArchive(child._id);
            }
        }

        const document = await ctx.db.patch(args.id, {
            isArchived: true,
        });

        recursiveArchive(args.id);

        return document;
    }
})

export const getSidebar = query({
    args: {
        parentDocument: v.optional(v.id("documents"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const allDocuments = await ctx.db
            .query("documents")
            .withIndex("by_user_parent", (q) =>
                q
                    .eq("userId", userId)
                    .eq("parentDocument", args.parentDocument)
            )
            .filter((q) =>
                q.eq(q.field("isArchived"), false)
            )
            .collect();

        const documents = allDocuments.filter(doc => doc.isPinned !== true);

        // Sort by order field, then by creation time (desc)
        documents.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return b._creationTime - a._creationTime;
        });

        return documents;
    },
});

export const get = query({
    handler: async (ctx) => {
        const indentity = await ctx.auth.getUserIdentity();

        if (!indentity) {
            throw new Error("Not authenticated");
        }

        const documents = await ctx.db.query("documents").collect();

        return documents;
    }
});

export const create = mutation({
    args: {
        title: v.string(),
        parentDocument: v.optional(v.id("documents"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // Nếu tạo dưới một tài liệu đã ghim, tự động ghim tài liệu con
        let isPinned = false;

        if (args.parentDocument) {
            const parent = await ctx.db.get(args.parentDocument);
            if (parent?.isPinned) {
                isPinned = true;
            }
        }

        // Tính order cho document mới (lấy max order + 1)
        const siblings = await ctx.db
            .query("documents")
            .withIndex("by_user_parent", (q) =>
                q
                    .eq("userId", userId)
                    .eq("parentDocument", args.parentDocument)
            )
            .filter((q) => q.eq(q.field("isPinned"), isPinned))
            .collect();

        const maxOrder = siblings.reduce((max, doc) => {
            return doc.order !== undefined && doc.order > max ? doc.order : max;
        }, 0);

        const document = await ctx.db.insert("documents", {
            title: args.title,
            parentDocument: args.parentDocument,
            userId,
            isArchived: false,
            isPublished: false,
            isPinned,
            order: maxOrder + 1,
        });

        return document;
    }
});

export const getTrash = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.eq(q.field("isArchived"), true),
            )
            .order("desc")
            .collect();

        return documents;
    }
});

export const restore = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const recursiveRestore = async (documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) => (
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                ))
                .collect();

            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isArchived: false,
                });

                await recursiveRestore(child._id);
            }
        }

        const options: Partial<Doc<"documents">> = {
            isArchived: false,
        };

        if (existingDocument.parentDocument) {
            const parent = await ctx.db.get(existingDocument.parentDocument);
            if (parent?.isArchived) {
                options.parentDocument = undefined;
            }
        }

        const document = await ctx.db.patch(args.id, options);

        recursiveRestore(args.id);

        return document;
    }
});

export const remove = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.delete(args.id);

        return document;
    }
});

export const removeAll = mutation({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // Get all archived documents for this user
        const archivedDocuments = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isArchived"), true))
            .collect();

        // Delete all archived documents
        const deletePromises = archivedDocuments.map((doc) =>
            ctx.db.delete(doc._id)
        );

        await Promise.all(deletePromises);

        return { count: archivedDocuments.length };
    }
});

export const getSearch = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const allDocuments = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.eq(q.field("isArchived"), false)
            )
            .order("desc")
            .collect();

        // Filter out pinned documents (isPinned !== true)
        const documents = allDocuments.filter(doc => doc.isPinned !== true);

        return documents;
    }
});

export const getById = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        const document = await ctx.db.get(args.documentId);

        if (!document) {
            throw new Error("Not found");
        }

        if (document.isPublished && !document.isArchived) {
            return document;
        }

        if (!identity) {
            throw new Error("Not Authenticated");
        }

        const userId = identity.subject;

        if (document.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return document;
    }
});

export const update = mutation({
    args: {
        id: v.id("documents"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        icon: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        allowEditing: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...rest } = args;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject;

        const isOwner = !!userId && existingDocument.userId === userId;

        const isPublicEditable =
            existingDocument.isPublished &&
            !existingDocument.isArchived &&
            !!existingDocument.allowEditing;

        let patch: Partial<Doc<"documents">> = {};

        if (isOwner) {
            patch = {
                ...rest,
            };
        }
        else if (isPublicEditable) {
            if (rest.content !== undefined) {
                patch.content = rest.content;
            } else {
                return existingDocument;
            }
        }
        else {
            if (!identity) {
                throw new Error("Not authenticated");
            }
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.patch(args.id, patch);

        return document;
    },
});

export const removeIcon = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.patch(args.id, {
            icon: undefined
        });

        return document;
    }
});

export const removeCoverImage = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const document = await ctx.db.patch(args.id, {
            coverImage: undefined,
        });

        return document;
    }
});

export const pin = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const recursivePin = async (documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) =>
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                )
                .collect();

            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isPinned: true,
                });

                await recursivePin(child._id);
            }
        };

        const document = await ctx.db.patch(args.id, {
            isPinned: true,
        });

        await recursivePin(args.id);

        return document;
    }
});

export const unpin = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const recursiveUnpin = async (documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) =>
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                )
                .collect();

            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isPinned: false,
                });

                await recursiveUnpin(child._id);
            }
        };

        const document = await ctx.db.patch(args.id, {
            isPinned: false,
        });

        await recursiveUnpin(args.id);

        return document;
    }
});

export const getPinned = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("isArchived"), false),
                    q.eq(q.field("isPinned"), true)
                )
            )
            .collect();

        // Sort by order field, then by creation time (desc)
        documents.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return b._creationTime - a._creationTime;
        });

        return documents;
    }
})

export const reorder = mutation({
    args: {
        id: v.id("documents"),
        newOrder: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new Error("Not found");
        }

        if (document.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // Update the order of the document
        await ctx.db.patch(args.id, {
            order: args.newOrder,
        });

        return document;
    }
})