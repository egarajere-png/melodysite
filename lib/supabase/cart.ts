import { createClient } from "@/lib/supabase/server";
import { getActiveDeal } from "@/lib/supabase/catalogue";
import type { CartLine } from "@/context/CartContext";
import type { ImageRef } from "@/lib/types";

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

async function primaryImage(productId: string): Promise<ImageRef> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_media")
    .select("id, storage_path, alt_text")
    .eq("product_id", productId)
    .eq("media_kind", "PRODUCT")
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (!data) return { id: productId, alt: "", kind: "product", tone: "sand" };
  if (data.storage_path.startsWith("placeholder:")) {
    const [, kind, tone, id] = data.storage_path.split(":");
    return { id, alt: data.alt_text ?? "", kind: (kind as ImageRef["kind"]) ?? "product", tone: (tone as ImageRef["tone"]) ?? "sand" };
  }
  return {
    id: data.id,
    alt: data.alt_text ?? "",
    kind: "product",
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/${data.storage_path}`,
  };
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
    name: variant.products.name,
    variantLabel: variantLabel(variant),
    unitPrice: await effectiveUnitPrice(variant),
    image: await primaryImage(variant.products.id),
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
