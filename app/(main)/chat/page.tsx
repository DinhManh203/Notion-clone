"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "./_components/chat-sidebar";
import { ChatArea } from "./_components/chat-area";
import { usePrefetchDocuments } from "@/hooks/use-prefetch";

export default function ChatPage() {
    const router = useRouter();
    const [activeSessionId, setActiveSessionId] = useState<Id<"chatSessions"> | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const sessions = useQuery(api.chat.getSessions);

    // Tải trước dữ liệu tài liệu trong nền để tăng tốc độ điều hướng.
    usePrefetchDocuments();

    return (
        <div className="h-screen flex bg-background">
            <ChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <ChatArea
                activeSessionId={activeSessionId}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />
        </div>
    );
}
