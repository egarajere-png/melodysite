-- Order creation needs to reserve stock atomically: two customers checking out the
-- last unit of a variant at the same time must not both succeed. A single UPDATE
-- with a WHERE clause checking availability is atomic under Postgres's row-level
-- locking (the second concurrent UPDATE blocks until the first commits, then
-- re-evaluates the WHERE clause against the now-updated row), so this doesn't need
-- an explicit lock statement.
--
-- SECURITY DEFINER so an authenticated customer (whose session normally can't write
-- to public.inventory — see "staff inventory write") can reserve stock for their own
-- order. The blast radius is narrow: this can only ever increment quantity_reserved
-- by exactly the amount available, never below zero, never beyond on-hand stock.

create or replace function public.reserve_variant_stock(p_variant_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.inventory
  set quantity_reserved = quantity_reserved + p_quantity, updated_at = now()
  where variant_id = p_variant_id
    and quantity_on_hand - quantity_reserved >= p_quantity;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.release_variant_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity <= 0 then
    return;
  end if;

  update public.inventory
  set quantity_reserved = greatest(0, quantity_reserved - p_quantity), updated_at = now()
  where variant_id = p_variant_id;
end;
$$;

grant execute on function public.reserve_variant_stock(uuid, integer) to authenticated;
grant execute on function public.release_variant_stock(uuid, integer) to authenticated;
