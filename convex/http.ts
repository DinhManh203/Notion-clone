import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Phục vụ file với tên file tùy chỉnh
// Định dạng URL: /files/{fileId}/{filename}
http.route({
    path: "/files/:fileId/:filename",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        // Trích xuất fileId từ đường dẫn URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const fileId = pathParts[2]; // /files/{fileId}/{filename}

        console.log("HTTP Request:", { url: request.url, fileId, pathParts });

        if (!fileId) {
            return new Response("File ID required", { status: 400 });
        }

        try {
            // Lấy file từ database
            const file = await ctx.runQuery(api.uploadedFiles.getFileById, {
                fileId: fileId as Id<"uploadedFiles">,
            });

            console.log("File from DB:", file);

            if (!file) {
                return new Response("File not found in database", { status: 404 });
            }

            if (!file.storageId) {
                return new Response("File has no storage ID (old EdgeStore file)", { status: 404 });
            }

            // Lấy file blob từ storage
            const blob = await ctx.storage.get(file.storageId);

            console.log("Blob from storage:", blob ? "Found" : "Not found");

            if (!blob) {
                return new Response("File not found in storage", { status: 404 });
            }

            // Trả về file với headers phù hợp
            return new Response(blob, {
                headers: {
                    "Content-Type": file.fileType || "application/octet-stream",
                    "Content-Disposition": `inline; filename="${file.fileName}"`,
                    "Cache-Control": "public, max-age=31536000",
                },
            });
        } catch (error) {
            console.error("Error serving file:", error);
            return new Response(`Internal server error: ${error}`, { status: 500 });
        }
    }),
});

export default http;
