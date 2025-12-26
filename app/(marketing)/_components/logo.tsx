import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export const Logo = () => {
    return (
        <div className='hidden md:flex items-center gap-x-2'>
            <Image
                src="/Logo.svg"
                alt='Logo'
                width={40}
                height={40}
            />
            <p className="font-semibold">
                MiNote
            </p>
        </div>
    )
}