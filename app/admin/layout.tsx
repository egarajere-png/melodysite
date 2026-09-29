import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Aurum Admin" },
  robots: { index: false, follow: false },
};

// Deliberately chrome-free: /admin/login renders straight into this, so a signed-out
// visitor only ever sees the sign-in form. The sidebar lives in (panel)/layout.tsx,
// which wraps every page that sits behind the middleware's staff check.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-aurum-ivory text-aurum-obsidian">{children}</div>;
}
