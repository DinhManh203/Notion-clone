"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PinIcon } from "lucide-react"; // icon đẹp hơn

const Pin = ({ itemId }: { itemId: string }) => {
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePin = async () => {
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 500));
      setPinned(!pinned);
    } catch (error) {
      console.error("Lỗi khi ghim:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        size="sm"
        variant={pinned ? "default" : "ghost"}
        onClick={togglePin}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <PinIcon
          className={`w-4 h-4 ${pinned ? "text-yellow-500" : "text-gray-500"}`}
        />
        {pinned ? "Đã ghim" : "Ghim"}
      </Button>
    </div>
  );
};

export default Pin;
