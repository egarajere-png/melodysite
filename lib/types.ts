// Domain types for Aurum Entonet.
// These mirror what a real API/backend would return, so mock data in /data
// can be swapped for live fetches without touching component code.

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

export interface VariantOption {
  colour?: string;
  size?: string;
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

export type OrderStatus =
  | "Pending Payment"
  | "Payment Received"
  | "Processing"
  | "Ready for Collection"
  | "Dispatched"
  | "Completed"
  | "Cancelled"
  | "Refunded";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  quantity: number;
  unitPrice: Money;
  image: ImageRef;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  fulfilment: "delivery" | "collection";
  address?: string;
  subtotal: Money;
  createdAt: string;
  history: { status: OrderStatus; timestamp: string; note?: string }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpend: Money;
  lastOrderAt?: string;
}

export type InquiryStatus = "New" | "Read" | "In Progress" | "Resolved";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}
