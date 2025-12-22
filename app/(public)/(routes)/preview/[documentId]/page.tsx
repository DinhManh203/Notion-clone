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
    params: {
        documentId: Id<"documents">;
    };
};

const DocumentIdPage = ({
    params
}: DocumentIdPageProps) => {
    const Editor = useMemo(() => dynamic(() => import("@/components/editor"), { ssr: false }), []);

    const document = useQuery(api.documents.getById, {
        documentId: params.documentId
    });

    const update = useMutation(api.documents.update);

    const isEditable = document ? !!document.allowEditing : false;

    const onChange = (content: string) => {
        // Chỉ cho phép update khi allowEditing = true
        if (!isEditable) {
            return;
        }
        
        update({
            id: params.documentId,
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

    return (
        <div className='pb-40'>
            {isEditable ? (
                <div className="w-full bg-green-500 text-center text-sm p-1 text-white flex items-center gap-x-1 justify-center">
                    <Edit className="h-4 w-4" />
                    <p>
                        Đang cho phép chỉnh sửa - Bạn có thể chỉnh sửa tài liệu này
                    </p>
                </div>
            ) : (
                <div className="w-full bg-yellow-400 text-center text-sm p-1 text-white flex items-center gap-x-1 justify-center">
                    <Lock className="h-4 w-4" />
                    <p>
                        Chế độ chỉ đọc - Bạn chỉ có thể xem tài liệu này
                    </p>
                </div>
            )}
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