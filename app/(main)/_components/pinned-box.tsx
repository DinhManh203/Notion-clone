"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Search, PinOff, FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export const PinnedBox = () => {
    const router = useRouter();
    const params = useParams();
    const documents = useQuery(api.documents.getPinned);
    const unpin = useMutation(api.documents.unpin);

    const [search, setSearch] = useState("");

    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        const keyword = search.trim().toLowerCase();
        if (!keyword) return documents;
        return documents.filter((document) =>
            document.title.toLowerCase().includes(keyword)
        );
    }, [documents, search]);

    const onClick = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    const onUnpin = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        documentId: Id<"documents">,
    ) => {
        event.stopPropagation();
        const promise = unpin({ id: documentId });

        toast.promise(promise, {
            loading: "Đang bỏ ghim...",
            success: "Đã bỏ ghim!",
            error: "Lỗi khi bỏ ghim."
        });
    };

    if (documents === undefined) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Spinner size="lg" />
            </div>
        );
    }

    const byParent: Record<string, typeof filteredDocuments> = {};
    filteredDocuments.forEach((doc) => {
        const parentKey = (doc.parentDocument as string | undefined) ?? "root";
        if (!byParent[parentKey]) {
            byParent[parentKey] = [];
        }
        byParent[parentKey].push(doc);
    });

    const renderTree = (parentKey: string, level: number) => {
        const nodes = byParent[parentKey] || [];
        return nodes.map((document) => (
            <React.Fragment key={document._id}>
                <div
                    role="button"
                    onClick={() => onClick(document._id)}
                    className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
                    style={{
                        paddingLeft: level ? `${level * 12 + 8}px` : "8px",
                    }}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {document.icon ? (
                            <div className="shrink-0 text-[18px]">
                                {document.icon}
                            </div>
                        ) : (
                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate pl-2">
                            {document.title}
                        </span>
                    </div>
                    <div
                        onClick={(e) => onUnpin(e, document._id)}
                        role="button"
                        className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 shrink-0"
                    >
                        <PinOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                {renderTree(document._id as string, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="text-sm">
            <div className="flex items-center gap-x-1 p-2">
                <Search className="h-4 w-4" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
                    placeholder="Lọc theo tiêu đề trang..."
                />
            </div>
            <div className="mt-2 px-1 pb-1">
                <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
                    Không có tài liệu đã ghim nào.
                </p>
                {renderTree("root", 0)}
            </div>
        </div>
    );
};
