import { createClient } from "@/lib/supabase/server";
import { getAdminProductList } from "@/lib/supabase/products-admin";
import type { OrderStatus } from "@/lib/supabase/database.types";

/**
 * Revenue/profit are recognised for any order that isn't still awaiting payment or
 * cancelled/refunded — mirrors the storefront's own order-status model rather than
 * inventing a separate accounting status.
 */
const REVENUE_STATUSES: OrderStatus[] = ["PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "COMPLETED"];

interface OrderItemRow {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number | null;
  orders: { id: string; status: OrderStatus; created_at: string } | null;
}

async function getRevenueOrderItems(): Promise<OrderItemRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity, unit_price, unit_cost, orders!inner ( id, status, created_at )")
    .in("orders.status", REVENUE_STATUSES);
  if (error) throw error;
  return (data ?? []) as unknown as OrderItemRow[];
}

export async function getDashboardMetrics() {
  const supabase = await createClient();
  const [items, { count: totalOrders }, { count: pendingOrders }, products] = await Promise.all([
    getRevenueOrderItems(),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "PAYMENT_PENDING"),
    getAdminProductList(),
  ]);

  const orderIds = new Set(items.map((i) => i.orders?.id).filter(Boolean));
  const totalRevenue = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const itemsSold = items.reduce((sum, i) => sum + i.quantity, 0);
  const profit = items.reduce((sum, i) => sum + (i.unit_price - (i.unit_cost ?? 0)) * i.quantity, 0);
  const averageOrderValue = orderIds.size ? Math.round(totalRevenue / orderIds.size) : 0;
  const lowStock = products.filter((p) => p.totalStock > 0 && p.totalStock <= 5);
  const outOfStock = products.filter((p) => p.totalStock === 0);

  return {
    totalRevenue,
    totalOrders: totalOrders ?? 0,
    itemsSold,
    profit,
    averageOrderValue,
    pendingOrders: pendingOrders ?? 0,
    lowStock,
    outOfStock,
  };
}

export async function getMonthlySeries() {
  const items = await getRevenueOrderItems();
  const map = new Map<string, { month: string; revenue: number; profit: number; orders: Set<string> }>();

  for (const item of items) {
    if (!item.orders) continue;
    const date = new Date(item.orders.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-KE", { month: "short" });
    const entry = map.get(key) ?? { month: label, revenue: 0, profit: 0, orders: new Set<string>() };
    entry.revenue += item.unit_price * item.quantity;
    entry.profit += (item.unit_price - (item.unit_cost ?? 0)) * item.quantity;
    entry.orders.add(item.orders.id);
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ month: v.month, revenue: v.revenue, profit: v.profit, orders: v.orders.size }));
}

export async function getTopProducts(limit = 5) {
  const items = await getRevenueOrderItems();
  const map = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const item of items) {
    if (!item.product_id) continue;
    const entry = map.get(item.product_id) ?? { name: item.product_name, quantity: 0, revenue: 0 };
    entry.quantity += item.quantity;
    entry.revenue += item.unit_price * item.quantity;
    map.set(item.product_id, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getCategoryPerformance() {
  const supabase = await createClient();
  const [items, { data: categoryLinks }] = await Promise.all([
    getRevenueOrderItems(),
    supabase.from("product_categories").select("product_id, categories ( name )"),
  ]);
  const categoryByProduct = new Map((categoryLinks ?? []).map((l) => [l.product_id, (l.categories as unknown as { name: string } | null)?.name ?? "—"]));

  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.product_id) continue;
    const category = categoryByProduct.get(item.product_id) ?? "—";
    map.set(category, (map.get(category) ?? 0) + item.unit_price * item.quantity);
  }

  return Array.from(map.entries()).map(([category, revenue]) => ({ category, revenue }));
}

export async function getInventoryMovement() {
  const products = await getAdminProductList();
  return products.map((p) => ({ id: p.id, name: p.name, stock: p.totalStock })).sort((a, b) => a.stock - b.stock);
}
