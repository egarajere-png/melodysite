import type { Customer } from "@/lib/types";

export const customers: Customer[] = [
  {
    id: "c-1",
    name: "Wanjiru Kamau",
    email: "wanjiru.k@example.com",
    phone: "+254 712 000 111",
    totalOrders: 4,
    totalSpend: 38200,
    lastOrderAt: "2026-09-10T09:12:00Z",
  },
  {
    id: "c-2",
    name: "Brian Otieno",
    email: "brian.otieno@example.com",
    phone: "+254 733 222 444",
    totalOrders: 2,
    totalSpend: 14300,
    lastOrderAt: "2026-09-08T14:40:00Z",
  },
  {
    id: "c-3",
    name: "Amina Yusuf",
    email: "amina.yusuf@example.com",
    totalOrders: 1,
    totalSpend: 4200,
    lastOrderAt: "2026-09-05T18:05:00Z",
  },
];
