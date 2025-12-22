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
import { Switch } from "@/components/ui/switch";
import { Check, Globe, Copy, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from "next-themes";
import { createRoot } from "react-dom/client";

interface PublishProps {
    initialData: Doc<"documents">;
}

export const Publish = ({
    initialData
}: PublishProps) => {
    const origin = useOrigin();
    const update = useMutation(api.documents.update);
    const { resolvedTheme } = useTheme();

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

            toast.success("Đã tải xuống file .txt!");
        } catch (err) {
            toast.error("Lỗi khi tạo file .txt");
            console.error(err);
        }
    };

    const onDownloadPDF = async () => {
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

            // Create a temporary container for the editor
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.top = "0";
            tempContainer.style.width = "800px";
            tempContainer.style.padding = "40px";
            tempContainer.style.backgroundColor = "white";

            // Add title if exists
            if (initialData.title) {
                const titleElement = document.createElement("h1");
                titleElement.textContent = initialData.title;
                titleElement.style.fontSize = "32px";
                titleElement.style.fontWeight = "bold";
                titleElement.style.marginBottom = "24px";
                titleElement.style.color = "black";
                tempContainer.appendChild(titleElement);
            }

            // Create editor container
            const editorContainer = document.createElement("div");
            editorContainer.className = "bn-container bn-default-styles";
            editorContainer.style.backgroundColor = "white";
            editorContainer.style.color = "black";
            tempContainer.appendChild(editorContainer);

            document.body.appendChild(tempContainer);

            // Create a temporary BlockNote editor instance
            const tempEditor = BlockNoteEditor.create({
                initialContent: parsed as PartialBlock[]
            });

            // Render the editor using React
            await new Promise<void>((resolve) => {
                const EditorComponent = () => {
                    return (
                        <BlockNoteView
                            editor={tempEditor}
                            theme="light"
                            editable={false}
                        />
                    );
                };

                const root = createRoot(editorContainer);
                root.render(<EditorComponent />);

                // Wait for editor to render
                setTimeout(() => {
                    resolve();
                }, 1000);
            });

            // Convert to canvas using html2canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true
            });

            // Remove temporary container
            document.body.removeChild(tempContainer);

            // Convert canvas to image
            const imgData = canvas.toDataURL("image/png");

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            let heightLeft = imgHeight;
            let position = 0;

            // Add image to PDF (handle multiple pages if needed)
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${initialData.title || "note"}.pdf`);

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
                                Bản ghi chú đang được chia sẻ!
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

                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1 text-xs">Cho phép chỉnh sửa</div>
                            <Switch
                                checked={!!initialData.allowEditing}
                                onCheckedChange={(v) =>
                                    update({
                                        id: initialData._id,
                                        allowEditing: v,
                                    })
                                }
                            />
                        </div>

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
