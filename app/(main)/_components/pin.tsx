"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PinIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const Pin = ({ itemId }: { itemId: string }) => {
  const router = useRouter();
  const pinDocument = useMutation(api.documents.pin);
  const document = useQuery(api.documents.getById, {
    documentId: itemId as Id<"documents">,
  });

  const handlePin = async () => {
    if (!document) return;

    try {
      const promise = pinDocument({ id: itemId as Id<"documents"> });
      toast.promise(promise, {
        loading: "Đang ghim...",
        success: "Đã ghim tài liệu!",
        error: (error) => {
          console.error("Lỗi khi ghim:", error);
          return "Lỗi khi ghim. Vui lòng thử lại.";
        },
      });

      promise.then(() => {
        router.push("/documents?open=pinned");
      });
    } catch (error) {
      console.error("Lỗi khi ghim:", error);
      toast.error("Lỗi khi ghim. Vui lòng thử lại.");
    }
  };

  const isPinned = document?.isPinned ?? false;
  const hasParent = document?.parentDocument !== undefined;

  if (isPinned || hasParent) {
    return null;
  }

  return (
    <div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handlePin}
        className="flex items-center gap-1"
      >
        <PinIcon className="w-4 h-4 text-gray-500" />
        Ghim
      </Button>
    </div>
  );
};

export default Pin;
