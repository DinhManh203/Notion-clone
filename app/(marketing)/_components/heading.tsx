"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { Spinner } from "@/components/spinner";
import Link from "next/link";
import { SignInButton } from "@clerk/clerk-react";

const Heading = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();

    return (
        <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
                Ý tưởng, tài liệu & kế hoạch của bạn được thống nhất. Chào mừng đến với{" "}
                <span className="underline">MiNote</span>
            </h1>
            <h3 className="text-base sm:text-xl md:text-2xl font-medium">
                MiNote giúp không gian làm việc<br />
                tốt hơn, nhanh hơn.
            </h3>
            {isLoading && (
                <div className="w-full flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            )}
            {isAuthenticated && !isLoading && (
                <Button asChild>
                    <Link href="/documents">
                        Vào MiNote
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
            )}
            {!isAuthenticated && !isLoading && (
                <SignInButton mode="modal" appearance={{
                    elements: {
                        footer: { display: 'none' },
                        footerAction__branding: { display: 'none' },
                        dividerRow: { display: 'none' },
                        formFieldLabel: { display: 'none' },
                        formFieldInput: { display: 'none' },
                        formButtonPrimary: { display: 'none' },
                    },
                }}>
                    <Button>
                        Tham gia MiNote miễn phí
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </SignInButton>
            )}
        </div>
    );
};

export default Heading;
