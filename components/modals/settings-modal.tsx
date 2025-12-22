"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

const SnowEffect = () => {
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.id = "snow-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9999",
        });
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            for (let f of snowflakes) {
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            }
            ctx.fill();
            update();
        };

        let angle = 0;
        const update = () => {
            angle += 0.01;
            for (let f of snowflakes) {
                f.y += Math.pow(f.d, 2) + 1;
                f.x += Math.sin(angle) * 1;
                if (f.y > canvas.height) {
                    f.y = 0;
                    f.x = Math.random() * canvas.width;
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

/* ---------------- RAIN EFFECT ---------------- */
const RainEffect = () => {
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.id = "rain-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9998",
        });
        document.body.appendChild(canvas);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const drops = Array.from({ length: 100 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            l: Math.random() * 15 + 10,
            ys: Math.random() * 10 + 10,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(174,194,224,0.5)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            for (let d of drops) {
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x, d.y + d.l);
            }
            ctx.stroke();
            update();
        };

        const update = () => {
            for (let d of drops) {
                d.y += d.ys;
                if (d.y > canvas.height) {
                    d.y = -20;
                    d.x = Math.random() * canvas.width;
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

/* ---------------- SAKURA EFFECT ---------------- */
const SakuraEffect = () => {
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.id = "sakura-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9997",
        });
        document.body.appendChild(canvas);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const petals = Array.from({ length: 40 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * 2 + 1,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let p of petals) {
                ctx.beginPath();
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                grad.addColorStop(0, "rgba(255, 182, 193, 0.9)");
                grad.addColorStop(1, "rgba(255, 105, 180, 0)");
                ctx.fillStyle = grad;
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            update();
        };

        let angle = 0;
        const update = () => {
            angle += 0.01;
            for (let p of petals) {
                p.y += Math.pow(p.d, 1.5);
                p.x += Math.sin(angle) * 1.2;
                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
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

/* ---------------- SHOOTING STAR EFFECT ---------------- */
const ShootingStarEffect = () => {
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.id = "shooting-star-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9996",
        });
        document.body.appendChild(canvas);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const stars: { x: number; y: number; length: number; speed: number }[] = [];

        const createStar = () => {
            stars.push({
                x: -100,
                y: Math.random() * (canvas.height / 2),
                length: Math.random() * 80 + 50,
                speed: Math.random() * 8 + 4,
            });
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let s of stars) {
                const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.length, s.y + s.length * 0.3);
                grad.addColorStop(0, "rgba(255,255,255,1)");
                grad.addColorStop(1, "rgba(255,255,255,0)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x + s.length, s.y + s.length * 0.3);
                ctx.stroke();
            }
            update();
        };

        const update = () => {
            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                s.x += s.speed;
                s.y += s.speed * 0.3;
                if (s.x - s.length > canvas.width) {
                    stars.splice(i, 1);
                }
            }
            if (Math.random() < 0.03) createStar(); // random tần suất
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

/* ---------------- SETTINGS MODAL ---------------- */
export const SettingsModal = () => {
    const settings = useSettings();
    const [isSnow, setIsSnow] = useState(false);
    const [isRain, setIsRain] = useState(false);
    const [isSakura, setIsSakura] = useState(false);
    const [isStar, setIsStar] = useState(false);

    return (
        <>
            <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
                <DialogContent>
                    <DialogHeader className="border-b pb-3">
                        <h2 className="text-lg font-medium">Tùy chỉnh giao diện</h2>
                    </DialogHeader>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-y-1">
                            <Label>Giao diện</Label>
                            <span className="text-[0.8rem] text-muted-foreground">
                                Tùy chỉnh giao diện MiNote trên thiết bị của bạn
                            </span>
                        </div>
                        <ModeToggle />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between">
                                Hiệu ứng màn hình (Chỉ dành cho chế độ tối)
                                <Settings size={24} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[260px]">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-y-1">
                                        <Label>Hiệu ứng tuyết rơi</Label>
                                        <span className="text-[0.8rem] text-muted-foreground">
                                            Bật hiệu ứng tuyết ❄️
                                        </span>
                                    </div>
                                    <Switch checked={isSnow} onCheckedChange={setIsSnow} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-y-1">
                                        <Label>Hiệu ứng mưa rơi</Label>
                                        <span className="text-[0.8rem] text-muted-foreground">
                                            Bật hiệu ứng mưa 🌧️
                                        </span>
                                    </div>
                                    <Switch checked={isRain} onCheckedChange={setIsRain} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-y-1">
                                        <Label>Hoa anh đào rơi</Label>
                                        <span className="text-[0.8rem] text-muted-foreground">
                                            Hiệu ứng hoa anh đào bay 🌸
                                        </span>
                                    </div>
                                    <Switch checked={isSakura} onCheckedChange={setIsSakura} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-y-1">
                                        <Label>Sao băng rơi</Label>
                                        <span className="text-[0.8rem] text-muted-foreground">
                                            Hiệu ứng sao băng chéo 🌠
                                        </span>
                                    </div>
                                    <Switch checked={isStar} onCheckedChange={setIsStar} />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </DialogContent>
            </Dialog>

            {isSnow && <SnowEffect />}
            {isRain && <RainEffect />}
            {isSakura && <SakuraEffect />}
            {isStar && <ShootingStarEffect />}
        </>
    );
};
