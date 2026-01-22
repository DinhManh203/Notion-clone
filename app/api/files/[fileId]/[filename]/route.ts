import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string; filename: string }> }
) {
    try {
        const { fileId } = await params;
        const fileIdTyped = fileId as Id<"uploadedFiles">;

        // Lấy thông tin file từ Convex
        const file = await convex.query(api.uploadedFiles.getFileById, {
            fileId: fileIdTyped
        });

        if (!file) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Lấy URL từ Convex storage
        let fileUrl: string;

        if (file.storageId) {
            const storageUrl = await convex.query(api.uploadedFiles.getStorageUrl, {
                storageId: file.storageId
            });

            if (!storageUrl) {
                return new NextResponse("Storage URL not found", { status: 404 });
            }

            fileUrl = storageUrl;
        } else if (file.fileUrl) {
            // File cũ: dùng EdgeStore
            fileUrl = file.fileUrl;
        } else {
            return new NextResponse("File URL not found", { status: 404 });
        }

        const response = await fetch(fileUrl);

        if (!response.ok) {
            return new NextResponse("File not found in storage", { status: 404 });
        }

        const blob = await response.blob();

        // Trả về file với headers phù hợp
        return new NextResponse(blob, {
            headers: {
                "Content-Type": file.fileType || "application/octet-stream",
                "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
