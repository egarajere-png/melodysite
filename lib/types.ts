// Shared storefront view-model types. These mirror what the Supabase-backed
// repositories in lib/supabase/*.ts return, so UI components stay decoupled from the
// database's own column names/shapes.

export type Money = number; // stored as KES, integer or decimal shillings

export type CategorySlug =
  | "rings"
  | "earrings"
  | "bracelets"
  | "anklets"
  | "hair-jewellery"
  | "piercings"
  | "charms"
  | "belly-rings";

export interface Category {
  slug: CategorySlug;
  name: string;
  image: ImageRef;
}

export interface CollectionSummary {
  slug: string;
  name: string;
  description?: string;
}

export interface ImageRef {
  /** Abstract image reference — resolved by <EditorialImage> to a placeholder, or a real photo when `url` is set. */
  id: string;
  alt: string;
  kind?: "product" | "worn" | "editorial";
  tone?: "ivory" | "deep" | "plum" | "sand" | "obsidian" | "earth";
  /** Public URL of a real uploaded photo. When present, <EditorialImage> renders this instead of the placeholder. */
  url?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colour?: string;
  size?: string;
  stock: number;
  priceOverride?: Money;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  collections: string[];
  price: Money;
  salePrice?: Money;
  description: string;
  materials: string[];
  careInstructions: string;
  shippingInfo: string;
  returnsInfo: string;
  images: ImageRef[];
  wornImage?: ImageRef;
  variants: ProductVariant[];
  isNew?: boolean;
  isBestseller?: boolean;
  createdAt: string; // ISO date, used to derive "new arrivals"
}

export interface Deal {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}
