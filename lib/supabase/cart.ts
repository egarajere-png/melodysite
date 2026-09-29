import { createClient } from "@/lib/supabase/server";
import { getActiveDeal } from "@/lib/supabase/catalogue";
import type { CartLine } from "@/context/CartContext";
import type { ImageRef } from "@/lib/types";
import { storedImageRef } from "@/lib/product-media";

/**
 * Server-side cart operations. Every mutation re-derives price and available stock
 * from product_variants/inventory itself — quantity and price sent by a client are
 * never trusted. RLS ("own cart"/"own cart items") already restricts every query here
 * to the calling user's own cart, so this uses the normal cookie-based client, not the
 * service-role one.
 */

const VARIANT_SELECT = `
  id, sku, price,
  inventory ( quantity_on_hand, quantity_reserved ),
  products ( id, slug, name, base_price ),
  variant_option_values ( product_option_values ( value, product_options ( name ) ) )
`;

type RawVariantRow = {
  id: string;
  sku: string;
  price: number | null;
  inventory: { quantity_on_hand: number; quantity_reserved: number } | null;
  products: { id: string; slug: string; name: string; base_price: number } | null;
  variant_option_values: { product_option_values: { value: string; product_options: { name: string } | null } | null }[];
};

function variantLabel(v: RawVariantRow): string {
  const colour = v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Colour")
    ?.product_option_values?.value;
  const size = v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Size")
    ?.product_option_values?.value;
  return [colour, size].filter(Boolean).join(" / ") || "One Size";
}

/** The bag shows the image of the colour actually chosen: that colour's first image
 * if it has one, otherwise the product's main image. */
async function lineImage(productId: string, colour: string | undefined, name: string): Promise<ImageRef> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_media")
    .select("id, storage_path, alt_text, media_kind, is_primary, sort_order, variant_id, product_variants ( variant_option_values ( product_option_values ( value, product_options ( name ) ) ) )")
    .eq("product_id", productId)
    .neq("media_kind", "WORN")
    .order("is_primary", { ascending: false })
    .order("sort_order");
  const rows = (data ?? []) as unknown as {
    id: string;
    storage_path: string;
    alt_text: string | null;
    variant_id: string | null;
    product_variants: { variant_option_values: RawVariantRow["variant_option_values"] } | null;
  }[];
  const colourOf = (r: (typeof rows)[number]) =>
    r.product_variants?.variant_option_values.find((v) => v.product_option_values?.product_options?.name === "Colour")?.product_option_values?.value;
  const match = (colour && rows.find((r) => r.variant_id && colourOf(r) === colour)) || rows.find((r) => !r.variant_id) || rows[0];
  if (!match) return { id: productId, alt: name, kind: "product" };
  return storedImageRef(match.id, match.storage_path, match.alt_text || name);
}

async function effectiveUnitPrice(variant: RawVariantRow): Promise<number> {
  if (variant.price != null) return variant.price;
  const basePrice = variant.products?.base_price ?? 0;
  const deal = await getActiveDeal();
  if (deal && variant.products && deal.productIds.includes(variant.products.id)) {
    return Math.round(basePrice * (1 - deal.discountPercent / 100));
  }
  return basePrice;
}

function availableStock(variant: RawVariantRow): number {
  return Math.max(0, (variant.inventory?.quantity_on_hand ?? 0) - (variant.inventory?.quantity_reserved ?? 0));
}

async function getOrCreateCartId(customerId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("carts").select("id").eq("customer_id", customerId).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("carts").insert({ customer_id: customerId }).select("id").single();
  if (error) throw error;
  return created.id;
}

async function toCartLine(variant: RawVariantRow, quantity: number): Promise<CartLine | null> {
  if (!variant.products) return null;
  return {
    productId: variant.products.id,
    productSlug: variant.products.slug,
    variantId: variant.id,
    sku: variant.sku,
    name: variant.products.name,
    variantLabel: variantLabel(variant),
    unitPrice: await effectiveUnitPrice(variant),
    image: await lineImage(
      variant.products.id,
      variant.variant_option_values.find((v) => v.product_option_values?.product_options?.name === "Colour")?.product_option_values?.value,
      variant.products.name
    ),
    quantity,
    maxStock: availableStock(variant),
  };
}

export async function getCartLines(customerId: string): Promise<CartLine[]> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("customer_id", customerId).maybeSingle();
  if (!cart) return [];

  const { data: items, error } = await supabase
    .from("cart_items")
    .select(`quantity, product_variants ( ${VARIANT_SELECT} )`)
    .eq("cart_id", cart.id);
  if (error) throw error;

  const lines = await Promise.all(
    (items ?? []).map((item) => {
      const variant = item.product_variants as unknown as RawVariantRow | null;
      return variant ? toCartLine(variant, item.quantity) : null;
    })
  );
  return lines.filter((l): l is CartLine => l !== null);
}

async function fetchVariant(variantId: string): Promise<RawVariantRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("product_variants").select(VARIANT_SELECT).eq("id", variantId).maybeSingle();
  if (error) throw error;
  return data as unknown as RawVariantRow | null;
}

export async function addToCart(customerId: string, variantId: string, quantity: number): Promise<CartLine[]> {
  const variant = await fetchVariant(variantId);
  if (!variant) throw new Error("This piece is no longer available.");
  const stock = availableStock(variant);
  if (stock <= 0) throw new Error("This piece is currently out of stock.");

  const cartId = await getOrCreateCartId(customerId);
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  const nextQuantity = Math.min(stock, (existing?.quantity ?? 0) + Math.max(1, quantity));
  if (existing) {
    await supabase.from("cart_items").update({ quantity: nextQuantity }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ cart_id: cartId, variant_id: variantId, quantity: nextQuantity });
  }
  return getCartLines(customerId);
}

export async function updateCartItemQuantity(customerId: string, variantId: string, quantity: number): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId(customerId);
  const supabase = await createClient();
  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("variant_id", variantId);
    return getCartLines(customerId);
  }
  const variant = await fetchVariant(variantId);
  const clamped = variant ? Math.min(quantity, availableStock(variant)) : quantity;
  await supabase.from("cart_items").update({ quantity: Math.max(0, clamped) }).eq("cart_id", cartId).eq("variant_id", variantId);
  return getCartLines(customerId);
}

export async function removeCartItem(customerId: string, variantId: string): Promise<CartLine[]> {
  const cartId = await getOrCreateCartId(customerId);
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("variant_id", variantId);
  return getCartLines(customerId);
}

export async function clearCart(customerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("customer_id", customerId).maybeSingle();
  if (!cart) return;
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
}

export interface GuestCartItem {
  variantId: string;
  quantity: number;
}

const MAX_GUEST_LINES = 50;

/**
 * A guest's bag lives in their browser as bare {variantId, quantity} pairs. This turns
 * those into real lines using the same live price/stock logic as signed-in carts —
 * nothing about price or availability is taken from the browser. Unknown, inactive or
 * sold-out variants are dropped and quantities are clamped to what's in stock.
 */
export async function getLinesForItems(items: GuestCartItem[]): Promise<CartLine[]> {
  const wanted = new Map<string, number>();
  for (const item of items.slice(0, MAX_GUEST_LINES)) {
    if (typeof item?.variantId !== "string" || !/^[0-9a-f-]{36}$/i.test(item.variantId)) continue;
    const qty = Math.floor(Number(item.quantity));
    if (!(qty > 0)) continue;
    wanted.set(item.variantId, (wanted.get(item.variantId) ?? 0) + qty);
  }
  if (wanted.size === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.from("product_variants").select(VARIANT_SELECT).eq("is_active", true).in("id", [...wanted.keys()]);
  if (error) throw error;

  const lines = await Promise.all(
    ((data ?? []) as unknown as RawVariantRow[]).map((variant) => {
      const stock = availableStock(variant);
      if (stock <= 0) return null;
      return toCartLine(variant, Math.min(stock, wanted.get(variant.id) ?? 1));
    })
  );
  // Keep the order the guest added things in.
  const order = [...wanted.keys()];
  return lines.filter((l): l is CartLine => l !== null).sort((a, b) => order.indexOf(a.variantId) - order.indexOf(b.variantId));
}

/**
 * Moves a guest's browser bag into an account bag. Repeat-safe: an item already in
 * the account bag keeps the larger of the two quantities rather than adding them, so
 * a merge that runs twice (e.g. a request cut off by a page reload) can't double up.
 */
export async function mergeGuestItems(customerId: string, items: GuestCartItem[]): Promise<CartLine[]> {
  const guestLines = await getLinesForItems(items);
  if (guestLines.length) {
    const cartId = await getOrCreateCartId(customerId);
    const supabase = await createClient();
    const { data: existing } = await supabase.from("cart_items").select("variant_id, quantity").eq("cart_id", cartId);
    const current = new Map((existing ?? []).map((i) => [i.variant_id, i.quantity]));
    for (const line of guestLines) {
      const have = current.get(line.variantId);
      if (have === undefined) {
        await supabase.from("cart_items").insert({ cart_id: cartId, variant_id: line.variantId, quantity: line.quantity });
      } else if (line.quantity > have) {
        await supabase.from("cart_items").update({ quantity: Math.min(line.maxStock, line.quantity) }).eq("cart_id", cartId).eq("variant_id", line.variantId);
      }
    }
  }
  return getCartLines(customerId);
}
