"use client";

import {
    ChevronsLeft,
    MenuIcon,
    PlusCircle,
    Search,
    Settings,
    Plus,
    Trash,
    ChartNoAxesColumn,
    Clock,
    MessageCircle,
    BadgeInfo,
    Pin
} from "lucide-react";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import React, { ElementRef, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import UserItem from "./user-item";
import { toast } from 'sonner';
import Item from "./item";
import { DocumentList } from "./document-list";
import { TrashBox } from "./trash-box";
import { PinnedBox } from "./pinned-box";
import { Navbar } from "./navbar";

export const Navigation = () => {
    const router = useRouter();
    const settings = useSettings();
    const search = useSearch();
    const params = useParams();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 450px)");
    const create = useMutation(api.documents.create);

    const isResizingRef = useRef(false);
    const sidebarRef = useRef<ElementRef<"aside">>(null);
    const navbarRef = useRef<ElementRef<"div">>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(isMobile);
    const [openPinnedBox, setOpenPinnedBox] = useState(false);

    const [usageTime, setUsageTime] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const seconds = Math.floor((Date.now() - start) / 1000);
            setUsageTime(seconds);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatUsageTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs} giây`;
        return `${mins} phút ${secs} giây`;
    };

    useEffect(() => {
        if (isMobile) {
            collapse();
        } else {
            resetWidth();
        }
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            collapse();
        }
    }, [pathname, isMobile]);

    useEffect(() => {
        if (searchParams?.get("open") === "pinned") {
            setOpenPinnedBox(true);
            const timer = setTimeout(() => {
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("open");
                router.replace(newUrl.pathname + newUrl.search);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const handleMouseDown = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();
        isResizingRef.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (!isResizingRef.current) return;
        let newWidth = event.clientX;
        if (newWidth < 250) newWidth = 250;
        if (newWidth > 680) newWidth = 680;
        if (sidebarRef.current && navbarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`;
            navbarRef.current.style.setProperty("left", `${newWidth}px`);
            navbarRef.current.style.setProperty("width", `calc(100% - ${newWidth}px)`);
        }
    };

    const handleMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const resetWidth = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(false);
            setIsResetting(true);
            sidebarRef.current.style.width = isMobile ? "100%" : "250px";
            navbarRef.current.style.setProperty("width", isMobile ? '0' : 'calc(100% - 1050px)');
            navbarRef.current.style.setProperty("left", isMobile ? "100%" : "250px");
            setTimeout(() => setIsResetting(false), 300);
        }
    };

    const collapse = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(true);
            setIsResetting(true);
            sidebarRef.current.style.width = "0";
            navbarRef.current.style.setProperty("width", "100%");
            navbarRef.current.style.setProperty("left", "0");
            setTimeout(() => setIsResetting(false), 300);
        }
    };

    const handleCreate = () => {
        const promise = create({ title: "Không có tiêu đề" })
            .then((documentId) => router.push(`/documents/${documentId}`));
        toast.promise(promise, {
            loading: "Đang tạo ghi chú mới ...",
            success: "Ghi chú mới đã được tạo!",
            error: "Lỗi khi tạo ghi chú."
        });
    };

    return (
        <>
            <aside
                ref={sidebarRef}
                className={cn(
                    "group/sidebar h-full bg-secondary overflow-y-auto relative flex w-60 flex-col z-30",
                    isResetting && "transition-all ease-in-out duration-300",
                    isMobile && "w-0"
                )}
            >
                <div
                    onClick={collapse}
                    role='button'
                    className={cn(
                        "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
                        isMobile && "opacity-100"
                    )}
                >
                    <ChevronsLeft className="h-6 w-6" />
                </div>

                <div>
                    <UserItem />
                    <Item label="Tìm kiếm" icon={Search} isSearch onClick={search.onOpen} />
                    <Item label="Cài đặt" icon={Settings} onClick={settings.onOpen} />
                    <Item onClick={handleCreate} label="Tạo ghi chú mới" icon={PlusCircle} />
                    <Item onClick={() => router.push('/chat')} label="Chat" icon={MessageCircle} />
                    <Popover open={openPinnedBox} onOpenChange={setOpenPinnedBox}>
                        <PopoverTrigger className="w-full mt-4">
                            <Item label="Tài liệu đã ghim" icon={Pin} />
                        </PopoverTrigger>
                        <PopoverContent className="w-72" side={isMobile ? "bottom" : "right"}>
                            <PinnedBox />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="mt-4">
                    <DocumentList />
                    <Item onClick={handleCreate} icon={Plus} label="Thêm ghi chú" />
                    <Popover>
                        <PopoverTrigger className="w-full mt-4">
                            <Item label="Thùng rác" icon={Trash} />
                        </PopoverTrigger>
                        <PopoverContent className="w-72" side={isMobile ? "bottom" : "right"}>
                            <TrashBox />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="mt-auto flex items-center justify-around p-3 border-t border-neutral-200 dark:border-neutral-700">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                                title="Thời gian sử dụng"
                            >
                                <Clock className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto px-3 py-1 text-sm text-muted-foreground">
                            ⏱ Đã sử dụng: {formatUsageTime(usageTime)}
                        </PopoverContent>
                    </Popover>

                    {/* <button
                        onClick={() => toast.info("Đang mở chat...")}
                        className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                        title="Chat"
                    >
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </button> */}
                    <button
                        onClick={() => toast.info("Thông tin phiên bản: v1.0.0")}
                        className="p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                        title="Thông tin phiên bản"
                    >
                        <BadgeInfo className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <div
                    onMouseDown={handleMouseDown}
                    onClick={resetWidth}
                    className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary/10 right-0 top-0"
                />
            </aside>

            <div
                ref={navbarRef}
                className={cn("absolute top-0 z-20 left-60 w-[calc(100%-250px)]",
                    isResetting && "transition-all ease-in-out duration-300",
                    isMobile && "left-0 w-full"
                )}
            >
                {!!params.documentId ? (
                    <Navbar isCollapsed={isCollapsed} onResetWidth={resetWidth} />
                ) : (
                    <nav className="w-full bg-transparent px-4 py-3 flex items-center">
                        {isCollapsed && (
                            <button
                                onClick={resetWidth}
                                className="
                                    flex items-center justify-center
                                    h-10 w-10
                                    rounded-lg
                                    border
                                    bg-background
                                    text-muted-foreground
                                    shadow-sm
                                    transition-all duration-200
                                    hover:bg-muted
                                    hover:text-foreground
                                    active:scale-95
                                "
                                aria-label="Open menu"
                            >
                                <MenuIcon className="h-5 w-5" />
                            </button>
                        )}
                    </nav>

                )}
            </div>
        </>
    );
};
