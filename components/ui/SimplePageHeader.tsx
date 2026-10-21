import type { ReactNode } from "react";
import { RevealText } from "@/components/motion/RevealText";

export function SimplePage({ title, updated, children }: { title: string; /** e.g. "21 October 2026" — shown under the title on policy pages. */ updated?: string; children: ReactNode }) {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum max-w-2xl">
        <RevealText as="h1" text={title} className="mb-3 font-display text-4xl sm:text-5xl" />
        {updated && <p className="mb-8 text-xs uppercase tracking-widest text-aurum-obsidian/55">Last updated {updated}</p>}
        <div className={`flex flex-col gap-4 text-sm leading-relaxed text-aurum-obsidian/75 ${updated ? "" : "mt-5"}`}>{children}</div>
      </div>
    </div>
  );
}

/** A titled part of a policy page. */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 flex flex-col gap-3 first:mt-0">
      <h2 className="font-display text-2xl text-aurum-obsidian">{title}</h2>
      {children}
    </section>
  );
}
