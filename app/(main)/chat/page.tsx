"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { ChatSidebar } from "./_components/chat-sidebar";
import { ChatArea } from "./_components/chat-area";
import { usePrefetchDocuments } from "@/hooks/use-prefetch";

export default function ChatPage() {
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [activeSessionId, setActiveSessionId] = useState<Id<"chatSessions"> | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    const sessions = useQuery(api.chat.getSessions);

    // Tải trước dữ liệu tài liệu trong nền để tăng tốc độ điều hướng.
    usePrefetchDocuments();

    // Tự động mở/đóng sidebar khi chuyển đổi giữa mobile và desktop
    useEffect(() => {
        if (!isMobile) {
            setIsSidebarOpen(true);
        } else {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);

    // Prefetch documents route để tăng tốc độ navigation
    useEffect(() => {
        // Prefetch route sau 1 giây để không ảnh hưởng đến initial load
        const timer = setTimeout(() => {
            router.prefetch('/documents');
        }, 1000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="h-screen flex bg-background">
            <ChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                isMobile={isMobile}
            />
            <ChatArea
                activeSessionId={activeSessionId}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />
        </div>
    );
}
