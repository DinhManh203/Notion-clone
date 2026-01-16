"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, FileSpreadsheet, File, Eye, Trash2, Copy, Check, Upload } from "lucide-react";
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
        await navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success("Đã sao chép URL!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (fileId: Id<"uploadedFiles">) => {
        setDeletingId(fileId);
        try {
            await deleteFile({ fileId });
            toast.success("Đã xóa file!");
        } catch (error) {
            toast.error("Lỗi khi xóa file!");
        } finally {
            setDeletingId(null);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
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

                toast.success(`Đã upload "${file.name}"!`);
            }
        } catch (error) {
            toast.error("Lỗi khi upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (files === undefined) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="border-b p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tài liệu đã tải lên</h1>
                    <p className="text-muted-foreground mt-2">Quản lý tất cả file bạn đã tải lên</p>
                </div>
                <div>
                    <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="lg">
                        {isUploading ? (
                            <>
                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                Đang tải tài liệu ...
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

            <div className="flex-1 overflow-y-auto p-6">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <File className="h-16 w-16 mb-4" />
                        <p className="text-lg">Chưa có tài liệu nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                        {files.map((file) => (
                            <div key={file._id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-card">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-shrink-0 mt-1">{getFileIcon(file.fileType)}</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate" title={file.fileName}>{file.fileName}</h3>
                                        <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)}</p>
                                    </div>
                                </div>

                                {file.fileType.startsWith("image/") && file.url && (
                                    <div className="mb-3 rounded overflow-hidden bg-muted">
                                        <img src={file.url} alt={file.fileName} className="w-full h-40 object-cover" />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => file.url && window.open(file.url, "_blank")}
                                        disabled={!file.url}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Xem tài liệu
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => file.url && handleCopy(file.url, file._id)}
                                        disabled={!file.url}
                                    >
                                        {copiedId === file._id ? (
                                            <>
                                                <Check className="h-4 w-4 mr-1 text-green-500" />
                                                Đã sao chép
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-4 w-4 mr-1" />
                                                Sao chép URL
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(file._id)} disabled={deletingId === file._id} className="hover:bg-destructive hover:text-destructive-foreground">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
