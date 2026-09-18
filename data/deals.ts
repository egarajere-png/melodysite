import type { Deal } from "@/lib/types";

export const deals: Deal[] = [
  {
    id: "deal-aurum-edit-01",
    title: "The Aurum Edit",
    subtitle: "Up to 20% off selected pieces",
    productIds: [
      "p-nia-twist",
      "p-baraka-anklet",
      "p-amka-belly",
      "p-karibu-chain",
      "p-nadra-climber",
      "p-jua-belly",
    ],
    discountPercent: 20,
    startsAt: "2026-09-10",
    endsAt: "2026-09-30",
    active: true,
  },
];

export function getActiveDeal() {
  const now = Date.now();
  return deals.find((d) => d.active && new Date(d.endsAt).getTime() > now);
}
