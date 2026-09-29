-- Guest checkout: orders no longer need an account.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.
--
-- * customer_id becomes optional (guest orders have none). RLS is unchanged: the
--   "own orders" policy compares customer_id to auth.uid(), which a NULL never
--   matches, so guest orders stay invisible to every customer session.
-- * contact_name joins the contact email/phone captured at checkout.
-- * access_token is a random, unguessable key that lets a guest open their own order
--   page (sent in their order link, or recovered with order number + email).

alter table public.orders alter column customer_id drop not null;

alter table public.orders
  add column if not exists contact_name text,
  add column if not exists access_token uuid not null default gen_random_uuid();

create unique index if not exists orders_access_token_key on public.orders (access_token);
