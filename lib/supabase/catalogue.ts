import { createPublicClient } from "@/lib/supabase/public";
import type { Category, CategorySlug, CollectionSummary, Deal, ImageRef, Product, ProductVariant } from "@/lib/types";

/**
 * Authoritative catalogue reads, backed by Supabase. Every function here maps rows
 * back onto the exact same view-model types the UI already used with mock data
 * (lib/types.ts), so Shop/PDP/homepage components change their data *source*, not
 * their shape or design.
 *
 * Relational facet filters (category/collection/audience/material finish) are applied
 * in this module after a single richly-embedded fetch, rather than as dynamic nested
 * PostgREST filters — simpler to reason about correctly at this catalogue size, and
 * still fully server-side: nothing unfiltered ever reaches the browser.
 */

const PRODUCT_SELECT = `
  id, slug, name, description, care_instructions, shipping_info, returns_info,
  base_price, cost_price, product_kind, is_bestseller, is_featured, materials, created_at,
  product_categories ( categories ( slug, name ) ),
  product_collections ( collections ( slug, name, audience ) ),
  product_material_finishes ( material_finishes ( slug ) ),
  product_variants (
    id, sku, price, is_active,
    inventory ( quantity_on_hand, quantity_reserved ),
    variant_option_values (
      product_option_values ( value, product_options ( name ) )
    )
  ),
  product_media ( id, storage_path, alt_text, media_kind, sort_order, is_primary )
`;

type RawProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  care_instructions: string | null;
  shipping_info: string | null;
  returns_info: string | null;
  base_price: number;
  cost_price: number | null;
  product_kind: "SET" | "INDIVIDUAL_PIECE";
  is_bestseller: boolean;
  is_featured: boolean;
  materials: string[];
  created_at: string;
  product_categories: { categories: { slug: string; name: string } | null }[];
  product_collections: { collections: { slug: string; name: string; audience: string | null } | null }[];
  product_material_finishes: { material_finishes: { slug: string } | null }[];
  product_variants: {
    id: string;
    sku: string;
    price: number | null;
    is_active: boolean;
    inventory: { quantity_on_hand: number; quantity_reserved: number } | null;
    variant_option_values: { product_option_values: { value: string; product_options: { name: string } | null } | null }[];
  }[];
  product_media: {
    id: string;
    storage_path: string;
    alt_text: string | null;
    media_kind: "PRODUCT" | "WORN" | "EDITORIAL";
    sort_order: number;
    is_primary: boolean;
  }[];
};

/**
 * product_media.storage_path is either a real Supabase Storage path (once real
 * photography replaces placeholders) or a `placeholder:<kind>:<tone>:<id>` marker
 * carried over from the mock catalogue. This is the one place that distinction is
 * resolved, so <EditorialImage> and the rest of the UI never need to know which case
 * they're in. Supabase's public object URL is a fixed, documented shape, so building
 * it here needs no network call and no client instance.
 */
function toImageRef(media: RawProductRow["product_media"][number]): ImageRef {
  if (media.storage_path.startsWith("placeholder:")) {
    const [, kind, tone, id] = media.storage_path.split(":");
    return {
      id,
      alt: media.alt_text ?? "",
      kind: (kind as ImageRef["kind"]) ?? "product",
      tone: (tone as ImageRef["tone"]) ?? "sand",
    };
  }
  return {
    id: media.id,
    alt: media.alt_text ?? "",
    kind: media.media_kind.toLowerCase() as ImageRef["kind"],
    url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/${media.storage_path}`,
  };
}

function toVariant(v: RawProductRow["product_variants"][number]): ProductVariant {
  const colour = v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Colour")
    ?.product_option_values?.value;
  const size = v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Size")
    ?.product_option_values?.value;
  return {
    id: v.id,
    sku: v.sku,
    colour,
    size,
    stock: Math.max(0, (v.inventory?.quantity_on_hand ?? 0) - (v.inventory?.quantity_reserved ?? 0)),
    ...(v.price != null ? { priceOverride: v.price } : {}),
  };
}

function toProduct(row: RawProductRow, activeDeal: Deal | null): Product {
  const images = row.product_media
    .filter((m) => m.media_kind === "PRODUCT" || m.media_kind === "EDITORIAL")
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toImageRef);
  const wornMedia = row.product_media.find((m) => m.media_kind === "WORN");
  const inDeal = activeDeal?.productIds.includes(row.id) ?? false;
  const salePrice = inDeal ? Math.round(row.base_price * (1 - (activeDeal as Deal).discountPercent / 100)) : undefined;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: (row.product_categories[0]?.categories?.slug ?? "rings") as CategorySlug,
    collections: row.product_collections.map((pc) => pc.collections?.slug).filter((s): s is string => Boolean(s)),
    price: row.base_price,
    salePrice,
    description: row.description,
    materials: row.materials,
    careInstructions: row.care_instructions ?? "",
    shippingInfo: row.shipping_info ?? "",
    returnsInfo: row.returns_info ?? "",
    images,
    wornImage: wornMedia ? toImageRef(wornMedia) : undefined,
    variants: row.product_variants.filter((v) => v.is_active).map(toVariant),
    isBestseller: row.is_bestseller,
    createdAt: row.created_at,
  };
}

export interface ProductFilters {
  category?: CategorySlug;
  collection?: string;
  audience?: string;
  productKind?: "SET" | "INDIVIDUAL_PIECE";
  materialFinishes?: string[]; // OR'd together
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  dealOnly?: boolean;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "bestsellers";
}

async function fetchAllActiveProducts(): Promise<RawProductRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);
  if (error) throw error;
  return (data ?? []) as unknown as RawProductRow[];
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const [rows, activeDeal] = await Promise.all([fetchAllActiveProducts(), getActiveDeal()]);
  let list = rows.map((row) => toProduct(row, activeDeal));

  if (filters.dealOnly && activeDeal) list = list.filter((p) => activeDeal.productIds.includes(p.id));
  if (filters.category) list = list.filter((p) => p.category === filters.category);
  if (filters.collection) list = list.filter((p) => p.collections.includes(filters.collection!));
  if (filters.audience) {
    const slugsForAudience = new Set(
      rows
        .filter((r) => r.product_collections.some((pc) => pc.collections?.audience === filters.audience))
        .map((r) => r.id)
    );
    list = list.filter((p) => slugsForAudience.has(p.id));
  }
  if (filters.productKind) {
    const kindBySlug = new Map(rows.map((r) => [r.slug, r.product_kind]));
    list = list.filter((p) => kindBySlug.get(p.slug) === filters.productKind);
  }
  if (filters.materialFinishes?.length) {
    const finishSlugsById = new Map(
      rows.map((r) => [r.id, new Set(r.product_material_finishes.map((f) => f.material_finishes?.slug).filter(Boolean))])
    );
    list = list.filter((p) => filters.materialFinishes!.some((slug) => finishSlugsById.get(p.id)?.has(slug)));
  }
  if (filters.minPrice != null) list = list.filter((p) => (p.salePrice ?? p.price) >= filters.minPrice!);
  if (filters.maxPrice != null) list = list.filter((p) => (p.salePrice ?? p.price) <= filters.maxPrice!);
  if (filters.inStockOnly) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  switch (filters.sort) {
    case "newest":
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "price-asc":
      list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      break;
    case "price-desc":
      list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      break;
    case "bestsellers":
      list.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller));
      break;
    default:
      break;
  }

  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const [{ data, error }, activeDeal] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true).eq("slug", slug).maybeSingle(),
    getActiveDeal(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return toProduct(data as unknown as RawProductRow, activeDeal);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return getProducts({ sort: "newest" }).then((list) => list.slice(0, limit));
}

export async function getBestsellers(limit = 8): Promise<Product[]> {
  const list = await getProducts();
  return list.filter((p) => p.isBestseller).slice(0, limit);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("slug").eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    slug: c.slug as CategorySlug,
    name: c.name,
    image: { id: `cat-${c.slug}`, alt: `Aurum Entonet ${c.name.toLowerCase()}`, kind: "editorial", tone: "sand" },
  }));
}

export async function getCollections(): Promise<CollectionSummary[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("slug, name, description")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((c) => ({ slug: c.slug, name: c.name, description: c.description ?? undefined }));
}

export async function getMaterialFinishes(): Promise<{ slug: string; name: string }[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("material_finishes")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getActiveDeal(): Promise<Deal | null> {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("deals")
    .select("id, title, placement, discount_percent, starts_at, ends_at, is_active, deal_products(product_id)")
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    subtitle: `Up to ${data.discount_percent}% off selected pieces`,
    productIds: data.deal_products.map((dp) => dp.product_id),
    discountPercent: Number(data.discount_percent),
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    active: data.is_active,
  };
}
