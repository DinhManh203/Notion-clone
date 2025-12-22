"use client";

import { Doc } from "@/convex/_generated/dataModel";
import {
    PopoverTrigger,
    Popover,
    PopoverContent
} from "@/components/ui/popover";
import { useOrigin } from "@/hooks/use-origin";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Globe, Copy, Download } from "lucide-react";
import jsPDF from "jspdf";

interface PublishProps {
    initialData: Doc<"documents">;
}

export const Publish = ({
    initialData
}: PublishProps) => {
    const origin = useOrigin();
    const update = useMutation(api.documents.update);

    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const url = `${origin}/preview/${initialData._id}`;

    const onPublish = () => {
        setIsSubmitting(true);
        const promise = update({
            id: initialData._id,
            isPublished: true,
        }).finally(() => setIsSubmitting(false));

        toast.promise(promise, {
            loading: "Đang xuất bản...",
            success: "Ghi chú đã được xuất bản!",
            error: "Xuất bản thất bại.",
        });
    };

    const onUnpublish = () => {
        setIsSubmitting(true);
        const promise = update({
            id: initialData._id,
            isPublished: false,
        }).finally(() => setIsSubmitting(false));

        toast.promise(promise, {
            loading: "Đang hủy xuất bản...",
            success: "Ghi chú đã hủy xuất bản.",
            error: "Lỗi khi hủy xuất bản.",
        });
    };

    const onCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    // 🔽 HÀM TRÍCH XUẤT TEXT TỪ JSON CONTENT
    const extractText = (blocks: any[]): string[] => {
        let texts: string[] = [];
        blocks.forEach((block) => {
            if (block.content && Array.isArray(block.content)) {
                block.content.forEach((item: any) => {
                    if (item.type === "text" && item.text) {
                        texts.push(item.text);
                    }
                });
            }
            if (block.children && block.children.length > 0) {
                texts = texts.concat(extractText(block.children));
            }
        });
        return texts;
    };

    const onDownloadTXT = () => {
        try {
            const content = initialData.content;
            if (!content) {
                toast.error("Không có nội dung để tải!");
                return;
            }

            let parsed = content;
            if (typeof content === "string") {
                try {
                    parsed = JSON.parse(content);
                } catch {
                    toast.error("Dữ liệu không hợp lệ!");
                    return;
                }
            }

            if (!Array.isArray(parsed)) {
                toast.error("Dữ liệu không đúng định dạng!");
                return;
            }

            const textArray = Array.isArray(parsed) ? extractText(parsed) : [];
            const blob = new Blob([textArray.join("\n\n")], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${initialData.title || "note"}.txt`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("✅ Đã tải xuống file .txt!");
        } catch (err) {
            toast.error("Lỗi khi tạo file .txt");
            console.error(err);
        }
    };

    const onDownloadPDF = () => {
        try {
            const content = initialData.content;
            if (!content) {
                toast.error("Không có nội dung để tải!");
                return;
            }

            let parsed = content;
            if (typeof content === "string") {
                try {
                    parsed = JSON.parse(content);
                } catch {
                    toast.error("Dữ liệu không hợp lệ!");
                    return;
                }
            }

            if (!Array.isArray(parsed)) {
                toast.error("Dữ liệu không đúng định dạng!");
                return;
            }
            const textArray = extractText(parsed);
            const doc = new jsPDF();

            const textContent = textArray.join("\n\n");
            const lines = doc.splitTextToSize(textContent, 180);
            doc.text(lines, 15, 20);
            doc.save(`${initialData.title || "note"}.pdf`);

            toast.success("✅ Đã tải xuống file PDF!");
        } catch (err) {
            toast.error("Lỗi khi tạo file PDF");
            console.error(err);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size={"sm"} variant={"ghost"}>
                    Chia sẻ
                    {initialData.isPublished && (
                        <Globe className="text-sky-500 w-4 h-4 ml-2" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-100"
                align="end"
                alignOffset={8}
                forceMount
            >
                {initialData.isPublished ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-x-2">
                            <Globe className="text-sky-500 animate-pulse h-4 w-4" />
                            <p className="text-xs font-medium text-sky-500">
                                Ghi chú này đang được chia sẻ!
                            </p>
                        </div>
                        <div className="flex items-center">
                            <input
                                className="flex-1 px-2 text-xs border rounded-l-md h-8 bg-muted truncate"
                                value={url}
                                disabled
                            />
                            <Button
                                onClick={onCopy}
                                disabled={copied}
                                className="h-8 rounded-l-none"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1 text-xs">Cho phép chỉnh sửa</div>
                            <Switch
                                checked={!!initialData.allowEditing}
                                onCheckedChange={(v) => update({ id: initialData._id, allowEditing: v })}
                            />
                        </div> */}

                        <div className="flex gap-2">
                            <Button
                                size={"sm"}
                                className="flex-1 text-xs"
                                disabled={isSubmitting}
                                onClick={onUnpublish}
                            >
                                Hủy xuất bản
                            </Button>

                            <Button
                                size={"sm"}
                                variant={"outline"}
                                className="flex-1 text-xs"
                                onClick={onDownloadTXT}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                TXT
                            </Button>

                            <Button
                                size={"sm"}
                                variant={"outline"}
                                className="flex-1 text-xs"
                                onClick={onDownloadPDF}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <Globe className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium mb-2">
                            Xuất bản ghi chú
                        </p>
                        <span className="text-xs text-muted-foreground mb-4">
                            Chia sẻ nội dung của bạn với người khác.
                        </span>
                        <Button
                            disabled={isSubmitting}
                            onClick={onPublish}
                            className="w-full text-xs"
                            size={"sm"}
                        >
                            Xuất bản
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
