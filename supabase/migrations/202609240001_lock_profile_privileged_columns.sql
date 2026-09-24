-- Security fix: the "profiles own update" policy from the initial migration only
-- restricts *which row* a user may update (id = auth.uid()), not *which columns*.
-- As shipped, any authenticated customer could run, via the anon key:
--   update public.profiles set role = 'ADMIN' where id = auth.uid();
-- and RLS would allow it, since the row-level check still passes. This trigger closes
-- that hole by silently keeping the existing role/is_active for anyone who isn't
-- already an admin, regardless of what a client sends in an update payload.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row
  execute procedure public.protect_profile_privileged_columns();
