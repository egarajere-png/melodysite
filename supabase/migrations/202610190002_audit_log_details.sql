-- A more informative audit log: each entry now records the person's role at the time
-- (so an assistant who is later promoted still shows as an assistant for what they did
-- then), what the action was about in words staff recognise ("AE-9016FBAB", "Maasai
-- Collar"), and a one-sentence description of what happened. before_data/after_data
-- hold the changed fields so the log can show "In Transit → Delivered".
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run.

alter table public.audit_logs
  add column if not exists actor_role text,
  add column if not exists entity_label text,
  add column if not exists summary text;

-- The audit page filters by date, person and kind of action.
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);

-- Older entries: fill in the role each person has now (the best we know).
update public.audit_logs l set actor_role = p.role::text
from public.profiles p
where l.actor_id = p.id and l.actor_role is null;
