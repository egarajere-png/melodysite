import type { CollectionSummary } from "@/lib/types";

export const collections: CollectionSummary[] = [
  { slug: "new-arrivals", name: "New Arrivals", description: "The latest pieces to join the house." },
  { slug: "best-sellers", name: "Best Sellers", description: "Most loved, worn on repeat." },
  { slug: "earth", name: "Earth", description: "Raw materiality — clay, stone, unfinished metal." },
  { slug: "heritage", name: "Heritage", description: "Contemporary forms rooted in inherited craft." },
  { slug: "aurum-edit", name: "Aurum Edit", description: "Seasonal edit, selected pieces at a considered price." },
];

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}
