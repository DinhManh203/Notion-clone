"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Search, PinOff, FileIcon, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DocumentItemProps {
    document: any;
    level: number;
    onUnpin: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, documentId: Id<"documents">) => void;
    onClick: (documentId: string) => void;
    shouldShowBorder: boolean;
    isDragging?: boolean;
}

const SortableDocumentItem = ({ document, level, onUnpin, onClick, shouldShowBorder, isDragging }: DocumentItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: document._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between py-1.5 ${shouldShowBorder ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}`}
        >
            <div
                onClick={() => onClick(document._id)}
                role="button"
                className="flex items-center gap-2 flex-1 min-w-0"
                style={{
                    paddingLeft: level ? `${level * 12 + 8}px` : "0px",
                }}
            >
                {!document.parentDocument && (
                    <div
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
                    >
                        {/* <GripVertical className="h-4 w-4 text-muted-foreground" /> */}
                    </div>
                )}
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
            {!document.parentDocument && (
                <div
                    onClick={(e) => onUnpin(e, document._id)}
                    role="button"
                    className="rounded-sm p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 shrink-0 mr-2"
                >
                    <PinOff className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
        </div>
    );
};

export const PinnedBox = () => {
    const router = useRouter();
    const params = useParams();
    const documents = useQuery(api.documents.getPinned);
    const unpin = useMutation(api.documents.unpin);
    const reorder = useMutation(api.documents.reorder);

    const [search, setSearch] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = filteredDocuments.findIndex((doc) => doc._id === active.id);
        const newIndex = filteredDocuments.findIndex((doc) => doc._id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const reorderedDocs = arrayMove(filteredDocuments, oldIndex, newIndex);

        reorderedDocs.forEach((doc, index) => {
            reorder({ id: doc._id as Id<"documents">, newOrder: index });
        });

        toast.success("Đã cập nhật lại vị trí!");
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

    // Hàm đệ quy để tìm document cuối cùng trong cây con
    const getLastDescendant = (documentId: string): string => {
        const children = byParent[documentId];
        if (!children || children.length === 0) {
            return documentId;
        }
        const lastChild = children[children.length - 1];
        return getLastDescendant(lastChild._id);
    };

    const renderTree = (parentKey: string, level: number, rootParentId?: string) => {
        const nodes = byParent[parentKey] || [];

        // Only make root level sortable
        if (level === 0) {
            return (
                <SortableContext items={nodes.map(doc => doc._id)} strategy={verticalListSortingStrategy}>
                    {nodes.map((document, index) => {
                        const isLastInGroup = index === nodes.length - 1;
                        let shouldShowBorder = false;

                        if (isLastInGroup) {
                            const lastDescendantId = getLastDescendant(document._id);
                            shouldShowBorder = document._id === lastDescendantId;
                        }

                        const currentRootParentId = document._id;

                        return (
                            <React.Fragment key={document._id}>
                                <SortableDocumentItem
                                    document={document}
                                    level={level}
                                    onUnpin={onUnpin}
                                    onClick={onClick}
                                    shouldShowBorder={shouldShowBorder}
                                />
                                {renderTree(document._id as string, level + 1, currentRootParentId)}
                            </React.Fragment>
                        );
                    })}
                </SortableContext>
            );
        }

        // Non-sortable children
        return nodes.map((document, index) => {
            const isLastInGroup = index === nodes.length - 1;
            let shouldShowBorder = false;

            if (rootParentId) {
                const lastDescendantId = getLastDescendant(rootParentId);
                shouldShowBorder = document._id === lastDescendantId;
            }

            const currentRootParentId = rootParentId;

            return (
                <React.Fragment key={document._id}>
                    <div
                        role="button"
                        onClick={() => onClick(document._id)}
                        className={`text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between py-1.5 ${shouldShowBorder ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}`}
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
                    </div>
                    {renderTree(document._id as string, level + 1, currentRootParentId)}
                </React.Fragment>
            );
        });
    };

    const activeDocument = activeId ? filteredDocuments.find(doc => doc._id === activeId) : null;

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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="mt-2 px-1 pb-1">
                    <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
                        Không có tài liệu đã ghim nào.
                    </p>
                    {renderTree("root", 0)}
                </div>
                <DragOverlay>
                    {activeDocument ? (
                        <div className="text-sm rounded-sm w-full bg-background shadow-lg flex items-center text-primary justify-between py-1.5 px-2 border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                {activeDocument.icon ? (
                                    <div className="shrink-0 text-[18px]">
                                        {activeDocument.icon}
                                    </div>
                                ) : (
                                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="truncate pl-2">
                                    {activeDocument.title}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
