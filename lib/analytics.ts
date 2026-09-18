import { orders } from "@/data/orders";
import { products, getCostPrice, totalStock } from "@/data/products";
import type { OrderStatus } from "@/lib/types";

const REVENUE_STATUSES: OrderStatus[] = ["Payment Received", "Processing", "Ready for Collection", "Dispatched", "Completed"];

export function getRevenueOrders() {
  return orders.filter((o) => REVENUE_STATUSES.includes(o.status));
}

function productCost(productId: string) {
  const product = products.find((p) => p.id === productId);
  return product ? getCostPrice(product) : 0;
}

export function getDashboardMetrics() {
  const revenueOrders = getRevenueOrders();
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const itemsSold = revenueOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const profit = revenueOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + (i.unitPrice - productCost(i.productId)) * i.quantity, 0),
    0
  );
  const averageOrderValue = revenueOrders.length ? Math.round(totalRevenue / revenueOrders.length) : 0;
  const pendingOrders = orders.filter((o) => o.status === "Pending Payment").length;
  const lowStock = products.filter((p) => totalStock(p) > 0 && totalStock(p) <= 5);
  const outOfStock = products.filter((p) => totalStock(p) === 0);

  return {
    totalRevenue,
    totalOrders: orders.length,
    itemsSold,
    profit,
    averageOrderValue,
    pendingOrders,
    lowStock,
    outOfStock,
  };
}

export function getMonthlySeries() {
  const revenueOrders = getRevenueOrders();
  const map = new Map<string, { month: string; revenue: number; profit: number; orders: number }>();

  for (const order of revenueOrders) {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-KE", { month: "short" });
    const entry = map.get(key) ?? { month: label, revenue: 0, profit: 0, orders: 0 };
    entry.revenue += order.subtotal;
    entry.profit += order.items.reduce((s, i) => s + (i.unitPrice - productCost(i.productId)) * i.quantity, 0);
    entry.orders += 1;
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

export function getTopProducts(limit = 5) {
  const revenueOrders = getRevenueOrders();
  const map = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of revenueOrders) {
    for (const item of order.items) {
      const entry = map.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.unitPrice * item.quantity;
      map.set(item.productId, entry);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function getCategoryPerformance() {
  const revenueOrders = getRevenueOrders();
  const map = new Map<string, number>();

  for (const order of revenueOrders) {
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      map.set(product.category, (map.get(product.category) ?? 0) + item.unitPrice * item.quantity);
    }
  }

  return Array.from(map.entries()).map(([category, revenue]) => ({ category, revenue }));
}

export function getInventoryMovement() {
  return products
    .map((p) => ({ name: p.name, stock: totalStock(p) }))
    .sort((a, b) => a.stock - b.stock);
}
