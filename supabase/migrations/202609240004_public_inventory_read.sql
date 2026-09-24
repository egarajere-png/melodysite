-- The initial migration only let staff read public.inventory ("staff inventory
-- read"), so anonymous/customer requests got null quantities for every variant —
-- every product on the storefront read as out of stock. The approved product detail
-- page already displays exact stock ("N available") to shoppers, so hiding inventory
-- from them was a gap against the approved design, not an intended restriction.
-- This adds a second, public, read-only policy alongside the existing staff one
-- (RLS policies are additive/OR'd) — write access remains staff-only.

create policy "public inventory read" on public.inventory for select using (true);
