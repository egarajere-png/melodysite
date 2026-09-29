-- Originally generated from the mock catalogue; trimmed to the single sample product (Nia Twist Ring). Its photos and extra Rose Gold variants are added by scripts/reset-sample-catalogue.mjs.
begin;

-- Categories
insert into public.categories (slug, name, sort_order) values ('rings', 'Rings', 0) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('earrings', 'Earrings', 1) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('bracelets', 'Bracelets', 2) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('anklets', 'Anklets', 3) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('hair-jewellery', 'Hair Jewellery', 4) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('piercings', 'Piercings', 5) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('charms', 'Charms', 6) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort_order) values ('belly-rings', 'Belly Rings', 7) on conflict (slug) do nothing;

-- Collections
insert into public.collections (slug, name, description, sort_order) values ('new-arrivals', 'New Arrivals', 'The latest pieces to join the house.', 0) on conflict (slug) do nothing;
insert into public.collections (slug, name, description, sort_order) values ('best-sellers', 'Best Sellers', 'Most loved, worn on repeat.', 1) on conflict (slug) do nothing;
insert into public.collections (slug, name, description, sort_order) values ('earth', 'Earth', 'Raw materiality — clay, stone, unfinished metal.', 2) on conflict (slug) do nothing;
insert into public.collections (slug, name, description, sort_order) values ('heritage', 'Heritage', 'Contemporary forms rooted in inherited craft.', 3) on conflict (slug) do nothing;
insert into public.collections (slug, name, description, sort_order) values ('aurum-edit', 'Aurum Edit', 'Seasonal edit, selected pieces at a considered price.', 4) on conflict (slug) do nothing;
insert into public.collections (slug, name, description, audience, sort_order) values ('for-men', 'For Men', 'Pieces suited to a men''s edit.', 'men', 5) on conflict (slug) do nothing;

-- Material finishes
insert into public.material_finishes (slug, name, sort_order) values ('silver', 'Silver', 0) on conflict (slug) do nothing;
insert into public.material_finishes (slug, name, sort_order) values ('gold-brass', 'Gold / Brass', 1) on conflict (slug) do nothing;

-- Products
insert into public.products (slug, name, description, care_instructions, shipping_info, returns_info, base_price, cost_price, product_kind, is_bestseller, materials, created_at) values ('nia-twist-ring', 'Nia Twist Ring', 'A soft twist band with an off-centre gleam — Nia, ''purpose'', made to be stacked or worn alone.', 'Avoid contact with perfume and chlorine. Store separately to prevent scratching.', 'Ships within 3–5 working days across Kenya.', 'Exchanges accepted within 14 days for unworn pieces in original packaging.', 5200, 2860, 'INDIVIDUAL_PIECE', false, array['Sterling silver', 'Gold vermeil option'], '2026-05-12'::timestamptz) on conflict (slug) do nothing;

-- Product categories
insert into public.product_categories (product_id, category_id) select pr.id, ca.id from public.products pr, public.categories ca where pr.slug = 'nia-twist-ring' and ca.slug = 'rings' on conflict do nothing;

-- Product collections
insert into public.product_collections (product_id, collection_id) select pr.id, co.id from public.products pr, public.collections co where pr.slug = 'nia-twist-ring' and co.slug = 'aurum-edit' on conflict do nothing;

-- Product material finishes
insert into public.product_material_finishes (product_id, material_finish_id) select pr.id, mf.id from public.products pr, public.material_finishes mf where pr.slug = 'nia-twist-ring' and mf.slug = 'silver' on conflict do nothing;
insert into public.product_material_finishes (product_id, material_finish_id) select pr.id, mf.id from public.products pr, public.material_finishes mf where pr.slug = 'nia-twist-ring' and mf.slug = 'gold-brass' on conflict do nothing;

-- Product options and values
insert into public.product_options (product_id, name, display_order) select id, 'Colour', 0 from public.products where slug = 'nia-twist-ring' on conflict (product_id, name) do nothing;
insert into public.product_option_values (option_id, value, display_order) select po.id, 'Silver', 0 from public.product_options po join public.products pr on pr.id = po.product_id where pr.slug = 'nia-twist-ring' and po.name = 'Colour' on conflict (option_id, value) do nothing;
insert into public.product_option_values (option_id, value, display_order) select po.id, 'Gold Vermeil', 1 from public.product_options po join public.products pr on pr.id = po.product_id where pr.slug = 'nia-twist-ring' and po.name = 'Colour' on conflict (option_id, value) do nothing;
insert into public.product_options (product_id, name, display_order) select id, 'Size', 1 from public.products where slug = 'nia-twist-ring' on conflict (product_id, name) do nothing;
insert into public.product_option_values (option_id, value, display_order) select po.id, 'S', 0 from public.product_options po join public.products pr on pr.id = po.product_id where pr.slug = 'nia-twist-ring' and po.name = 'Size' on conflict (option_id, value) do nothing;
insert into public.product_option_values (option_id, value, display_order) select po.id, 'M', 1 from public.product_options po join public.products pr on pr.id = po.product_id where pr.slug = 'nia-twist-ring' and po.name = 'Size' on conflict (option_id, value) do nothing;

-- Product variants
insert into public.product_variants (product_id, sku) select id, 'NIA-SIL-S' from public.products where slug = 'nia-twist-ring' on conflict (sku) do nothing;
insert into public.product_variants (product_id, sku) select id, 'NIA-SIL-M' from public.products where slug = 'nia-twist-ring' on conflict (sku) do nothing;
insert into public.product_variants (product_id, sku) select id, 'NIA-GLD-S' from public.products where slug = 'nia-twist-ring' on conflict (sku) do nothing;
insert into public.product_variants (product_id, sku) select id, 'NIA-GLD-M' from public.products where slug = 'nia-twist-ring' on conflict (sku) do nothing;

-- Variant option value links
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'Silver' join public.product_options po on po.id = pov.option_id and po.name = 'Colour' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-SIL-S' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'S' join public.product_options po on po.id = pov.option_id and po.name = 'Size' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-SIL-S' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'Silver' join public.product_options po on po.id = pov.option_id and po.name = 'Colour' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-SIL-M' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'M' join public.product_options po on po.id = pov.option_id and po.name = 'Size' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-SIL-M' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'Gold Vermeil' join public.product_options po on po.id = pov.option_id and po.name = 'Colour' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-GLD-S' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'S' join public.product_options po on po.id = pov.option_id and po.name = 'Size' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-GLD-S' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'Gold Vermeil' join public.product_options po on po.id = pov.option_id and po.name = 'Colour' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-GLD-M' and pr.slug = 'nia-twist-ring' on conflict do nothing;
insert into public.variant_option_values (variant_id, option_value_id) select pv.id, pov.id from public.product_variants pv join public.product_option_values pov on pov.value = 'M' join public.product_options po on po.id = pov.option_id and po.name = 'Size' join public.products pr on pr.id = po.product_id where pv.sku = 'NIA-GLD-M' and pr.slug = 'nia-twist-ring' on conflict do nothing;

-- Inventory
insert into public.inventory (variant_id, quantity_on_hand, reorder_level) select id, 3, 2 from public.product_variants where sku = 'NIA-SIL-S' on conflict (variant_id) do nothing;
insert into public.inventory (variant_id, quantity_on_hand, reorder_level) select id, 5, 2 from public.product_variants where sku = 'NIA-SIL-M' on conflict (variant_id) do nothing;
insert into public.inventory (variant_id, quantity_on_hand, reorder_level) select id, 2, 2 from public.product_variants where sku = 'NIA-GLD-S' on conflict (variant_id) do nothing;
insert into public.inventory (variant_id, quantity_on_hand, reorder_level) select id, 0, 2 from public.product_variants where sku = 'NIA-GLD-M' on conflict (variant_id) do nothing;

-- Product media: none. Photos are real files in Supabase Storage, uploaded from the admin
-- product page (or by scripts/reset-sample-catalogue.mjs for the sample product).
-- Deals
insert into public.deals (title, placement, discount_percent, starts_at, ends_at, is_active) select 'The Aurum Edit', 'homepage', 20, '2026-09-10'::timestamptz, '2026-09-30'::timestamptz, true where not exists (select 1 from public.deals where title = 'The Aurum Edit');
insert into public.deal_products (deal_id, product_id) select de.id, pr.id from public.deals de, public.products pr where de.title = 'The Aurum Edit' and pr.slug = 'nia-twist-ring' on conflict do nothing;

-- Shipping zones/rates — illustrative placeholders, not from /data (no mock equivalent existed).
insert into public.shipping_zones (name, country_codes, is_international) values
  ('Nairobi', array['KE'], false),
  ('Rest of Kenya', array['KE'], false)
on conflict (name) do nothing;
insert into public.shipping_rates (shipping_zone_id, name, amount)
  select id, 'Standard Delivery', 300 from public.shipping_zones where name = 'Nairobi'
  on conflict do nothing;
insert into public.shipping_rates (shipping_zone_id, name, amount)
  select id, 'Standard Delivery', 500 from public.shipping_zones where name = 'Rest of Kenya'
  on conflict do nothing;

commit;
