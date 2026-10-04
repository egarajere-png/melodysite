-- Order notifications now go out by WhatsApp as well as email, and both are recorded
-- in email_messages so staff can see what a customer was sent and what failed.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.

alter table public.email_messages
  add column if not exists channel text not null default 'EMAIL',
  add column if not exists error text;

create index if not exists email_messages_order_id_idx on public.email_messages (order_id, created_at desc);
