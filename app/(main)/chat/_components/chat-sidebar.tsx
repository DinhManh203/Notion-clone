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
    onSelectSession: (id: Id<"chatSessions">) => void;
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
            const sessionId = await createSession({
                title: "Đoạn chat mới",
            });
            onSelectSession(sessionId);
            toast.success("Đã tạo đoạn chat mới!");
        } catch (error) {
            toast.error("Lỗi khi tạo chat");
        }
    };

    const handleDeleteSession = async (sessionId: Id<"chatSessions">, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteSession({ sessionId });
            if (activeSessionId === sessionId) {
                onSelectSession(null as any);
            }
            toast.success("Đã xóa đoạn chat");
        } catch (error) {
            toast.error("Lỗi khi xóa đoạn chat");
        }
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={cn(
                    "h-full bg-secondary border-r flex flex-col transition-all duration-300",
                    isOpen ? "w-64" : "w-0 overflow-hidden"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b">
                    <Button
                        onClick={handleCreateSession}
                        variant="outline"
                        className="
                            w-full justify-start gap-2

                            /* Light mode */
                            bg-gray-100 text-gray-900 border-gray-300
                            hover:bg-gray-200

                            /* Dark mode */
                            dark:bg-white dark:text-gray-900 dark:border-gray-200
                            dark:hover:bg-gray-300

                            focus-visible:ring-2
                            focus-visible:ring-gray-400
                            dark:focus-visible:ring-gray-300
                        "
                    >
                        <Plus className="h-4 w-4" />
                        Đoạn chat mới
                    </Button>

                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {sessions === undefined ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                            <p className="text-sm">Đang tải...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <MessageCircle className="h-8 w-8 mb-2" />
                            <p className="text-sm">Chưa có chat nào</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sessions.map((session) => (
                                <div
                                    key={session._id}
                                    onClick={() => onSelectSession(session._id)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                        activeSessionId === session._id
                                            ? "bg-accent"
                                            : "hover:bg-accent/50"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {session.title || "Đoạn chat mới"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(session.updatedAt).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                                        onClick={(e) => handleDeleteSession(session._id, e)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onToggle}
                className={cn(
                    "fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-background border shadow-lg",
                    isOpen && "left-60"
                )}
            >
                <ChevronLeft className={cn("h-5 w-5 transition-transform", !isOpen && "rotate-180")} />
            </button>
        </>
    );
}
