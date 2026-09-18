import type { Category } from "@/lib/types";

export const categories: Category[] = [
  { slug: "rings", name: "Rings", image: { id: "cat-rings", alt: "Aurum Entonet rings", kind: "editorial", tone: "plum" } },
  { slug: "earrings", name: "Earrings", image: { id: "cat-earrings", alt: "Aurum Entonet earrings", kind: "editorial", tone: "sand" } },
  { slug: "bracelets", name: "Bracelets", image: { id: "cat-bracelets", alt: "Aurum Entonet bracelets", kind: "editorial", tone: "deep" } },
  { slug: "anklets", name: "Anklets", image: { id: "cat-anklets", alt: "Aurum Entonet anklets", kind: "editorial", tone: "obsidian" } },
  { slug: "hair-jewellery", name: "Hair Jewellery", image: { id: "cat-hair", alt: "Aurum Entonet hair jewellery", kind: "editorial", tone: "sand" } },
  { slug: "piercings", name: "Piercings", image: { id: "cat-piercings", alt: "Aurum Entonet piercings", kind: "editorial", tone: "plum" } },
  { slug: "charms", name: "Charms", image: { id: "cat-charms", alt: "Aurum Entonet charms", kind: "editorial", tone: "deep" } },
  { slug: "belly-rings", name: "Belly Rings", image: { id: "cat-belly", alt: "Aurum Entonet belly rings", kind: "editorial", tone: "obsidian" } },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
