import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Aurum Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-aurum-ivory text-aurum-obsidian">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 sm:py-10">{children}</main>
    </div>
  );
}
