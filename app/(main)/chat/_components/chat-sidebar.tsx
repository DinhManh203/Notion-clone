"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    sessions: any[] | undefined;
    activeSessionId: Id<"chatSessions"> | null;
    onSelectSession: (id: Id<"chatSessions"> | null) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export function ChatSidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    isOpen,
    onToggle,
}: ChatSidebarProps) {
    const createSession = useMutation(api.chat.createSession);
    const deleteSession = useMutation(api.chat.deleteSession);

    const handleCreateSession = async () => {
        try {
            const sessionId = await createSession({ title: "Đoạn chat mới" });
            onSelectSession(sessionId);
            toast.success("Đã tạo đoạn chat mới!");
        } catch {
            toast.error("Lỗi khi tạo chat");
        }
    };

    const handleDeleteSession = async (
        sessionId: Id<"chatSessions">,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        try {
            await deleteSession({ sessionId });
            if (activeSessionId === sessionId) onSelectSession(null);
            toast.success("Đã xóa đoạn chat");
        } catch {
            toast.error("Lỗi khi xóa đoạn chat");
        }
    };

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full border-r bg-background flex flex-col transition-all duration-300",
                    isOpen ? "w-64" : "w-0 overflow-hidden"
                )}
            >
                {/* Header */}
                <div className="p-4">
                    <Button
                        onClick={handleCreateSession}
                        variant="outline"
                        className="
                            w-full justify-start gap-2
                            bg-muted text-foreground
                            hover:bg-muted/70
                            dark:bg-white dark:text-black
                            dark:hover:bg-gray-200
                        "
                    >
                        <Plus className="h-4 w-4" />
                        Đoạn chat mới
                    </Button>
                </div>

                {/* Sessions */}
                <div className="flex-1 overflow-y-auto p-2">
                    {sessions === undefined && (
                        <EmptyState text="Đang tải..." />
                    )}

                    {sessions?.length === 0 && (
                        <EmptyState
                            icon={<MessageCircle className="h-8 w-8" />}
                            text="Chưa có chat nào"
                        />
                    )}

                    {sessions && sessions.length > 0 && (
                        <div className="space-y-1">
                            {sessions.map((session) => {
                                const isActive = activeSessionId === session._id;

                                return (
                                    <div
                                        key={session._id}
                                        onClick={() => onSelectSession(session._id)}
                                        className={cn(
                                            "group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors",
                                            isActive
                                                ? "bg-accent text-accent-foreground"
                                                : "hover:bg-muted/70 dark:hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {session.title || "Đoạn chat mới"}
                                            </p>
                                            {/* <p className="text-xs text-muted-foreground">
                                                {new Date(session.updatedAt).toLocaleDateString("vi-VN")}
                                            </p> */}
                                        </div>

                                        {/* Delete button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDeleteSession(session._id, e)}
                                            className="
                                                h-8 w-8 p-0
                                                opacity-0 group-hover:opacity-100
                                                hover:bg-transparent
                                                focus-visible:ring-0
                                            "
                                        >
                                            <Trash2
                                                className="
                                                    h-4 w-4
                                                    text-black
                                                    transition-all duration-150
                                                    group-hover:scale-110
                                                    dark:text-white
                                                "
                                            />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile toggle */}
            <button
                onClick={onToggle}
                className={cn(
                    "fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg border bg-background shadow",
                    isOpen && "left-60"
                )}
            >
                <ChevronLeft
                    className={cn(
                        "h-5 w-5 transition-transform",
                        !isOpen && "rotate-180"
                    )}
                />
            </button>
        </>
    );
}

function EmptyState({
    icon,
    text,
}: {
    icon?: React.ReactNode;
    text: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            {icon && <div className="mb-2">{icon}</div>}
            <p className="text-sm">{text}</p>
        </div>
    );
}
