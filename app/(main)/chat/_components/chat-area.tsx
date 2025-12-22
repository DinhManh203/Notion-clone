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
                <MessageCircle className="h-16 w-16 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Chào mừng đến với MiNote Chat</h2>
                <p className="text-sm">Chọn một cuộc trò chuyện hoặc tạo đoạn chat mới để bắt đầu</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-4">
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
                                <h3 className="font-semibold text-sm">Cài đặt Chat</h3>
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
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {messages === undefined ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-4" />
                        <p>Bắt đầu cuộc trò chuyện</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((message) => (
                            <div
                                key={message._id}
                                className={cn(
                                    "flex gap-4",
                                    message.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-3",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {message.content}
                                    </p>
                                </div>
                                {message.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                                        <img
                                            src={user?.imageUrl}
                                            alt="Avatar"
                                            className="w-8 h-8 rounded-full"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isSending && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
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
            <div className="border-t p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        disabled={isSending}
                        className="flex-1 focus:ring-none"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSending}
                        size="icon"
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
