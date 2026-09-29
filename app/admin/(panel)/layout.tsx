import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { getStaffSession } from "@/lib/supabase/staff-auth";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <AdminSidebar staff={staff} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 sm:py-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
