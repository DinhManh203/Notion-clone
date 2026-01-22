"use client";

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import React from 'react';
import { Toolbar } from '@/components/toolbar';
import { Cover } from '@/components/cover';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Edit, Lock } from 'lucide-react';

interface DocumentIdPageProps {
    params: Promise<{
        documentId: Id<"documents">;
    }>;
};

const DocumentIdPage = ({
    params
}: DocumentIdPageProps) => {
    const Editor = useMemo(() => dynamic(() => import("@/components/editor"), { ssr: false }), []);

    // Unwrap params Promise for Next.js 15
    const { documentId } = React.use(params);

    const document = useQuery(api.documents.getById, {
        documentId: documentId
    });

    const update = useMutation(api.documents.update);

    const isEditable = document ? (document.isPublished && !!document.allowEditing) : false;

    const onChange = (content: string) => {
        if (!isEditable) {
            return;
        }

        update({
            id: documentId,
            content
        });
    };

    if (document === undefined) {
        return (
            <div>
                <Cover.Skeleton />
                <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
                    <div className='space-y-4 pl-8 pt-4'>
                        <Skeleton className='h-14 w-[50%]' />
                        <Skeleton className='h-4 w-[80%]' />
                        <Skeleton className='h-4 w-[40%]' />
                        <Skeleton className='h-4 w-[60%]' />
                    </div>
                </div>
            </div>
        );
    }

    if (document === null) {
        return <div>Not found</div>
    }

    if (!document.isPublished) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Tài liệu không được chia sẻ</h2>
                <p className="text-sm text-muted-foreground">
                    Tài liệu này đã bị hủy xuất bản và không còn khả dụng công khai.
                </p>
            </div>
        );
    }

    return (
        <div className='pb-40'>

            <Cover preview url={document.coverImage} />
            <div className='md:max-w-3xl lg:max-w-4xl mx-auto'>
                <Toolbar preview initialData={document} />
                <Editor
                    editable={isEditable}
                    onChange={onChange}
                    initialContent={document.content}
                />
            </div>
        </div>
    );
}

export default DocumentIdPage; 