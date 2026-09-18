import type { Order, OrderStatus } from "@/lib/types";
import { products } from "./products";

/**
 * Demo order history for the admin dashboard's analytics and order management views.
 * Entirely mock data — spans a few recent months so charts have something to show.
 * Replace with real order records once the backend is connected.
 */

function itemFor(productId: string, variantId: string, variantLabel: string, quantity: number) {
  const product = products.find((p) => p.id === productId)!;
  return {
    productId,
    variantId,
    name: product.name,
    variantLabel,
    quantity,
    unitPrice: product.salePrice ?? product.price,
    image: product.images[0],
  };
}

function historyFor(status: OrderStatus, createdAt: string): Order["history"] {
  const start = new Date(createdAt).getTime();
  const day = 86_400_000;
  const full: { status: OrderStatus; offset: number }[] = [
    { status: "Pending Payment", offset: 0 },
    { status: "Payment Received", offset: 0.02 * day },
    { status: "Processing", offset: 1 * day },
    { status: "Dispatched", offset: 3 * day },
    { status: "Completed", offset: 6 * day },
  ];
  const order: OrderStatus[] = ["Pending Payment", "Payment Received", "Processing", "Dispatched", "Ready for Collection", "Completed"];
  const idx = order.indexOf(status);
  if (status === "Cancelled" || status === "Refunded") {
    return [
      { status: "Pending Payment", timestamp: new Date(start).toISOString() },
      { status, timestamp: new Date(start + day).toISOString() },
    ];
  }
  return full
    .filter((s) => order.indexOf(s.status) <= idx)
    .map((s) => ({ status: s.status, timestamp: new Date(start + s.offset).toISOString() }));
}

export const orders: Order[] = [
  {
    id: "AE-10231",
    customerName: "Wanjiru Kamau",
    customerEmail: "wanjiru.k@example.com",
    fulfilment: "delivery",
    address: "Kilimani, Nairobi",
    subtotal: 12800,
    createdAt: "2026-09-10T09:12:00Z",
    status: "Dispatched",
    items: [itemFor("p-sable-cuff", "v-sable-os", "Adjustable", 1), itemFor("p-nyota-stud", "v-nyota-gold", "Gold Vermeil", 1)],
    history: [
      { status: "Pending Payment", timestamp: "2026-09-10T09:12:00Z" },
      { status: "Payment Received", timestamp: "2026-09-10T09:14:00Z" },
      { status: "Processing", timestamp: "2026-09-11T10:00:00Z" },
      { status: "Dispatched", timestamp: "2026-09-13T08:30:00Z", note: "Sent via G4S Nairobi" },
    ],
  },
  {
    id: "AE-10230",
    customerName: "Brian Otieno",
    customerEmail: "brian.otieno@example.com",
    fulfilment: "collection",
    subtotal: 6800,
    createdAt: "2026-09-08T14:40:00Z",
    status: "Ready for Collection",
    items: [itemFor("p-imara-signet", "v-imara-m", "Size M", 1)],
    history: [
      { status: "Pending Payment", timestamp: "2026-09-08T14:40:00Z" },
      { status: "Payment Received", timestamp: "2026-09-08T14:42:00Z" },
      { status: "Processing", timestamp: "2026-09-09T09:00:00Z" },
      { status: "Ready for Collection", timestamp: "2026-09-10T11:00:00Z", note: "Available at Kilimani studio" },
    ],
  },
  {
    id: "AE-10229",
    customerName: "Amina Yusuf",
    customerEmail: "amina.yusuf@example.com",
    fulfilment: "delivery",
    address: "Nyali, Mombasa",
    subtotal: 4200,
    createdAt: "2026-09-05T18:05:00Z",
    status: "Pending Payment",
    items: [itemFor("p-nadra-climber", "v-nadra-os", "One Size", 1)],
    history: [{ status: "Pending Payment", timestamp: "2026-09-05T18:05:00Z" }],
  },
  {
    id: "AE-10228",
    customerName: "David Mwangi",
    customerEmail: "david.mwangi@example.com",
    fulfilment: "delivery",
    address: "Milimani, Kisumu",
    subtotal: 11200,
    createdAt: "2026-08-28T11:00:00Z",
    status: "Completed",
    items: [itemFor("p-tembo-link", "v-tembo-os", "Adjustable", 1)],
    history: historyFor("Completed", "2026-08-28T11:00:00Z"),
  },
  {
    id: "AE-10227",
    customerName: "Grace Njeri",
    customerEmail: "grace.njeri@example.com",
    fulfilment: "collection",
    subtotal: 5400,
    createdAt: "2026-08-22T09:30:00Z",
    status: "Completed",
    items: [itemFor("p-taji-cuff", "v-taji-s", "Small", 1)],
    history: historyFor("Completed", "2026-08-22T09:30:00Z"),
  },
  {
    id: "AE-10226",
    customerName: "Fatuma Ali",
    customerEmail: "fatuma.ali@example.com",
    fulfilment: "delivery",
    address: "Nyali, Mombasa",
    subtotal: 5200,
    createdAt: "2026-08-15T16:20:00Z",
    status: "Cancelled",
    items: [itemFor("p-moyo-charm", "v-moyo-gold", "Gold Vermeil", 2)],
    history: historyFor("Cancelled", "2026-08-15T16:20:00Z"),
  },
  {
    id: "AE-10225",
    customerName: "Wanjiru Kamau",
    customerEmail: "wanjiru.k@example.com",
    fulfilment: "delivery",
    address: "Kilimani, Nairobi",
    subtotal: 9600,
    createdAt: "2026-08-05T10:00:00Z",
    status: "Completed",
    items: [itemFor("p-sable-cuff", "v-sable-os", "Adjustable", 1)],
    history: historyFor("Completed", "2026-08-05T10:00:00Z"),
  },
  {
    id: "AE-10224",
    customerName: "Peter Kariuki",
    customerEmail: "peter.kariuki@example.com",
    fulfilment: "collection",
    subtotal: 1800,
    createdAt: "2026-07-30T13:10:00Z",
    status: "Completed",
    items: [itemFor("p-cheche-stud", "v-cheche-os", "One Size", 1)],
    history: historyFor("Completed", "2026-07-30T13:10:00Z"),
  },
  {
    id: "AE-10223",
    customerName: "Brian Otieno",
    customerEmail: "brian.otieno@example.com",
    fulfilment: "delivery",
    address: "Milimani, Kisumu",
    subtotal: 7600,
    createdAt: "2026-07-18T08:45:00Z",
    status: "Refunded",
    items: [itemFor("p-adia-stack", "v-adia-m", "Size M", 2)],
    history: historyFor("Refunded", "2026-07-18T08:45:00Z"),
  },
  {
    id: "AE-10222",
    customerName: "Amina Yusuf",
    customerEmail: "amina.yusuf@example.com",
    fulfilment: "delivery",
    address: "Nyali, Mombasa",
    subtotal: 8400,
    createdAt: "2026-07-02T15:30:00Z",
    status: "Completed",
    items: [itemFor("p-sauti-drop", "v-sauti-os", "One Size", 1)],
    history: historyFor("Completed", "2026-07-02T15:30:00Z"),
  },
  {
    id: "AE-10221",
    customerName: "Grace Njeri",
    customerEmail: "grace.njeri@example.com",
    fulfilment: "collection",
    subtotal: 4200,
    createdAt: "2026-06-20T12:00:00Z",
    status: "Completed",
    items: [itemFor("p-nia-twist", "v-nia-silver-m", "Silver / M", 1)],
    history: historyFor("Completed", "2026-06-20T12:00:00Z"),
  },
  {
    id: "AE-10220",
    customerName: "David Mwangi",
    customerEmail: "david.mwangi@example.com",
    fulfilment: "delivery",
    address: "Milimani, Kisumu",
    subtotal: 9400,
    createdAt: "2026-06-08T09:00:00Z",
    status: "Completed",
    items: [itemFor("p-zuri-hoop", "v-zuri-os", "One Size", 1), itemFor("p-rafiki-charm", "v-rafiki-os", "One Size", 1)],
    history: historyFor("Completed", "2026-06-08T09:00:00Z"),
  },
];

export function getOrder(id: string) {
  return orders.find((o) => o.id === id);
}
