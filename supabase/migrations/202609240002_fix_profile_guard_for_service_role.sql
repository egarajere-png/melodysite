-- The previous migration's guard only let a role/is_active change through when
-- public.is_admin() was true, which relies on auth.uid() resolving to the caller's
-- own authenticated session. auth.uid() is null on service-role connections — the
-- trusted server-side path this project uses for admin/backend operations — so the
-- trigger would have silently reverted legitimate role changes made by trusted
-- server code too, not just malicious client-side attempts.
--
-- auth.role() reads the `role` claim PostgREST sets from the request's JWT, which is
-- 'service_role' for requests made with the service-role key. That connection already
-- bypasses RLS entirely and is never exposed to a browser, so trusting it here doesn't
-- weaken anything — it just stops this trigger from fighting the app's own backend.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;
