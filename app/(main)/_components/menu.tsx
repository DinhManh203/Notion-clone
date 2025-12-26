"use client";

import { Id } from "@/convex/_generated/dataModel";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuProps {
    documentId: Id<"documents">;
};

export const Menu = ({
    documentId
}: MenuProps) => {
    const router = useRouter();
    const { user } = useUser();

    const archive = useMutation(api.documents.archive);

    const onArchive = () => {
        const promise = archive({ id: documentId })

        toast.promise(promise, {
            loading: "Đang chuyển vào thùng rác...",
            success: "Ghi chú đã chuyển vào thùng rác!",
            error: "Lỗi khi lưu trữ."
        });

        promise.then(() => {
            setTimeout(() => {
                router.push("/documents");
            }, 1500);
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={"sm"} variant={"ghost"}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-60"
                align="end"
                alignOffset={8}
                forceMount
            >
                <DropdownMenuItem onClick={onArchive}>
                    <Trash className="h-4 w-4 mr-2" />
                    Xóa
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="text-xs text-muted-foreground p-2">
                    Sửa đổi lần cuối bởi: {user?.username}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

Menu.Skeleton = function MenuSkeleton() {
    return (
        <Skeleton className="h-10 w-10" />
    )
}