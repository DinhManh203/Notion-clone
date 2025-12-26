"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

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
    const { theme, resolvedTheme } = useTheme();

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
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "h-full border-r bg-background flex flex-col transition-all duration-300 relative",
                    "fixed md:relative z-50 md:z-auto",
                    "md:w-64",
                    isOpen ? "w-64" : "w-0 overflow-hidden md:overflow-visible"
                )}
            >
                {/* Header */}
                <div className="p-4 mt-11">
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
                        Tạo cuộc trò chuyện mới
                    </Button>
                </div>

                {/* Sessions */}
                <div className="flex-1 overflow-y-auto p-2">
                    {sessions === undefined && (
                        <EmptyState text="Đang tải..." />
                    )}

                    {sessions?.length === 0 && (
                        <EmptyState
                            icon={<img
                                src={(resolvedTheme || theme) === "dark" ? "/welcome-chat-dark.png" : "/welcome-chat.png"}
                                alt="Empty chat"
                                className="w-28 h-28 object-contain"
                            />}
                            text="Bắt đầu bằng cách tạo một đoạn chat mới!"
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

            {/* Toggle button - mobile only */}
            <button
                onClick={onToggle}
                className={cn(
                    "fixed top-16 z-[25] p-[8px] rounded-lg border bg-background shadow-md hover:shadow-lg hover:bg-accent transition-all duration-300",
                    "md:hidden", // Only show on mobile
                    isOpen ? "left-[calc(256px-2rem)]" : "left-4"
                )}
                aria-label={isOpen ? "Đóng sidebar" : "Mở sidebar"}
            >
                <ChevronLeft
                    className={cn(
                        "h-5 w-5 transition-transform duration-300",
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
            <p className="text-sm text-center">{text}</p>
        </div>
    );
}
