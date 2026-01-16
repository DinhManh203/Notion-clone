"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, FileSpreadsheet, File, Eye, Trash2, Copy, Check, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

export default function FilesPage() {
    const files = useQuery(api.uploadedFiles.getFiles);
    const deleteFile = useMutation(api.uploadedFiles.deleteFile);
    const saveFile = useMutation(api.uploadedFiles.saveFile);
    const generateUploadUrl = useMutation(api.uploadedFiles.generateUploadUrl);

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
        if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
        if (fileType.includes("sheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
        if (fileType.includes("word")) return <FileText className="h-8 w-8 text-blue-600" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString("vi-VN");

    const handleCopy = async (url: string, id: string) => {
        // Chuyển relative URL thành absolute URL
        const absoluteUrl = url.startsWith('/')
            ? `${window.location.origin}${url}`
            : url;

        await navigator.clipboard.writeText(absoluteUrl);
        setCopiedId(id);
        toast.success("Đã sao chép URL!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (fileId: Id<"uploadedFiles">) => {
        setDeletingId(fileId);
        try {
            await deleteFile({ fileId });
            toast.success("Đã xóa tài liệu!");
        } catch (error) {
            toast.error("Lỗi khi xóa tài liệu!");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        // Kiểm tra chỉ cho phép PDF
        const invalidFiles = Array.from(files).filter(file => file.type !== "application/pdf");
        if (invalidFiles.length > 0) {
            toast.error("Chỉ cho phép tải lên tài liệu PDF!");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setIsUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Get upload URL from Convex
                const uploadUrl = await generateUploadUrl();

                // Upload file to Convex storage
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                const { storageId } = await result.json();

                // Save metadata to database
                await saveFile({
                    fileName: file.name,
                    storageId,
                    fileType: file.type,
                    fileSize: file.size,
                });

                toast.success(`Đã tải lên "${file.name}"!`);
            }
        } catch (error) {
            toast.error("Lỗi khi upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);

        const files = e.dataTransfer.files;
        await handleFileUpload(files);
    };

    if (files === undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="border-b p-6 pt-14 md:pt-6 flex flex-col items-end gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-right md:text-left">
                    <h1 className="text-3xl font-bold">Tài liệu đã tải lên</h1>
                    <p className="text-muted-foreground mt-2">Quản lý tất cả tài liệu bạn đã tải lên</p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="sm">
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang tải...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Tải tài liệu
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <FileText className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">Chưa có tài liệu nào</p>
                        <p className="text-sm">Kéo thả hoặc click &quot;Tải tài liệu&quot; để bắt đầu</p>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto p-6">
                        <div className="bg-card rounded-lg border overflow-hidden">
                            <table className="w-full table-fixed">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-sm">Tên tài liệu</th>
                                        <th className="text-left p-4 font-medium text-sm w-32 hidden md:table-cell">Kích thước</th>
                                        <th className="text-left p-4 font-medium text-sm w-48 hidden lg:table-cell">Ngày tải lên</th>
                                        <th className="text-right p-4 font-medium text-sm w-48">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file, index) => (
                                        <tr
                                            key={file._id}
                                            className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                }`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                    <span className="font-medium truncate" title={file.fileName}>
                                                        {file.fileName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">
                                                {formatFileSize(file.fileSize)}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                                                {formatDate(file.uploadedAt)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => file.url && window.open(file.url, "_blank")}
                                                        disabled={!file.url}
                                                        className="h-8 px-2 md:px-3"
                                                        title="Xem tài liệu"
                                                    >
                                                        <Eye className="h-4 w-4 md:mr-1" />
                                                        <span className="hidden md:inline">Xem</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => file.url && handleCopy(file.url, file._id)}
                                                        disabled={!file.url}
                                                        className="h-8 px-2 md:px-3"
                                                        title="Sao chép liên kết"
                                                    >
                                                        {copiedId === file._id ? (
                                                            <>
                                                                <Check className="h-4 w-4 text-green-500 md:mr-1" />
                                                                <span className="hidden md:inline">Đã copy</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4 md:mr-1" />
                                                                <span className="hidden md:inline">Copy</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(file._id)}
                                                        disabled={deletingId === file._id}
                                                        className="h-8 hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Drag overlay */}
            {isDragging && (
                <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none transition-opacity duration-200">
                    <div className="bg-background border-2 border-dashed border-primary rounded-lg p-12 text-center animate-in fade-in zoom-in-95 duration-200">
                        <Upload className="h-10 w-10 mx-auto mb-4 text-primary" />
                        <p className="text-xl font-semibold">Thả tài liệu PDF vào đây</p>
                        <p className="text-muted-foreground mt-2">Chỉ chấp nhận tài liệu PDF</p>
                    </div>
                </div>
            )}
        </div>
    );
}
