-- The approved product detail page shows a per-product "Materials" list of short
-- descriptive strings (e.g. "18k gold vermeil over recycled brass", "Freshwater pearl
-- accent"). The initial schema only has product_material_finishes, a coarse two-value
-- filter taxonomy (Silver / Gold-Brass) — it can't represent that descriptive list.
-- This column is purely display content; product_material_finishes remains the only
-- thing the shop filter reads.

alter table public.products add column materials text[] not null default '{}';
