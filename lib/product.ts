import type { Product } from "./types";

// Pure helpers with no Supabase/server dependency, so both client and server
// components can import them directly without pulling next/headers into a client bundle.

export function effectivePrice(product: Product) {
  return product.salePrice ?? product.price;
}

export function totalStock(product: Product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}
