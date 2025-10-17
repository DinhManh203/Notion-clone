'use client';

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { useConvexAuth } from "convex/react";
import { SignInButton } from '@clerk/clerk-react';
import Link from "next/link";

export const Heading = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();

    return (
        <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
                Chào mừng bạn đến với<span className="underline"> MiNote</span>
            </h1>
            <h3 className="text-base sm:text-xl md:text-2xl font-medium">
                MiNote giúp không gian làm việc của bạn được kết nối <br />
                tốt hơn, nhanh hơn.
            </h3>
            {isLoading && (
                <div className="w-full flex item-center justify-center">
                    <Spinner size={'lg'} />
                </div>
            )}
            {isAuthenticated && !isLoading && (
                <Button asChild>
                    <Link href='/documents'>
                        Đến với MiNote
                        <ArrowForwardIos className="h-4 w-4 ml-2"></ArrowForwardIos>
                    </Link>
                </Button>
            )}
            {!isAuthenticated && !isLoading && (
                <SignInButton mode='modal' appearance={{
                    elements: {
                        footer: { display: 'none' },
                        footerAction__branding: { display: 'none' },
                    },
                }}>
                    <Button size={'sm'}>
                        Thử MiNote miễn phí
                        <ArrowForwardIos className="h-4 w-4 ml-2"></ArrowForwardIos>
                    </Button>
                </SignInButton>
            )}
        </div>
    )
}

export default Heading;