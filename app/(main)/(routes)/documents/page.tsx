"use client";

import React from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { usePrefetchChat } from '@/hooks/use-prefetch';

const DocumentsPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const create = useMutation(api.documents.create);

  // Prefetch chat data in background to speed up navigation
  usePrefetchChat();

  const onCreate = () => {
    const promise = create({
      title: "Không có tiêu đề"
    })
      .then((documentId) => router.push(`/documents/${documentId}`))

    toast.promise(promise, {
      loading: "Đang tạo ghi chú mới ...",
      success: "Đã tạo ghi chú mới!",
      error: "Lỗi khi tạo ghi chú."
    });
  };

  return (
    <div className='h-full flex flex-col items-center justify-center space-y-4'>
      <Image
        src='/empty.png'
        height={300}
        width={300}
        alt='Empty'
        className='dark:hidden'
      />
      <Image
        src='/empty-dark.png'
        height={300}
        width={300}
        alt='Empty'
        className='hidden dark:block'
      />
      <h2 className='text-lg font-medium'>
        Chào mừng {user?.username}&apos;s MiNote
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className='h-4 w-4 mr-2' />
        Tạo ghi chú mới
      </Button>
    </div>
  );
};

export default DocumentsPage;
