import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt: string | null;
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, orders ( total, created_at )")
    .eq("role", "CUSTOMER")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Email lives in auth.users, not profiles — needs the service-role client.
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    (profiles ?? []).map(async (p) => {
      try {
        const { data } = await admin.auth.admin.getUserById(p.id);
        if (data.user?.email) emails.set(p.id, data.user.email);
      } catch {
        // best-effort — leave email blank for this customer rather than fail the whole list
      }
    })
  );

  return (profiles ?? []).map((p) => {
    const orders = p.orders as unknown as { total: number; created_at: string }[];
    const lastOrder = orders.length ? orders.reduce((latest, o) => (o.created_at > latest ? o.created_at : latest), orders[0].created_at) : null;
    return {
      id: p.id,
      name: p.full_name ?? "—",
      email: emails.get(p.id) ?? null,
      phone: p.phone,
      totalOrders: orders.length,
      totalSpend: orders.reduce((sum, o) => sum + Number(o.total), 0),
      lastOrderAt: lastOrder,
    };
  });
}
