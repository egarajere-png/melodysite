// Shared storefront view-model types. These mirror what the Supabase-backed
// repositories in lib/supabase/*.ts return, so UI components stay decoupled from the
// database's own column names/shapes.

export type Money = number; // stored as KES, integer or decimal shillings

/** A category's URL slug. Categories are managed by staff in the admin, so this is any string. */
export type CategorySlug = string;

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
  id: string;
  alt: string;
  kind?: "product" | "worn" | "editorial";
  /** Public URL of the photo (Supabase Storage or /images/...). Without one, <EditorialImage> shows a neutral "image coming soon" surface. */
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
  /** Main image first, then any other colour-independent images. */
  images: ImageRef[];
  /** Shown on hover (product card) and as an extra view on the product page. */
  wornImage?: ImageRef;
  /** Per-colour galleries, keyed by the Colour option value (e.g. "Gold Vermeil"). */
  colourImages: Record<string, ImageRef[]>;
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
