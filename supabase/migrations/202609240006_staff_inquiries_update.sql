-- The initial migration gave staff SELECT on contact_inquiries and let the public
-- INSERT one, but never granted an UPDATE policy — so there was no way for staff to
-- mark an inquiry as read/in-progress/resolved at all.

create policy "staff inquiries update" on public.contact_inquiries for update using (public.is_staff()) with check (public.is_staff());
