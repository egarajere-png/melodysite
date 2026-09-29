import { getAdminUsers } from "@/lib/supabase/customers-admin";
import { getStaffSession } from "@/lib/supabase/staff-auth";
import { AdminCustomersClient } from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage() {
  const [users, staff] = await Promise.all([getAdminUsers(), getStaffSession()]);
  return <AdminCustomersClient users={users} currentUserId={staff?.id ?? ""} />;
}
