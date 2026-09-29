import type { ImageRef, Product } from "./types";

// Pure helpers with no Supabase/server dependency, so both client and server
// components can import them directly without pulling next/headers into a client bundle.

export function effectivePrice(product: Product) {
  return product.salePrice ?? product.price;
}

export function totalStock(product: Product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

/** The image to lead with for a product (or one of its colours): the colour's first
 * image if it has any, else the main image, else the first colour image found. Always
 * returns an ImageRef so callers (cart lines, cards) never deal with "no image". */
export function leadImage(product: Product, colour?: string): ImageRef {
  return (
    (colour ? product.colourImages[colour]?.[0] : undefined) ??
    product.images[0] ??
    Object.values(product.colourImages).find((list) => list.length)?.[0] ?? { id: `${product.id}-none`, alt: product.name }
  );
}

/** Gallery for the product page: the chosen colour's images followed by the
 * colour-independent extras, or the general images when the colour has none. */
export function galleryFor(product: Product, colour?: string): ImageRef[] {
  const colourImages = colour ? (product.colourImages[colour] ?? []) : [];
  const list = colourImages.length ? [...colourImages, ...product.images.slice(1)] : product.images;
  return list.length ? list : [leadImage(product, colour)];
}
