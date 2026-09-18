import type { Product } from "@/lib/types";

function img(id: string, alt: string, tone: Product["images"][number]["tone"] = "sand") {
  return { id, alt, kind: "product" as const, tone };
}

function worn(id: string, alt: string, tone: Product["images"][number]["tone"] = "plum") {
  return { id, alt, kind: "worn" as const, tone };
}

export const products: Product[] = [
  {
    id: "p-imara-signet",
    slug: "imara-signet-ring",
    name: "Imara Signet Ring",
    category: "rings",
    collections: ["heritage"],
    price: 6800,
    description:
      "A weighted signet with a hand-brushed face, cast in small batches. Imara — meaning 'strong' — anchors the hand with quiet permanence.",
    materials: ["18k gold vermeil over recycled brass", "Hand-brushed finish"],
    careInstructions: "Keep dry, store flat in the provided pouch, polish with a soft cloth only.",
    shippingInfo: "Made to order — ships within 5–7 working days across Kenya, 10–14 days internationally.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-imara-1", "Imara Signet Ring, front", "plum"), img("p-imara-2", "Imara Signet Ring, detail", "sand")],
    wornImage: worn("p-imara-worn", "Imara Signet Ring worn on hand"),
    variants: [
      { id: "v-imara-s", sku: "IMR-S", size: "S", stock: 4 },
      { id: "v-imara-m", sku: "IMR-M", size: "M", stock: 6 },
      { id: "v-imara-l", sku: "IMR-L", size: "L", stock: 0 },
    ],
    isBestseller: true,
    createdAt: "2026-06-01",
  },
  {
    id: "p-nia-twist",
    slug: "nia-twist-ring",
    name: "Nia Twist Ring",
    category: "rings",
    collections: ["aurum-edit"],
    price: 5200,
    salePrice: 4200,
    description: "A soft twist band with an off-centre gleam — Nia, 'purpose', made to be stacked or worn alone.",
    materials: ["Sterling silver", "Gold vermeil option"],
    careInstructions: "Avoid contact with perfume and chlorine. Store separately to prevent scratching.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-nia-1", "Nia Twist Ring, front", "sand"), img("p-nia-2", "Nia Twist Ring, angle", "ivory")],
    variants: [
      { id: "v-nia-silver-s", sku: "NIA-SIL-S", colour: "Silver", size: "S", stock: 3 },
      { id: "v-nia-silver-m", sku: "NIA-SIL-M", colour: "Silver", size: "M", stock: 5 },
      { id: "v-nia-gold-s", sku: "NIA-GLD-S", colour: "Gold Vermeil", size: "S", stock: 2 },
      { id: "v-nia-gold-m", sku: "NIA-GLD-M", colour: "Gold Vermeil", size: "M", stock: 0 },
    ],
    createdAt: "2026-05-12",
  },
  {
    id: "p-adia-stack",
    slug: "adia-stacking-ring",
    name: "Adia Stacking Ring",
    category: "rings",
    collections: ["best-sellers"],
    price: 3800,
    description: "A fine stacking band, sold individually — Adia, 'gift', designed to layer across the hand in threes.",
    materials: ["Gold vermeil over recycled brass"],
    careInstructions: "Remove before washing hands or applying lotion.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-adia-1", "Adia Stacking Ring", "plum")],
    variants: [
      { id: "v-adia-s", sku: "ADI-S", size: "S", stock: 8 },
      { id: "v-adia-m", sku: "ADI-M", size: "M", stock: 8 },
      { id: "v-adia-l", sku: "ADI-L", size: "L", stock: 3 },
    ],
    isBestseller: true,
    createdAt: "2026-03-20",
  },
  {
    id: "p-zuri-hoop",
    slug: "zuri-hoop-earrings",
    name: "Zuri Hoop Earrings",
    category: "earrings",
    collections: ["heritage"],
    price: 7200,
    description: "Sculptural hoops with a hand-hammered texture that catches the light as it moves — Zuri, 'beautiful'.",
    materials: ["18k gold vermeil", "Hypoallergenic posts"],
    careInstructions: "Store flat to preserve shape. Keep away from moisture.",
    shippingInfo: "Ships within 5–7 working days across Kenya, 10–14 days internationally.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-zuri-1", "Zuri Hoop Earrings", "sand"), img("p-zuri-2", "Zuri Hoop Earrings, detail", "deep")],
    wornImage: worn("p-zuri-worn", "Zuri Hoop Earrings worn"),
    variants: [{ id: "v-zuri-os", sku: "ZUR-OS", size: "One Size", stock: 12 }],
    createdAt: "2026-04-02",
  },
  {
    id: "p-sauti-drop",
    slug: "sauti-drop-earrings",
    name: "Sauti Drop Earrings",
    category: "earrings",
    collections: ["best-sellers"],
    price: 8400,
    description: "Elongated drops that move with the wearer — Sauti, 'voice', for pieces meant to be noticed.",
    materials: ["Gold vermeil", "Freshwater pearl accent"],
    careInstructions: "Avoid direct perfume contact. Wipe with a soft, dry cloth after wear.",
    shippingInfo: "Made to order — ships within 5–7 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-sauti-1", "Sauti Drop Earrings", "obsidian"), img("p-sauti-2", "Sauti Drop Earrings, worn detail", "plum")],
    wornImage: worn("p-sauti-worn", "Sauti Drop Earrings worn"),
    variants: [{ id: "v-sauti-os", sku: "SAU-OS", size: "One Size", stock: 6 }],
    isBestseller: true,
    createdAt: "2026-02-14",
  },
  {
    id: "p-nyota-stud",
    slug: "nyota-stud-earrings",
    name: "Nyota Stud Earrings",
    category: "earrings",
    collections: ["new-arrivals"],
    price: 3200,
    description: "A small, faceted stud for everyday wear — Nyota, 'star', for the pieces you never take off.",
    materials: ["Sterling silver", "Gold vermeil option"],
    careInstructions: "Safe for daily wear. Remove before swimming.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-nyota-1", "Nyota Stud Earrings", "ivory")],
    variants: [
      { id: "v-nyota-silver", sku: "NYO-SIL", colour: "Silver", stock: 10 },
      { id: "v-nyota-gold", sku: "NYO-GLD", colour: "Gold Vermeil", stock: 10 },
    ],
    isNew: true,
    createdAt: "2026-08-20",
  },
  {
    id: "p-sable-cuff",
    slug: "sable-cuff-bracelet",
    name: "Sable Cuff Bracelet",
    category: "bracelets",
    collections: ["best-sellers", "heritage"],
    price: 9600,
    description: "An open cuff with a matte-brushed surface, weighted to sit close to the wrist — an heirloom in the making.",
    materials: ["Brass, gold vermeil finish"],
    careInstructions: "Gently reshape by hand if needed. Store in the provided pouch.",
    shippingInfo: "Ships within 5–7 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-sable-1", "Sable Cuff Bracelet", "deep"), img("p-sable-2", "Sable Cuff Bracelet, worn", "sand")],
    wornImage: worn("p-sable-worn", "Sable Cuff Bracelet worn"),
    variants: [{ id: "v-sable-os", sku: "SAB-OS", size: "Adjustable", stock: 5 }],
    isBestseller: true,
    createdAt: "2026-01-18",
  },
  {
    id: "p-karibu-chain",
    slug: "karibu-chain-bracelet",
    name: "Karibu Chain Bracelet",
    category: "bracelets",
    collections: ["aurum-edit"],
    price: 6400,
    description: "A substantial curb chain with a easy clasp — Karibu, 'welcome', an everyday companion piece.",
    materials: ["Sterling silver", "Gold vermeil option"],
    careInstructions: "Clean with a polishing cloth. Avoid chlorinated water.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-karibu-1", "Karibu Chain Bracelet", "sand")],
    variants: [
      { id: "v-karibu-silver", sku: "KAR-SIL", colour: "Silver", size: "Adjustable", stock: 7 },
      { id: "v-karibu-gold", sku: "KAR-GLD", colour: "Gold Vermeil", size: "Adjustable", stock: 4 },
    ],
    createdAt: "2026-05-30",
  },
  {
    id: "p-tembo-link",
    slug: "tembo-link-bracelet",
    name: "Tembo Link Bracelet",
    category: "bracelets",
    collections: ["new-arrivals"],
    price: 11200,
    description: "Bold, rounded links inspired by the weight and calm of Tembo — 'elephant'. A statement piece for one wrist.",
    materials: ["18k gold vermeil over recycled brass"],
    careInstructions: "Store separately to avoid scratching. Keep dry.",
    shippingInfo: "Made to order — ships within 7–10 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-tembo-1", "Tembo Link Bracelet", "plum"), img("p-tembo-2", "Tembo Link Bracelet, detail", "obsidian")],
    wornImage: worn("p-tembo-worn", "Tembo Link Bracelet worn"),
    variants: [{ id: "v-tembo-os", sku: "TEM-OS", size: "Adjustable", stock: 3 }],
    isNew: true,
    createdAt: "2026-09-01",
  },
  {
    id: "p-baraka-anklet",
    slug: "baraka-anklet",
    name: "Baraka Anklet",
    category: "anklets",
    collections: ["aurum-edit"],
    price: 4800,
    salePrice: 3800,
    description: "A fine chain anklet with a single charm drop — Baraka, 'blessing', worn low and easy.",
    materials: ["Sterling silver", "Gold vermeil option"],
    careInstructions: "Remove before swimming or bathing.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-baraka-1", "Baraka Anklet", "sand")],
    variants: [
      { id: "v-baraka-silver", sku: "BAR-SIL", colour: "Silver", size: "Adjustable", stock: 6 },
      { id: "v-baraka-gold", sku: "BAR-GLD", colour: "Gold Vermeil", size: "Adjustable", stock: 0 },
    ],
    createdAt: "2026-04-22",
  },
  {
    id: "p-wimbo-beaded",
    slug: "wimbo-beaded-anklet",
    name: "Wimbo Beaded Anklet",
    category: "anklets",
    collections: ["earth"],
    price: 3600,
    description: "Hand-strung beadwork in earthen tones, finished with a brass clasp — Wimbo, 'melody'.",
    materials: ["Recycled glass beads", "Brass clasp"],
    careInstructions: "Keep dry. Avoid pulling on the beadwork.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-wimbo-1", "Wimbo Beaded Anklet", "earth")],
    variants: [{ id: "v-wimbo-os", sku: "WIM-OS", size: "Adjustable", stock: 9 }],
    createdAt: "2026-03-05",
  },
  {
    id: "p-taji-cuff",
    slug: "taji-hair-cuff",
    name: "Taji Hair Cuff",
    category: "hair-jewellery",
    collections: ["new-arrivals"],
    price: 5400,
    description: "A sculptural cuff for locs or braids — Taji, 'crown', slides on and holds with a soft inner grip.",
    materials: ["Gold vermeil over brass"],
    careInstructions: "Wipe clean with a dry cloth. Avoid excessive bending.",
    shippingInfo: "Made to order — ships within 5–7 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-taji-1", "Taji Hair Cuff", "plum"), img("p-taji-2", "Taji Hair Cuff worn", "deep")],
    wornImage: worn("p-taji-worn", "Taji Hair Cuff worn in braids"),
    variants: [
      { id: "v-taji-s", sku: "TAJ-S", size: "Small", stock: 4 },
      { id: "v-taji-l", sku: "TAJ-L", size: "Large", stock: 4 },
    ],
    isNew: true,
    createdAt: "2026-08-10",
  },
  {
    id: "p-kilele-pins",
    slug: "kilele-hair-pin-set",
    name: "Kilele Hair Pin Set",
    category: "hair-jewellery",
    collections: ["heritage"],
    price: 2800,
    description: "A set of three sculpted pins — Kilele, 'peak' — for styling locs, braids or an updo.",
    materials: ["Gold vermeil over brass"],
    careInstructions: "Store in the provided pouch to prevent bending.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-kilele-1", "Kilele Hair Pin Set", "sand")],
    variants: [{ id: "v-kilele-os", sku: "KIL-OS", size: "Set of 3", stock: 11 }],
    createdAt: "2026-02-28",
  },
  {
    id: "p-nadra-climber",
    slug: "nadra-ear-climber",
    name: "Nadra Ear Climber",
    category: "piercings",
    collections: ["aurum-edit"],
    price: 4200,
    description: "A single fitted climber that traces the ear's edge — Nadra, 'rare'.",
    materials: ["Sterling silver", "Surgical steel post"],
    careInstructions: "Hypoallergenic. Clean piercing site as advised by your piercer.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Final sale on pierced jewellery for hygiene reasons, unless faulty.",
    images: [img("p-nadra-1", "Nadra Ear Climber", "obsidian")],
    variants: [{ id: "v-nadra-os", sku: "NAD-OS", size: "One Size", stock: 5 }],
    createdAt: "2026-06-15",
  },
  {
    id: "p-cheche-stud",
    slug: "cheche-nose-stud",
    name: "Cheche Nose Stud",
    category: "piercings",
    collections: ["best-sellers"],
    price: 1800,
    description: "A minute, faceted stud for a healed piercing — Cheche, 'spark'.",
    materials: ["Surgical steel", "Gold vermeil finish"],
    careInstructions: "Hypoallergenic. Clean piercing site as advised by your piercer.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Final sale on pierced jewellery for hygiene reasons, unless faulty.",
    images: [img("p-cheche-1", "Cheche Nose Stud", "sand")],
    variants: [{ id: "v-cheche-os", sku: "CHE-OS", size: "One Size", stock: 14 }],
    isBestseller: true,
    createdAt: "2025-11-30",
  },
  {
    id: "p-rafiki-charm",
    slug: "rafiki-charm",
    name: "Rafiki Charm",
    category: "charms",
    collections: ["heritage"],
    price: 2200,
    description: "A single clip-on charm designed to build a personal story onto any chain — Rafiki, 'friend'.",
    materials: ["Gold vermeil over brass"],
    careInstructions: "Wipe clean with a dry cloth.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-rafiki-1", "Rafiki Charm", "plum")],
    variants: [{ id: "v-rafiki-os", sku: "RAF-OS", size: "One Size", stock: 20 }],
    createdAt: "2026-01-05",
  },
  {
    id: "p-moyo-charm",
    slug: "moyo-heart-charm",
    name: "Moyo Heart Charm",
    category: "charms",
    collections: ["new-arrivals"],
    price: 2600,
    description: "A softly rounded heart charm — Moyo, 'heart' — for layering onto bracelets or chains.",
    materials: ["Sterling silver", "Gold vermeil option"],
    careInstructions: "Wipe clean with a dry cloth.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Exchanges accepted within 14 days for unworn pieces in original packaging.",
    images: [img("p-moyo-1", "Moyo Heart Charm", "ivory")],
    variants: [
      { id: "v-moyo-silver", sku: "MOY-SIL", colour: "Silver", stock: 9 },
      { id: "v-moyo-gold", sku: "MOY-GLD", colour: "Gold Vermeil", stock: 9 },
    ],
    isNew: true,
    createdAt: "2026-08-28",
  },
  {
    id: "p-jua-belly",
    slug: "jua-belly-ring",
    name: "Jua Belly Ring",
    category: "belly-rings",
    collections: ["aurum-edit"],
    price: 3400,
    description: "A curved bar with a single sun-cut charm — Jua, 'sun'.",
    materials: ["Surgical steel", "Gold vermeil finish"],
    careInstructions: "Hypoallergenic. Clean piercing site as advised by your piercer.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Final sale on pierced jewellery for hygiene reasons, unless faulty.",
    images: [img("p-jua-1", "Jua Belly Ring", "sand")],
    variants: [{ id: "v-jua-os", sku: "JUA-OS", size: "One Size", stock: 7 }],
    createdAt: "2026-05-08",
  },
  {
    id: "p-amka-belly",
    slug: "amka-belly-chain",
    name: "Amka Belly Chain",
    category: "belly-rings",
    collections: ["aurum-edit"],
    price: 5800,
    salePrice: 4600,
    description: "A body chain that drapes across the waist — Amka, 'awaken' — worn over or under clothing.",
    materials: ["Gold vermeil over brass"],
    careInstructions: "Keep dry. Unclasp gently to remove.",
    shippingInfo: "Ships within 3–5 working days across Kenya.",
    returnsInfo: "Final sale on body jewellery for hygiene reasons, unless faulty.",
    images: [img("p-amka-1", "Amka Belly Chain", "deep")],
    variants: [{ id: "v-amka-os", sku: "AMK-OS", size: "Adjustable", stock: 4 }],
    createdAt: "2026-07-19",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string) {
  return products.filter((p) => p.category === category);
}

export function getProductsByCollection(collectionSlug: string) {
  return products.filter((p) => p.collections.includes(collectionSlug));
}

export function getNewArrivals(limit = 8) {
  return [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getBestsellers(limit = 8) {
  return products.filter((p) => p.isBestseller).slice(0, limit);
}

export function effectivePrice(product: Product) {
  return product.salePrice ?? product.price;
}

/**
 * Mock cost price, since no real cost-accounting backend exists yet.
 * Admin surfaces this as an editable field — replace with a real recorded
 * cost price per product/variant once inventory accounting is connected.
 */
export function getCostPrice(product: Product) {
  return Math.round(product.price * 0.55);
}

export function getProfit(product: Product, quantity = 1) {
  return (effectivePrice(product) - getCostPrice(product)) * quantity;
}

export function totalStock(product: Product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}
