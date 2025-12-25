"use client";


import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Search, Trash, Undo, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";

export const TrashBox = () => {
    const router = useRouter();
    const params = useParams();
    const documents = useQuery(api.documents.getTrash);
    const restore = useMutation(api.documents.restore);
    const remove = useMutation(api.documents.remove);
    const removeAll = useMutation(api.documents.removeAll);

    const [search, setSearch] = useState("");

    const filteredDocuments = documents?.filter((document) => {
        return document.title.toLowerCase().includes(search.toLowerCase());
    });

    const onClick = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    const onRestore = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        documentId: Id<"documents">,
    ) => {
        event.stopPropagation();
        const promise = restore({ id: documentId });

        toast.promise(promise, {
            loading: "Đang khôi phục ghi chú...",
            success: "Ghi chú đã được khôi phục!",
            error: "Lỗi khi khôi phục."
        });
    };

    const onRemove = (
        documentId: Id<"documents">,
    ) => {
        const promise = remove({ id: documentId });

        toast.promise(promise, {
            loading: "Đang xóa ghi chú...",
            success: "Ghi chú đã được xóa!",
            error: "Lỗi khi xóa."
        });

        if (params.documentId === documentId) {
            router.push("/documents");
        }
    };

    const onRemoveAll = () => {
        const promise = removeAll();

        toast.promise(promise, {
            loading: "Đang xóa tất cả ghi chú...",
            success: (result) => `Đã xóa ${result.count} ghi chú!`,
            error: "Lỗi khi xóa tất cả."
        });

        if (params.documentId) {
            router.push("/documents");
        }
    };

    if (documents === undefined) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="text-sm">
            <div className="flex items-center gap-x-1  p-2">
                <Search className="h-4 w-4" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
                    placeholder="Lọc theo tiêu đề trang..."
                />
            </div>

            {documents.length > 0 && (
                <div className="px-2 pb-2">
                    <ConfirmModal onConfirm={onRemoveAll}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa tất cả ({documents.length} ghi chú)
                        </Button>
                    </ConfirmModal>
                </div>
            )}

            <div className="mt-2 px-1 pb-1">
                <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
                    Không tìm thấy thư mục.
                </p>
                {filteredDocuments?.map((document) => (
                    <div
                        key={document._id}
                        role="button"
                        onClick={() => onClick(document._id)}
                        className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
                    >
                        <span className="truncate pl-2">
                            {document.title}
                        </span>
                        <div className="flex items-center">
                            <div
                                onClick={(e) => onRestore(e, document._id)}
                                role="button"
                                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                            >
                                <Undo className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <ConfirmModal onConfirm={() => onRemove(document._id)}>
                                <div
                                    role="button"
                                    className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    <Trash className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </ConfirmModal>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};