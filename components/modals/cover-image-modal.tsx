"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog";
import { useCoverImage } from "@/hooks/use-cover-image";
import { SingleImageDropzone } from "@/components/single-image-dropzone";
import { useState } from "react";
import { useEdgeStore } from "@/lib/edgestore";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { HardDriveUpload } from "lucide-react";

export const CoverImageModal = () => {
    const params = useParams();
    const [file, setFile] = useState<File>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const coverImage = useCoverImage();
    const { edgestore } = useEdgeStore();
    const update = useMutation(api.documents.update);

    const onClose = () => {
        setFile(undefined);
        setIsSubmitting(false);
        coverImage.onClose();
    }

    const onChange = async (file?: File) => {
        if (file) {
            setIsSubmitting(true);
            setFile(file);

            // let res;

            // if (coverImage.url) {
            //     res = await edgestore.publicFiles.upload({
            //         file,
            //         options: {
            //             replaceTargetUrl: coverImage.url,
            //         }
            //     })
            // } else {
            //     res = await edgestore.publicFiles.upload({
            //     file
            // });
            // }

            const res = await edgestore.publicFiles.upload({
                file,
                options: {
                    replaceTargetUrl: coverImage.url
                }
            });

            await update({
                id: params.documentId as Id<"documents">,
                coverImage: res.url
            });


            onClose();
        }
    }

    return (
        <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
            <DialogContent>
                <DialogHeader>
                    <h2 className="text-center text-lg font-semibold">
                        Thêm ảnh bìa
                    </h2>
                </DialogHeader>
                <SingleImageDropzone
                    className="w-full outline-none"
                    disabled={isSubmitting}
                    value={file}
                    onChange={onChange}
                />
                <div className="flex gap-2 mt-4 text-gray-600">
                    <HardDriveUpload className="h-5 w-5" />
                    <span>Tải ảnh bìa lên từ máy của bạn</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};