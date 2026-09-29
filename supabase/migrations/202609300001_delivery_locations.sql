-- Delivery locations: admin-managed delivery groups (shipping_zones) containing
-- priced areas (shipping_rates), plus admin-managed pickup points, plus the contact
-- details a buyer gives at checkout.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.

-- Groups (e.g. "Nairobi", "Kiambu / Kajiado", "Other counties", "International").
alter table public.shipping_zones
  add column if not exists description text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

-- Areas inside a group, each with its own price (e.g. Nairobi → Langata, KSh 300).
alter table public.shipping_rates
  add column if not exists delivery_estimate text,
  add column if not exists created_at timestamptz not null default now();

-- Only reads existed before; staff now manage both from the admin panel.
drop policy if exists "staff shipping zones write" on public.shipping_zones;
create policy "staff shipping zones write" on public.shipping_zones
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff shipping rates write" on public.shipping_rates;
create policy "staff shipping rates write" on public.shipping_rates
  for all using (public.is_staff()) with check (public.is_staff());

-- Pickup points (free collection). Seeded with the Kahawa Sukari shop.
create table if not exists public.pickup_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  hours text,
  directions text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.pickup_locations enable row level security;
drop policy if exists "public pickup read" on public.pickup_locations;
create policy "public pickup read" on public.pickup_locations
  for select using (is_active or public.is_staff());
drop policy if exists "staff pickup write" on public.pickup_locations;
create policy "staff pickup write" on public.pickup_locations
  for all using (public.is_staff()) with check (public.is_staff());

insert into public.pickup_locations (name, address, hours, sort_order)
select 'Kahawa Sukari Shop', 'Kahawa Sukari, Nairobi', 'We''ll message you when your order is ready to collect.', 0
where not exists (select 1 from public.pickup_locations);

-- Contact details given at checkout, used for order emails and M-Pesa/delivery calls.
alter table public.orders
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
