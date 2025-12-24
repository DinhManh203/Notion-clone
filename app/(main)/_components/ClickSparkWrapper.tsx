"use client";

import ClickSpark from "@/components/ClickSpark";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ClickSparkWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentColor, setCurrentColor] = useState("#fff");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && resolvedTheme) {
      const newColor = resolvedTheme === "dark" ? "#000" : "#fff";
      setCurrentColor(newColor);
      console.log("Theme changed to:", resolvedTheme, "Color:", newColor);
    }
  }, [mounted, resolvedTheme]);

  return (
    <ClickSpark
      sparkColor={currentColor}
      sparkSize={8}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      {children}
    </ClickSpark>
  );
}
