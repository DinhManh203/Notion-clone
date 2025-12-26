"use client";

import React from 'react'
import {
    LucideIcon,
    ChevronDown,
    ChevronRight,
    Plus,
    MoreHorizontal,
    Trash,
    PinIcon,
    GripVertical
} from 'lucide-react';

import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import Pin from './pin';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItemProps {
    id?: Id<"documents">;
    documentIcon?: string;
    active?: boolean;
    expanded?: boolean;
    isSearch?: boolean;
    level?: number;
    onExpand?: () => void;
    label: string;
    onClick?: () => void;
    icon: LucideIcon;
    isDraggable?: boolean;
    onMouseEnter?: () => void;
}

const Item = ({
    id,
    label,
    onClick,
    icon: Icon,
    active,
    documentIcon,
    isSearch,
    level = 0,
    onExpand,
    expanded,
    isDraggable = false,
    onMouseEnter,
}: ItemProps) => {
    const { user } = useUser();
    const router = useRouter();
    const create = useMutation(api.documents.create);
    const archive = useMutation(api.documents.archive);
    const pinDocument = useMutation(api.documents.pin);

    const onArchive = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation();
        if (!id) return;
        const promise = archive({ id })
            .then(() => router.push("/documents"))

        toast.promise(promise, {
            loading: "Đang chuyển vào thùng rác...",
            success: "Ghi chú đã được chuyển vào thùng rác!",
            error: "Không lưu trữ được ghi chú này!."
        })
    }

    const onPin = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation();
        if (!id) return;
        const promise = pinDocument({ id })
            .then(() => router.push("/documents?open=pinned"))

        toast.promise(promise, {
            loading: "Đang ghim ghi chú...",
            success: "Ghi chú đã được ghim!",
            error: "Lỗi khi ghim ghi chú."
        });
    }

    const handleExpand = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation();
        onExpand?.();
    };

    const onCreate = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.stopPropagation();
        if (!id) return;
        const promise = create({ title: "Không có tiêu đề", parentDocument: id })
            .then((documentId) => {
                if (!expanded) {
                    onExpand?.();
                }
                router.push(`/documents/${documentId}`);
            });
        toast.promise(promise, {
            loading: "Đang tạo ghi chú mới...",
            success: "Ghi chú mới đã được tạo!",
            error: "Lỗi khi tạo ghi chú."
        })
    }

    const ChevronIcon = expanded ? ChevronDown : ChevronRight;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id || 'default',
        disabled: !isDraggable || !id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Prefetch document route on hover
    const handleMouseEnter = () => {
        if (id) {
            router.prefetch(`/documents/${id}`);
        }
        // Call external onMouseEnter if provided
        onMouseEnter?.();
    };

    return (
        <div
            ref={isDraggable ? setNodeRef : undefined}
            style={isDraggable ? style : undefined}
            {...(isDraggable ? attributes : {})}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            role="button"
            className={cn('group min-h-[27px] text-sm py-1 pr-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium',
                active && "bg-primary/5 text-primary"
            )}>
            {isDraggable && id && (
                <div
                    {...listeners}
                    className='cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded mr-1'
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className='h-4 w-4 text-muted-foreground/50' />
                </div>
            )}
            <div style={{ paddingLeft: isDraggable ? "0px" : (level ? `${(level * 20) + 20}px` : "14px") }} className="flex items-center flex-1 min-w-0">
                {!!id && (
                    <div
                        role='button'
                        className='h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1'
                        onClick={handleExpand}
                    >
                        <ChevronIcon
                            className='h-4 w-4 shrink-0 text-muted-foreground/50'
                        />
                    </div>
                )}
                {documentIcon ? (
                    <div className='shrink-0 mr-2 text-[18px]'>
                        {documentIcon}
                    </div>
                ) : (
                    <Icon
                        className='shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground'
                    />
                )}

                <span className='truncate'>
                    {label}
                </span>
            </div>
            {isSearch && (
                <kbd className='ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-muted-foreground opacity-100'>
                    <span className='text-[8px]'>
                        ⌘
                    </span>K
                </kbd>
            )}
            {!!id && (
                <div className='ml-auto flex items-center gap-x-2'>
                    <DropdownMenu >
                        <DropdownMenuTrigger
                            onClick={(e) => e.stopPropagation()}
                            asChild
                        >
                            <div
                                role='button'
                                className='opacity-100 md:opacity-0 md:group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600'
                            >
                                <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className='w-60'
                            align='start'
                            side='right'
                            forceMount
                        >
                            <DropdownMenuItem onClick={onPin}>
                                <PinIcon className='h-4 w-4 mr-2' />
                                Ghim
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={onArchive}>
                                <Trash className='h-4 w-4 mr-2' />
                                Xóa ghi chú
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className='text-xs text-muted-foreground p-2'>
                                Lần cuối sửa bởi: {user?.username}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div
                        role='button'
                        onClick={onCreate}
                        className='opacity-100 md:opacity-0 md:group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600'>
                        <Plus className='h-4 w-4 text-muted-foreground' />
                    </div>
                </div>
            )}

        </div>
    )
}

export default Item

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
    return (
        <div
            style={{
                paddingLeft: level ? `${(level * 12) + 25}px` : "12px"
            }}
            className='flex gap-x-2 py-[3px]'
        >
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-[30%]' />
        </div>
    )
}