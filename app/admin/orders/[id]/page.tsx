import { notFound } from "next/navigation";
import { getOrderForAdmin } from "@/lib/supabase/orders-admin";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderForAdmin(id.toUpperCase());
  if (!order) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Order {order.orderNumber}</h1>
      <AdminOrderDetail order={order} />
    </div>
  );
}
