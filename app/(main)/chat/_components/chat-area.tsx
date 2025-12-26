"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Menu, Settings, X, FileText, Copy, Check } from "lucide-react";
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
    const [taggedDocuments, setTaggedDocuments] = useState<Array<{ _id: Id<"documents">, title: string, icon?: string }>>([]);
    const [showDocumentPicker, setShowDocumentPicker] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [selectedDocIndex, setSelectedDocIndex] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const messages = useQuery(
        api.chat.getMessages,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );
    const activeSession = useQuery(
        api.chat.getSessionById,
        activeSessionId ? { sessionId: activeSessionId } : "skip"
    );
    const userDocuments = useQuery(api.documents.getSearch);

    const updateSession = useMutation(api.chat.updateSession);
    const sendMessage = useAction(api.chat.sendMessage);

    // Xử lý sao chép tin nhắn
    const handleCopyMessage = async (content: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            toast.success("Đã sao chép tin nhắn!");
            setTimeout(() => setCopiedMessageId(null), 500);
        } catch (error) {
            toast.error("Lỗi khi sao chép!");
        }
    };

    // Tự động cuộn xuống cuối trang
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Khởi tạo chỉnh sửa tiêu đề
    useEffect(() => {
        if (activeSession) {
            setEditTitle(activeSession.title || "");
        }
    }, [activeSession]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        setMessageInput(value);
        setCursorPosition(cursorPos);

        // Kiểm tra xem người dùng đã nhập ký tự "@" để hiển thị trình chọn tài liệu chưa.
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbol !== -1) {
            // Lấy text sau @ để tìm kiếm
            const searchQuery = textBeforeCursor.substring(lastAtSymbol + 1);
            setShowDocumentPicker(true);
            setSelectedDocIndex(0); // Reset selection khi search query thay đổi
        } else {
            setShowDocumentPicker(false);
            setSelectedDocIndex(0);
        }
    };

    const handleSelectDocument = (doc: { _id: Id<"documents">, title: string, icon?: string }) => {
        // Thêm vào danh sách tài liệu đã được gắn thẻ nếu chưa được gắn thẻ.
        if (!taggedDocuments.find(d => d._id === doc._id)) {
            setTaggedDocuments([...taggedDocuments, doc]);
        }

        // Xóa @ khỏi đầu vào
        const textBeforeCursor = messageInput.substring(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
        const newInput = messageInput.substring(0, lastAtSymbol) + messageInput.substring(cursorPosition);

        setMessageInput(newInput);
        setShowDocumentPicker(false);

        // Tập trung lại vào đầu vào
        inputRef.current?.focus();
    };

    const handleRemoveTag = (docId: Id<"documents">) => {
        setTaggedDocuments(taggedDocuments.filter(d => d._id !== docId));
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeSessionId || isSending) return;

        const message = messageInput.trim();
        const documentIds = taggedDocuments.length > 0
            ? taggedDocuments.map(d => d._id)
            : undefined;

        setMessageInput("");
        setTaggedDocuments([]);
        setIsSending(true);

        try {
            await sendMessage({
                sessionId: activeSessionId,
                message,
                documentIds,
            });
        } catch (error) {
            toast.error("Lỗi khi gửi tin nhắn");
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Nếu document picker đang mở, xử lý phím mũi tên
        if (showDocumentPicker && userDocuments) {
            const textBeforeCursor = messageInput.substring(0, cursorPosition);
            const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
            const searchQuery = lastAtSymbol !== -1
                ? textBeforeCursor.substring(lastAtSymbol + 1).toLowerCase()
                : '';

            const filteredDocs = userDocuments.filter(doc =>
                doc.title.toLowerCase().includes(searchQuery)
            );

            if (filteredDocs.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedDocIndex((prev) =>
                        prev < filteredDocs.length - 1 ? prev + 1 : 0
                    );
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedDocIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredDocs.length - 1
                    );
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    const selectedDoc = filteredDocs[selectedDocIndex];
                    if (selectedDoc) {
                        handleSelectDocument({
                            _id: selectedDoc._id,
                            title: selectedDoc.title,
                            icon: selectedDoc.icon
                        });
                    }
                    return;
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    setShowDocumentPicker(false);
                    return;
                }
            }
        }

        // Xử lý Enter để gửi tin nhắn
        if (e.key === "Enter" && !isSending && messageInput.trim() && !showDocumentPicker) {
            handleSendMessage();
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

    if (!activeSessionId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground">
                <img
                    src={(resolvedTheme || theme) === "dark" ? "/welcome-chat-dark.png" : "/welcome-chat.png"}
                    alt="Empty chat"
                    className="w-28 h-28 object-contain"
                />
                <h2 className="text-2xl text-center font-semibold mb-2">Chào mừng đến với MiNote Chat</h2>
                <p className="text-sm">&quot;Chọn&quot; hoặc &quot;Tạo&quot; đoạn chat mới để bắt đầu</p>
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


                                {/* Bong bóng chat */}
                                <div className="flex flex-col gap-1 max-w-[70%]">
                                    <div
                                        className={cn(
                                            "rounded-xl px-3 py-2 h-fit",
                                            message.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        {/* Hiển thị các tài liệu được gắn thẻ cho tin nhắn người dùng */}
                                        {message.role === "user" && message.documentIds && message.documentIds.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-primary-foreground/20">
                                                {message.documentIds.map((docId) => {
                                                    const doc = userDocuments?.find(d => d._id === docId);
                                                    return doc ? (
                                                        <div
                                                            key={docId}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs"
                                                        >
                                                            <FileText className="h-6 w-4" />
                                                            <span>{doc.icon} {doc.title}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}

                                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                                            {message.content}
                                        </p>
                                    </div>

                                    {/* Nút sao chép phía dưới bong bóng chat AI */}
                                    {message.role === "assistant" && (
                                        <button
                                            onClick={() => handleCopyMessage(message.content, message._id)}
                                            className="self-start flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                            title="Sao chép tin nhắn"
                                        >
                                            {copiedMessageId === message._id ? (
                                                <>
                                                    <Check className="h-3 w-3 text-green-500" />
                                                    <span className="text-green-500">Đã sao chép</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3 w-3" />
                                                    <span>Sao chép</span>
                                                </>
                                            )}
                                        </button>
                                    )}
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

            {/* Vùng nhập */}
            <div className="p-4 mb-10">
                <div className="max-w-3xl mx-auto">
                    {/* Tag tài liệu */}
                    {taggedDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {taggedDocuments.map(doc => (
                                <div
                                    key={doc._id}
                                    className="inline-flex items-center gap-1 px-4 py-1 bg-accent rounded-md text-[14px]"
                                >
                                    <FileText className="h-3 w-3" />
                                    <span>{doc.icon} {doc.title}</span>
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive ml-3"
                                        onClick={() => handleRemoveTag(doc._id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Nhập liệu bằng Trình chọn tài liệu */}
                    <div className="relative flex gap-2 items-center">
                        {/* Menu Chọn tài liệu */}
                        {showDocumentPicker && userDocuments && userDocuments.length > 0 && (() => {
                            // Lấy search query sau @
                            const textBeforeCursor = messageInput.substring(0, cursorPosition);
                            const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                            const searchQuery = lastAtSymbol !== -1
                                ? textBeforeCursor.substring(lastAtSymbol + 1).toLowerCase()
                                : '';

                            // Lọc tài liệu theo search query
                            const filteredDocs = userDocuments.filter(doc =>
                                doc.title.toLowerCase().includes(searchQuery)
                            );

                            return filteredDocs.length > 0 ? (
                                <div className="absolute bottom-full mb-2 w-full max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg z-50">
                                    <div className="p-2 text-xs text-muted-foreground border-b">
                                        {searchQuery ? `Tìm kiếm: "${searchQuery}"` : 'Chọn tài liệu để phân tích'}
                                    </div>
                                    {filteredDocs.map((doc, index) => (
                                        <div
                                            key={doc._id}
                                            onClick={() => handleSelectDocument({
                                                _id: doc._id,
                                                title: doc.title,
                                                icon: doc.icon
                                            })}
                                            className={cn(
                                                "px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2 text-sm",
                                                index === selectedDocIndex && "bg-accent"
                                            )}
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>{doc.icon} {doc.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="absolute bottom-full mb-2 w-full bg-popover border rounded-md shadow-lg z-50 p-3 text-sm text-muted-foreground text-center">
                                    Không tìm thấy tài liệu &quot;{searchQuery}&quot;
                                </div>
                            ) : null;
                        })()}

                        <Input
                            ref={inputRef}
                            value={messageInput}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn (gõ @ để tag tài liệu) . . ."
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
        </div>
    );
}
