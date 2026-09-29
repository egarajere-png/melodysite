// Resets the live catalogue to a single sample product (Nia Twist Ring) with real,
// uploaded sample photos — replacing every placeholder product from the old mock seed.
//
//   node scripts/reset-sample-catalogue.mjs
//
// Uses SUPABASE_SERVICE_ROLE_KEY from .env.local (bypasses RLS), so run it only
// against a project you mean to reset. Safe to re-run: it converges to the same state.
//
// What it leaves behind, for testing the storefront's variant/stock behaviour:
//   Silver        S: 6 in stock   M: 0 (sold out)
//   Gold Vermeil  S: 4 in stock   M: 2 in stock
//   Rose Gold     S: 0            M: 0   (whole colour sold out)
// plus a main image, a hover image, and a gallery per colour.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "product-media";
const IMAGES = path.join(ROOT, "scripts", "sample-product-images");
const KEEP_SLUG = "nia-twist-ring";

function check(error, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

async function removeOtherProducts() {
  const { data: others, error } = await supabase.from("products").select("id, name").neq("slug", KEEP_SLUG);
  check(error, "list products");
  for (const p of others) {
    const { data: variants } = await supabase.from("product_variants").select("id").eq("product_id", p.id);
    const ids = (variants ?? []).map((v) => v.id);
    if (ids.length) check((await supabase.from("cart_items").delete().in("variant_id", ids)).error, "clear carts");
    const { data: media } = await supabase.from("product_media").select("storage_path").eq("product_id", p.id);
    const { error: delError } = await supabase.from("products").delete().eq("id", p.id);
    if (delError?.code === "23503") {
      check((await supabase.from("products").update({ is_active: false }).eq("id", p.id)).error, "archive");
      console.log(`  archived (still referenced): ${p.name}`);
      continue;
    }
    check(delError, `delete ${p.name}`);
    const files = (media ?? []).map((m) => m.storage_path).filter((s) => !s.startsWith("placeholder:"));
    if (files.length) await supabase.storage.from(BUCKET).remove(files);
    console.log(`  deleted: ${p.name}`);
  }
}

async function optionValueId(productId, optionName, value, order) {
  let { data: option } = await supabase.from("product_options").select("id").eq("product_id", productId).eq("name", optionName).maybeSingle();
  if (!option) {
    const res = await supabase.from("product_options").insert({ product_id: productId, name: optionName, display_order: optionName === "Colour" ? 0 : 1 }).select("id").single();
    check(res.error, "create option");
    option = res.data;
  }
  let { data: ov } = await supabase.from("product_option_values").select("id").eq("option_id", option.id).eq("value", value).maybeSingle();
  if (!ov) {
    const res = await supabase.from("product_option_values").insert({ option_id: option.id, value, display_order: order }).select("id").single();
    check(res.error, "create option value");
    ov = res.data;
  }
  return ov.id;
}

async function upsertVariant(productId, sku, colour, size, stock, order) {
  let { data: variant } = await supabase.from("product_variants").select("id").eq("sku", sku).maybeSingle();
  if (!variant) {
    const res = await supabase.from("product_variants").insert({ product_id: productId, sku }).select("id").single();
    check(res.error, `create ${sku}`);
    variant = res.data;
  }
  check((await supabase.from("product_variants").update({ is_active: true }).eq("id", variant.id)).error, "activate variant");
  const { data: inv } = await supabase.from("inventory").select("variant_id").eq("variant_id", variant.id).maybeSingle();
  const invRes = inv
    ? await supabase.from("inventory").update({ quantity_on_hand: stock, quantity_reserved: 0 }).eq("variant_id", variant.id)
    : await supabase.from("inventory").insert({ variant_id: variant.id, quantity_on_hand: stock });
  check(invRes.error, `stock ${sku}`);

  check((await supabase.from("variant_option_values").delete().eq("variant_id", variant.id)).error, "unlink options");
  const links = [await optionValueId(productId, "Colour", colour, order), await optionValueId(productId, "Size", size, size === "S" ? 0 : 1)];
  check((await supabase.from("variant_option_values").insert(links.map((option_value_id) => ({ variant_id: variant.id, option_value_id })))).error, "link options");
  return variant.id;
}

async function upload(productId, file) {
  const storagePath = `products/${productId}/${randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fs.readFileSync(path.join(IMAGES, file)), { contentType: "image/jpeg", cacheControl: "31536000" });
  check(error, `upload ${file}`);
  return storagePath;
}

async function main() {
  const { data: product, error } = await supabase.from("products").select("id, name").eq("slug", KEEP_SLUG).single();
  check(error, `find ${KEEP_SLUG}`);
  console.log(`Keeping ${product.name}. Removing every other product…`);
  await removeOtherProducts();

  console.log("Setting up variants and stock…");
  const silverS = await upsertVariant(product.id, "NIA-SIL-S", "Silver", "S", 6, 0);
  await upsertVariant(product.id, "NIA-SIL-M", "Silver", "M", 0, 0);
  const goldS = await upsertVariant(product.id, "NIA-GLD-S", "Gold Vermeil", "S", 4, 1);
  await upsertVariant(product.id, "NIA-GLD-M", "Gold Vermeil", "M", 2, 1);
  const roseS = await upsertVariant(product.id, "NIA-RSG-S", "Rose Gold", "S", 0, 2);
  await upsertVariant(product.id, "NIA-RSG-M", "Rose Gold", "M", 0, 2);

  check(
    (await supabase.from("products").update({ is_active: true, is_bestseller: true, is_featured: true, created_at: new Date().toISOString() }).eq("id", product.id)).error,
    "flag product"
  );

  console.log("Replacing images…");
  const { data: oldMedia } = await supabase.from("product_media").select("storage_path").eq("product_id", product.id);
  check((await supabase.from("product_media").delete().eq("product_id", product.id)).error, "clear media rows");
  const oldFiles = (oldMedia ?? []).map((m) => m.storage_path).filter((s) => !s.startsWith("placeholder:"));
  if (oldFiles.length) await supabase.storage.from(BUCKET).remove(oldFiles);

  const rows = [
    { file: "nia-main.jpg", media_kind: "PRODUCT", is_primary: true, variant_id: null, alt: "Nia Twist Ring", sort: 0 },
    { file: "nia-hover.jpg", media_kind: "WORN", is_primary: false, variant_id: null, alt: "Nia Twist Ring worn", sort: 0 },
    { file: "nia-silver-1.jpg", media_kind: "PRODUCT", is_primary: false, variant_id: silverS, alt: "Nia Twist Ring — Silver", sort: 1 },
    { file: "nia-silver-2.jpg", media_kind: "PRODUCT", is_primary: false, variant_id: silverS, alt: "Nia Twist Ring — Silver", sort: 2 },
    { file: "nia-gold-1.jpg", media_kind: "PRODUCT", is_primary: false, variant_id: goldS, alt: "Nia Twist Ring — Gold Vermeil", sort: 3 },
    { file: "nia-gold-2.jpg", media_kind: "PRODUCT", is_primary: false, variant_id: goldS, alt: "Nia Twist Ring — Gold Vermeil", sort: 4 },
    { file: "nia-rose-1.jpg", media_kind: "PRODUCT", is_primary: false, variant_id: roseS, alt: "Nia Twist Ring — Rose Gold", sort: 5 },
  ];
  for (const r of rows) {
    const storage_path = await upload(product.id, r.file);
    check(
      (await supabase.from("product_media").insert({ product_id: product.id, variant_id: r.variant_id, storage_path, alt_text: r.alt, media_kind: r.media_kind, is_primary: r.is_primary, sort_order: r.sort })).error,
      `media row ${r.file}`
    );
    console.log(`  uploaded ${r.file}`);
  }

  // Legacy placeholder rows can't exist after this, but order history may still
  // point at old `placeholder:` markers — the storefront renders those as a neutral
  // "image coming soon" block.
  console.log("Done.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
