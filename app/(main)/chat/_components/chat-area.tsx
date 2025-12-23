"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle, Menu, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "next-themes";

interface ChatAreaProps {
    activeSessionId: Id<"chatSessions"> | null;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export function ChatArea({
    activeSessionId,
    onToggleSidebar,
    isSidebarOpen,
}: ChatAreaProps) {
    const { user } = useUser();
    const { theme, resolvedTheme } = useTheme();
    const [messageInput, setMessageInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messages = useQuery(
        api.chat.getMessages,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );
    const activeSession = useQuery(
        api.chat.getSessionById,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );

    const updateSession = useMutation(api.chat.updateSession);
    const sendMessage = useAction(api.chat.sendMessage);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initialize edit title
    useEffect(() => {
        if (activeSession) {
            setEditTitle(activeSession.title || "");
        }
    }, [activeSession]);

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

    if (!activeSessionId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
                <img
                    src={(resolvedTheme || theme) === "dark" ? "/welcome-chat-dark.png" : "/welcome-chat.png"}
                    alt="Empty chat"
                    className="w-28 h-28 object-contain"
                />
                <h2 className="text-2xl font-semibold mb-2">Chào mừng đến với MiNote Chat</h2>
                <p className="text-sm">"Chọn" hoặc "Tạo" đoạn chat mới để bắt đầu</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    {!isSidebarOpen && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleSidebar}
                            className="md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="font-semibold truncate">
                        {activeSession?.title || "Chat"}
                    </h1>
                </div>

                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
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

                            <Button onClick={handleSaveSettings} className="w-full" size="sm">
                                Lưu cài đặt
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
                {messages === undefined ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <img
                            src={(resolvedTheme || theme) === "dark" ? "/empty-chat-dark.png" : "/empty-chat.png"}
                            alt="Empty chat"
                            className="w-28 h-28 object-contain"
                        />
                        <p>Bạn có gặp vấn đề gì không ?</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((message) => (
                            <div
                                key={message._id}
                                className={cn(
                                    "flex flex-col gap-2",
                                    message.role === "user" ? "items-end" : "items-start"
                                )}
                            >
                                {/* Avatar and Name */}
                                {message.role === "assistant" ? (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/nhan-vien.png"
                                            alt="MiNote Bot"
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <p className="text-[14px] text-muted-foreground">
                                            MiNote - Nhân viên hỗ trợ (AI)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-[14px] text-muted-foreground">
                                            {user?.username}
                                        </p>
                                        <img
                                            src={user?.imageUrl}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full"
                                        />
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-xl px-3 py-2 h-fit",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isSending && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    {/* <MessageCircle className="h-4 w-4 text-primary-foreground" /> */}
                                    <img
                                        src="/nhan-vien.png"
                                        alt="MiNote Bot"
                                        className="w-8 h-8 rounded-full"
                                    />
                                </div>
                                <div className="bg-muted rounded-2xl px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 mb-10">
                <div className="max-w-3xl mx-auto flex gap-2 items-center">
                    <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn . . ."
                        disabled={isSending}
                        className="flex-1 border-none outline-none fo bg-secondary"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSending}
                        size="icon"
                        className="h-9 w-12"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
