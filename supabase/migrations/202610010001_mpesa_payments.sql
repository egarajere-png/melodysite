-- M-Pesa (Daraja STK Push) payments.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.
--
-- * payment_transactions, payment_events and email_messages were created without
--   row level security, which leaves them readable and writable with the public anon
--   key. They're locked down here: only the service-role client (server-side) writes
--   them, and staff can read them.
-- * payments gains the M-Pesa number charged, the M-Pesa receipt and a failure reason.
-- * confirm_mpesa_payment() settles a payment and confirms its order in one
--   transaction, so an order can never end up paid-but-unconfirmed. It is safe to call
--   more than once for the same payment (callback and status query can both arrive).

alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
alter table public.email_messages enable row level security;

drop policy if exists "staff payment transactions read" on public.payment_transactions;
create policy "staff payment transactions read" on public.payment_transactions
  for select using (public.is_staff());

drop policy if exists "staff payment events read" on public.payment_events;
create policy "staff payment events read" on public.payment_events
  for select using (public.is_staff());

drop policy if exists "staff email messages read" on public.email_messages;
create policy "staff email messages read" on public.email_messages
  for select using (public.is_staff());

alter table public.payments
  add column if not exists phone text,
  add column if not exists receipt_number text,
  add column if not exists failure_reason text;

create index if not exists payments_order_id_idx on public.payments (order_id, created_at desc);
create unique index if not exists payments_provider_reference_key on public.payments (provider, provider_reference) where provider_reference is not null;
create unique index if not exists payments_receipt_number_key on public.payments (receipt_number) where receipt_number is not null;
-- At most one prompt can be awaiting a PIN per order, so a double-click (or two tabs)
-- can never put two charges on the customer's phone.
create unique index if not exists payments_one_open_per_order on public.payments (order_id) where status in ('PENDING', 'PROCESSING');

create or replace function public.confirm_mpesa_payment(p_payment_id uuid, p_receipt text default null, p_payload jsonb default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order_status public.order_status;
  v_first_settlement boolean;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    return 'not_found';
  end if;

  v_first_settlement := v_payment.status <> 'SUCCEEDED';

  update public.payments
  set status = 'SUCCEEDED',
      receipt_number = coalesce(p_receipt, receipt_number),
      failure_reason = null,
      updated_at = now()
  where id = p_payment_id;

  if not v_first_settlement then
    return 'already_settled';
  end if;

  insert into public.payment_transactions (payment_id, transaction_type, amount, provider_reference, payload)
  values (p_payment_id, 'STK_PUSH', v_payment.amount, p_receipt, p_payload);

  select status into v_order_status from public.orders where id = v_payment.order_id for update;

  if v_order_status = 'PAYMENT_PENDING' then
    update public.orders set status = 'PAYMENT_CONFIRMED', updated_at = now() where id = v_payment.order_id;
    insert into public.order_status_history (order_id, status, note)
    values (v_payment.order_id, 'PAYMENT_CONFIRMED', 'Paid via M-Pesa' || coalesce(' — receipt ' || p_receipt, '') || '.');
    return 'confirmed';
  end if;

  -- Money arrived for an order that wasn't waiting for it (already paid by an earlier
  -- prompt, or cancelled meanwhile). Leave the order alone and tell staff.
  insert into public.order_notes (order_id, note, is_customer_visible)
  values (
    v_payment.order_id,
    'M-Pesa payment' || coalesce(' ' || p_receipt, '') || ' of KES ' || v_payment.amount || ' was received while this order was ' || v_order_status || '. Check whether a refund is due.',
    false
  );
  return 'order_not_pending';
end;
$$;

revoke all on function public.confirm_mpesa_payment(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_mpesa_payment(uuid, text, jsonb) to service_role;
