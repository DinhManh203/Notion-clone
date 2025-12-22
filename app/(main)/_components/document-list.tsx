"use client";

import { Doc, Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import Item from "./item";
import { FileIcon } from "lucide-react";
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
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

interface DocumentListProps {
    parentDocumentId?: Id<"documents">;
    level?: number;
    data?: Doc<"documents">[];
}

export const DocumentList = ({
    parentDocumentId,
    level = 0
}: DocumentListProps) => {
    const params = useParams();
    const router = useRouter();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeId, setActiveId] = useState<string | null>(null);

    const reorder = useMutation(api.documents.reorder);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const onExpand = (documentId: string) => {
        setExpanded(prevExpanded => ({
            ...prevExpanded,
            [documentId]: !prevExpanded[documentId]
        }));
    };

    const documents = useQuery(api.documents.getSidebar, {
        parentDocument: parentDocumentId
    });

    const onRedirect = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id || !documents) {
            return;
        }

        const oldIndex = documents.findIndex((doc) => doc._id === active.id);
        const newIndex = documents.findIndex((doc) => doc._id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const reorderedDocs = arrayMove(documents, oldIndex, newIndex);

        reorderedDocs.forEach((doc, index) => {
            reorder({ id: doc._id as Id<"documents">, newOrder: index });
        });

        toast.success("Đã cập nhật lại vị trí!");
    };

    if (documents === undefined) {
        return (
            <>
                <Item.Skeleton level={level} />
                {level === 0 && (
                    <>
                        <Item.Skeleton level={level} />
                        <Item.Skeleton level={level} />
                    </>
                )}
            </>
        );
    };

    const activeDocument = activeId ? documents.find(doc => doc._id === activeId) : null;

    return (
        <>
            <p
                style={{
                    paddingLeft: level ? `${(level * 12) + 25}px` : undefined
                }}
                className={cn("hidden text-sm font-medium text-muted-foreground/80",
                    expanded && "last:block",
                    level === 0 && "hidden"
                )}
            >
                Không có ghi chú nào ở đây
            </p>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={documents.map(doc => doc._id)} strategy={verticalListSortingStrategy}>
                    {documents.map((document) => (
                        <div key={document._id}>
                            <Item
                                id={document._id}
                                onClick={() => onRedirect(document._id)}
                                label={document.title}
                                icon={FileIcon}
                                documentIcon={document.icon}
                                active={params.documentId === document._id}
                                level={level}
                                onExpand={() => onExpand(document._id)}
                                expanded={expanded[document._id]}
                                isDraggable={level === 0}
                            />
                            {expanded[document._id] && (
                                <DocumentList
                                    parentDocumentId={document._id}
                                    level={level + 1}
                                />
                            )}
                        </div>
                    ))}
                </SortableContext>
                <DragOverlay>
                    {activeDocument ? (
                        <div className="bg-background shadow-lg rounded-sm border p-2">
                            <div className="flex items-center gap-2">
                                {activeDocument.icon ? (
                                    <div className="shrink-0 text-[18px]">
                                        {activeDocument.icon}
                                    </div>
                                ) : (
                                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="truncate text-sm">
                                    {activeDocument.title}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    )
}