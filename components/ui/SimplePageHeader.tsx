import type { ReactNode } from "react";
import { RevealText } from "@/components/motion/RevealText";

export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum max-w-2xl">
        <RevealText as="h1" text={title} className="mb-8 font-display text-4xl sm:text-5xl" />
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-aurum-obsidian/70">{children}</div>
      </div>
    </div>
  );
}
