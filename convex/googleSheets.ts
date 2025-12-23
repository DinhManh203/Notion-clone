import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cacheSheetData = mutation({
    args: {
        userId: v.string(),
        sheetId: v.string(),
        range: v.string(),
        data: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        // Kiểm tra xem bộ đệm có tồn tại không
        const existing = await ctx.db
            .query("externalData")
            .withIndex("by_source", (q) =>
                q.eq("source", "google_sheet").eq("sourceId", args.sheetId)
            )
            .first();

        if (existing) {
            // Cập nhật bộ đệm hiện có
            await ctx.db.patch(existing._id, {
                content: args.data,
                lastSyncedAt: now,
            });
        } else {
            // Tạo mục bộ đệm mới
            await ctx.db.insert("externalData", {
                userId: args.userId,
                source: "google_sheet",
                sourceId: args.sheetId,
                name: `Sheet: ${args.sheetId}`,
                content: args.data,
                lastSyncedAt: now,
            });
        }
    },
});

// Query để lấy cached data
export const getCachedSheetData = query({
    args: {
        sheetId: v.string(),
    },
    handler: async (ctx, args) => {
        const cacheExpiry = 5 * 60 * 1000;
        const now = Date.now();

        const cached = await ctx.db
            .query("externalData")
            .withIndex("by_source", (q) =>
                q.eq("source", "google_sheet").eq("sourceId", args.sheetId)
            )
            .first();

        if (!cached) {
            return null;
        }

        // Kiểm tra xem bộ nhớ đệm có còn hợp lệ hay không.
        if (now - cached.lastSyncedAt > cacheExpiry) {
            return null;
        }

        return cached.content;
    },
});
