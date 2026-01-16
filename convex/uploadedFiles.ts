import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const saveFile = mutation({
    args: {
        fileName: v.string(),
        storageId: v.id("_storage"),
        fileType: v.string(),
        fileSize: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Chưa được xác thực");

        const fileId = await ctx.db.insert("uploadedFiles", {
            userId: identity.subject,
            fileName: args.fileName,
            storageId: args.storageId,
            fileType: args.fileType,
            fileSize: args.fileSize,
            uploadedAt: Date.now(),
        });

        return fileId;
    },
});

export const getFileById = query({
    args: { fileId: v.id("uploadedFiles") },
    handler: async (ctx, args) => {
        // Không cần kiểm tra auth - được gọi từ HTTP endpoint công khai
        return await ctx.db.get(args.fileId);
    },
});

export const getStorageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const getFiles = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const files = await ctx.db
            .query("uploadedFiles")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        // Lấy URL cho tất cả file
        return files.map((file) => {
            let url: string | null = null;

            // File mới: dùng API route với tên file trong URL
            if (file.storageId) {
                url = `/api/files/${file._id}/${encodeURIComponent(file.fileName)}`;
            }
            // File cũ: dùng EdgeStore URL
            else if (file.fileUrl) {
                url = file.fileUrl;
            }

            return {
                ...file,
                url,
            };
        });
    },
});

export const deleteFile = mutation({
    args: { fileId: v.id("uploadedFiles") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Chưa được xác thực");

        const file = await ctx.db.get(args.fileId);
        if (!file) throw new Error("Không tìm thấy file");
        if (file.userId !== identity.subject) throw new Error("Unauthorized");

        // Xóa từ Convex storage (chỉ file mới)
        if (file.storageId) {
            await ctx.storage.delete(file.storageId);
        }
        // File cũ (EdgeStore) - không thể xóa từ EdgeStore ở đây

        // Xóa từ database
        await ctx.db.delete(args.fileId);
        return args.fileId;
    },
});
