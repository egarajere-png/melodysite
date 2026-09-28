"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Tag,
  BarChart3,
  Users,
  Mail,
  ArrowLeft,
  Receipt,
  History,
  FileText,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/collections", label: "Collections", icon: Layers },
  { href: "/admin/deals", label: "Deals", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inquiries", label: "Inquiries", icon: Mail },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/audit-logs", label: "Audit Log", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // A full navigation, not router.push — verified via testing that router.push
    // right after an auth state change can outrun the session cookie being cleared,
    // so the very next request still reads the old session.
    window.location.href = "/admin/login";
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between bg-aurum-obsidian text-aurum-ivory">
      <div>
        <div className="border-b border-aurum-ivory/10 px-6 py-6">
          <p className="font-display text-lg tracking-widest">AURUM</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-aurum-ivory/40">Admin</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-aurum-ivory/10 text-aurum-ivory" : "text-aurum-ivory/60 hover:bg-aurum-ivory/5 hover:text-aurum-ivory"
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-aurum-ivory/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-aurum-ivory/60 transition-colors hover:bg-aurum-ivory/5 hover:text-aurum-ivory"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          View Store
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-aurum-ivory/60 transition-colors hover:bg-aurum-ivory/5 hover:text-aurum-ivory"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
