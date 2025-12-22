"use client";

import ClickSpark from "@/components/ClickSpark";

export default function ClickSparkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#fff"
      sparkSize={8}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      {children}
    </ClickSpark>
  );
}
