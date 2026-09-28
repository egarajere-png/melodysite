import { getAllOrdersForAdmin } from "@/lib/supabase/orders-admin";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersForAdmin();
  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Orders</h1>
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
