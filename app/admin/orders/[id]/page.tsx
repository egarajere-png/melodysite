import { notFound } from "next/navigation";
import { getOrder } from "@/data/orders";
import { AdminOrderDetail } from "@/components/admin/AdminOrderDetail";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Order {order.id}</h1>
      <AdminOrderDetail order={order} />
    </div>
  );
}
