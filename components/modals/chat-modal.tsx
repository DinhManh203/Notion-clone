"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import {
    MessageCircle,
    Plus,
    Trash2,
    ArrowLeft,
    Send,
    Settings,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export const ChatModal = () => {
    const chat = useChat();
    const [activeSessionId, setActiveSessionId] = useState<Id<"chatSessions"> | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editPrompt, setEditPrompt] = useState("");

    const sessions = useQuery(api.chat.getSessions);
    const messages = useQuery(
        api.chat.getMessages,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );
    const activeSession = useQuery(
        api.chat.getSessionById,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );

    const createSession = useMutation(api.chat.createSession);
    const deleteSession = useMutation(api.chat.deleteSession);
    const updateSession = useMutation(api.chat.updateSession);
    const sendMessage = useAction(api.chat.sendMessage);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && messages.length > 0) {
            const messagesContainer = document.getElementById("chat-messages");
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }, [messages]);

    // Initialize edit fields when session changes
    useEffect(() => {
        if (activeSession) {
            setEditTitle(activeSession.title || "");
            setEditPrompt(activeSession.systemPrompt || "");
        }
    }, [activeSession]);

    // Reset activeSessionId if session becomes invalid
    useEffect(() => {
        if (activeSessionId && activeSession === null) {
            setActiveSessionId(null);
            toast.error("Phiên chat không tồn tại hoặc đã bị xóa");
        }
    }, [activeSessionId, activeSession]);

    const handleCreateSession = async () => {
        try {
            const sessionId = await createSession({
                title: "Đoạn chat mới",
            });
            setActiveSessionId(sessionId);
            toast.success("Đã tạo đoạn chat mới!");
        } catch (error) {
            toast.error("Lỗi khi tạo chat");
        }
    };

    const handleDeleteSession = async (sessionId: Id<"chatSessions">) => {
        try {
            await deleteSession({ sessionId });
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
            }
            toast.success("Đã xóa chat");
        } catch (error) {
            toast.error("Lỗi khi xóa chat");
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeSessionId || isSending) return;

        const message = messageInput.trim();
        setMessageInput("");
        setIsSending(true);

        try {
            await sendMessage({
                sessionId: activeSessionId,
                message,
            });
        } catch (error) {
            toast.error("Lỗi khi gửi tin nhắn");
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!activeSessionId) return;

        try {
            await updateSession({
                sessionId: activeSessionId,
                title: editTitle || undefined,
                systemPrompt: editPrompt || undefined,
            });
            setSettingsOpen(false);
            toast.success("Đã lưu cài đặt");
        } catch (error) {
            toast.error("Lỗi khi lưu cài đặt");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Dialog open={chat.isOpen} onOpenChange={chat.onClose}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
                {!activeSessionId ? (
                    // Session List View
                    <>
                        <DialogHeader className="border-b p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Chat với AI
                                </h2>
                                <Button onClick={handleCreateSession} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo chat mới
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-4">
                            {sessions === undefined ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageCircle className="h-12 w-12 mb-4" />
                                    <p>Chưa có cuộc trò chuyện nào</p>
                                    <p className="text-sm">Nhấn &quot;Tạo chat mới&quot; để bắt đầu</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((session) => (
                                        <div
                                            key={session._id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer group"
                                            onClick={() => setActiveSessionId(session._id)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium">
                                                    {session.title || "Không có tiêu đề"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(session.updatedAt).toLocaleDateString("vi-VN")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session._id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Chat Interface View
                    <>
                        <DialogHeader className="border-b p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveSessionId(null)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <h2 className="text-lg font-semibold">
                                        {activeSession?.title || "Chat"}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                                        <PopoverTrigger asChild className="mr-10">
                                            <Button variant="ghost" size="sm" title="Cài đặt">
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between pb-2 border-b">
                                                    <h3 className="font-semibold text-sm">Cài đặt</h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => setSettingsOpen(false)}
                                                    >
                                                        <span className="sr-only">Đóng</span>
                                                        ✕
                                                    </Button>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium">Tiêu đề chat</Label>
                                                    <Input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        placeholder="Nhập tiêu đề..."
                                                        className="mt-2"
                                                    />
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={handleSaveSettings}
                                                        className="flex-1"
                                                        size="sm"
                                                    >
                                                        Lưu cài đặt
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (activeSessionId) {
                                                                handleDeleteSession(activeSessionId);
                                                                setSettingsOpen(false);
                                                            }
                                                        }}
                                                        title="Xóa chat này"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </DialogHeader>
                        <div
                            id="chat-messages"
                            className="flex-1 overflow-y-auto p-4 space-y-4"
                        >
                            {messages === undefined ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <MessageCircle className="h-12 w-12 mb-4" />
                                    <p>Bạn có gặp vấn đề gì không ?</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={cn(
                                            "flex",
                                            message.role === "user" ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-lg p-3",
                                                message.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isSending && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="flex gap-2">
                                <Input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập tin nhắn . . ."
                                    disabled={isSending}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSending}
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
