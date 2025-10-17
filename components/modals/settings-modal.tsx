"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/use-settings";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

const SnowEffect = () => {
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.id = "snow-canvas";
        canvas.style.position = "fixed";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "9999";
        document.body.appendChild(canvas);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const snowflakes = Array.from({ length: 80 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 3 + 1,
            d: Math.random() + 1,
        }));

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            for (let i = 0; i < snowflakes.length; i++) {
                const f = snowflakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            update();
        };

        let angle = 0;
        const update = () => {
            angle += 0.01;
            for (let i = 0; i < snowflakes.length; i++) {
                const f = snowflakes[i];
                f.y += Math.pow(f.d, 2) + 1;
                f.x += Math.sin(angle) * 1;
                if (f.y > canvas.height) {
                    snowflakes[i] = {
                        x: Math.random() * canvas.width,
                        y: 0,
                        r: f.r,
                        d: f.d
                    };
                }
            }
        };

        let animationFrame: number;
        const animate = () => {
            draw();
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", resize);
            canvas.remove();
        };
    }, []);

    return null;
};

export const SettingsModal = () => {
    const settings = useSettings();
    const [isSnow, setIsSnow] = useState(false);

    return (
        <>
            <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
                <DialogContent>
                    <DialogHeader className="border-b pb-3">
                        <h2 className="text-lg font-medium">Cài đặt</h2>
                    </DialogHeader>

                    {/* --- Giao diện --- */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-y-1">
                            <Label>Giao diện</Label>
                            <span className="text-[0.8rem] text-muted-foreground">
                                Tùy chỉnh giao diện MiNote trên thiết bị của bạn
                            </span>
                        </div>
                        <ModeToggle />
                    </div>

                    {/* --- Hiệu ứng tuyết rơi --- */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col gap-y-1">
                            <Label>Hiệu ứng tuyết rơi</Label>
                            <span className="text-[0.8rem] text-muted-foreground">
                                Bật hiệu ứng tuyết rơi lãng mạn trên màn hình ✨
                            </span>
                        </div>
                        <Switch checked={isSnow} onCheckedChange={setIsSnow} />
                    </div>
                </DialogContent>
            </Dialog>

            {isSnow && <SnowEffect />}
        </>
    );
};
