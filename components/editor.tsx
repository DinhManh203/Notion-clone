"use client";

import {
    BlockNoteEditor,
    PartialBlock
} from "@blocknote/core";
import {
    useCreateBlockNote
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import { useRef } from "react";

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
};

const Editor = ({
    onChange,
    initialContent,
    editable
}: EditorProps) => {
    const { resolvedTheme } = useTheme();
    const { edgestore } = useEdgeStore();
    const isEditable = editable ?? true;
    const previousContentRef = useRef<string | undefined>(initialContent);

    const handleUpload = async (file: File) => {
        const response = await edgestore.publicFiles.upload({
            file
        });

        return response.url;
    }

    const editor: BlockNoteEditor = useCreateBlockNote({
        initialContent:
            initialContent
                ? JSON.parse(initialContent) as PartialBlock[]
                : undefined,
        uploadFile: handleUpload
    });

    // Đảm bảo trạng thái editable của editor luôn khớp với prop
    editor.isEditable = isEditable;

    return (
        <div>
            <BlockNoteView
                editor={editor}
                theme={resolvedTheme === "dark" ? "dark" : 'light'}
                editable={isEditable}
                onChange={() => {
                    // Chỉ gọi onChange khi editor có thể chỉnh sửa
                    if (!isEditable) {
                        return;
                    }

                    const currentContent = JSON.stringify(editor.document, null, 2);
                    // Chỉ gọi onChange nếu content thực sự thay đổi
                    if (currentContent !== previousContentRef.current) {
                        previousContentRef.current = currentContent;
                        onChange(currentContent);
                    }
                }}
            />
        </div>
    )
}

export default Editor;