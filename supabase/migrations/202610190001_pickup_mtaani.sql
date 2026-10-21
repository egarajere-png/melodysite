-- Delivery now goes through Pick Up Mtaani: the customer chooses a Mtaani agent near
-- them and pays the Mtaani fee with their order; staff then book the parcel on the
-- Mtaani app and paste its tracking code onto the order. Free collection at the shop
-- (pickup_locations) is unchanged.
--
-- Groups (shipping_zones) are Mtaani locations ("CBD", "Thika Road"), and the areas
-- inside them (shipping_rates) are the agents. "Outside Nairobi" lists towns instead,
-- and the customer types where in that town they want to collect.
--
-- Agents and rates are from Pick Up Mtaani's Nairobi agent list. Our parcels are
-- dropped at the Kahawa Sukari agent, so: CBD agents KSh 100, every other Nairobi
-- agent KSh 180, Nakuru / Nyeri / Thika / Machakos KSh 200, other towns KSh 250.
--
-- Paste into the Supabase SQL editor and run once. Safe to re-run: it never re-adds an
-- agent that already exists or re-shows a group staff have since hidden.

alter table public.shipping_zones
  add column if not exists courier text,
  add column if not exists asks_customer_location boolean not null default false;

alter table public.shipping_rates
  add column if not exists agent_location text,
  add column if not exists hours text;

-- Pasted by staff once the parcel is booked on the Mtaani app; shown to the customer.
alter table public.orders
  add column if not exists tracking_code text;

-- Retire the old door-to-door delivery groups and their areas (kept, not deleted, so
-- past orders still point at them).
update public.shipping_rates set is_active = false
where shipping_zone_id in (select id from public.shipping_zones where courier is null);
update public.shipping_zones set is_active = false where courier is null;

insert into public.shipping_zones (name, description, sort_order, courier, asks_customer_location, is_active)
values
  ('CBD', null, 0, 'pickup_mtaani', false, true),
  ('Thika Road', 'Roasters, Kasarani, Kahawa, Juja, Ruiru and more', 1, 'pickup_mtaani', false, true),
  ('South B', null, 2, 'pickup_mtaani', false, true),
  ('South C', null, 3, 'pickup_mtaani', false, true),
  ('Imara Daima', null, 4, 'pickup_mtaani', false, true),
  ('Kitengela', null, 5, 'pickup_mtaani', false, true),
  ('Langata', 'Langata, T-Mall and Madaraka', 6, 'pickup_mtaani', false, true),
  ('Karen', null, 7, 'pickup_mtaani', false, true),
  ('Kilimani', null, 8, 'pickup_mtaani', false, true),
  ('Lavington', null, 9, 'pickup_mtaani', false, true),
  ('Kileleshwa', null, 10, 'pickup_mtaani', false, true),
  ('Pangani', null, 11, 'pickup_mtaani', false, true),
  ('Ngara', null, 12, 'pickup_mtaani', false, true),
  ('Umoja', null, 13, 'pickup_mtaani', false, true),
  ('Buruburu', null, 14, 'pickup_mtaani', false, true),
  ('Embakasi / Nyayo Estate', 'Embakasi, Fedha, Donholm and Nyayo Estate', 15, 'pickup_mtaani', false, true),
  ('Utawala', null, 16, 'pickup_mtaani', false, true),
  ('Ngong Town', null, 17, 'pickup_mtaani', false, true),
  ('Syokimau / Mlolongo', null, 18, 'pickup_mtaani', false, true),
  ('Kiambu Road', null, 19, 'pickup_mtaani', false, true),
  ('Rongai / Kiserian', null, 20, 'pickup_mtaani', false, true),
  ('Eastleigh', null, 21, 'pickup_mtaani', false, true),
  ('Wanyee Road', null, 22, 'pickup_mtaani', false, true),
  ('Kawangware', null, 23, 'pickup_mtaani', false, true),
  ('Jericho', null, 24, 'pickup_mtaani', false, true),
  ('Komarock / Kayole', null, 25, 'pickup_mtaani', false, true),
  ('Ngumo / Highrise', null, 26, 'pickup_mtaani', false, true),
  ('Jamhuri Estate', null, 27, 'pickup_mtaani', false, true),
  ('Ruaka', null, 28, 'pickup_mtaani', false, true),
  ('Waiyaki Way', 'Westlands, Loresho, Kangemi, Kinoo, Uthiru and Kikuyu', 29, 'pickup_mtaani', false, true),
  ('Outside Nairobi', 'Nakuru, Nyeri, Thika, Machakos and other towns', 30, 'pickup_mtaani', true, true)
on conflict (name) do update set
  courier = excluded.courier,
  asks_customer_location = excluded.asks_customer_location,
  description = coalesce(public.shipping_zones.description, excluded.description),
  -- Only un-hide a group this migration is taking over, never one staff hid later.
  is_active = case when public.shipping_zones.courier is null then true else public.shipping_zones.is_active end;

insert into public.shipping_rates (shipping_zone_id, name, agent_location, hours, amount, delivery_estimate)
select z.id, v.name, v.agent_location, coalesce(v.hours, 'Mon–Sun, 8am–7pm'), v.amount, v.estimate
from (
  values
    -- CBD
    ('CBD', 'Okiya & Robert Logistics', 'Philadelphia House, next to Afya Centre, 3rd Floor, Wing B', 'Mon–Fri 8:30am–5:30pm, Sat 8:30am–4pm', 100, 'Usually next day'),
    ('CBD', 'Shelves and Lockers', 'Moi Avenue, former Ebrahims, 1st Floor, Shop F1', 'Mon–Fri, 8:30am–7pm', 100, 'Usually next day'),
    ('CBD', 'Imenti House, Shop G6', 'Tom Mboya St, Kasarani entrance, next to the juice shop', 'Mon–Fri, 8:30am–7pm', 100, 'Usually next day'),
    -- Thika Road
    ('Thika Road', 'Kuchoma Kuku / Big Point Grill', 'Roasters', null, 180, 'Usually next day'),
    ('Thika Road', 'Jimngash Phones & Accessories', 'Juja stage / JKUAT', null, 180, 'Usually next day'),
    ('Thika Road', 'Bleu Topaz', 'Kahawa Sukari, Baringo Road', null, 180, 'Usually next day'),
    ('Thika Road', 'Hair Cut Express & Spa', 'Gumba Estate, Gumba stage', null, 180, 'Usually next day'),
    ('Thika Road', 'La Collection', 'Kahawa Wendani — 2nd junction on your left from Magunas, rough road side', null, 180, 'Usually next day'),
    ('Thika Road', 'The Changes', 'Ruiru Town, opposite Bush Gate Towers', null, 180, 'Usually next day'),
    ('Thika Road', 'Express Services', 'Zimmerman, behind Powerstar Supermarket', null, 180, 'Usually next day'),
    ('Thika Road', 'Sisters Laundry', 'TRM Drive', null, 180, 'Usually next day'),
    ('Thika Road', 'Calfix Phone Repair', 'Kahawa West, opposite Sendeyo House', null, 180, 'Usually next day'),
    ('Thika Road', 'Janpharm Pharmaceuticals', 'Kasarani, ICIPE Road, opposite Kasarani Police Station', null, 180, 'Usually next day'),
    -- South B / South C
    ('South B', 'Elly''s Dry Cleaners', 'South B Shopping Centre', null, 180, 'Usually next day'),
    ('South B', 'Delight Beauty Shop', 'South B Sanasana', null, 180, 'Usually next day'),
    ('South C', 'South C Cyber', 'South C Shopping Centre, next to White Rose Dry Cleaners', null, 180, 'Usually next day'),
    ('South C', 'Ephypol Connections', 'Muhoho Avenue, directly opposite Ruby Fats', null, 180, 'Usually next day'),
    -- Imara Daima / Kitengela
    ('Imara Daima', 'Clothing shop next to Soko Smart Milk ATM', 'Imara Daima Estate junction', null, 180, 'Usually next day'),
    ('Kitengela', 'Suds & Duds / Macliz Dry Cleaners', 'Jupiter House, opposite Kobil Petrol Station', null, 180, 'Usually next day'),
    -- Langata
    ('Langata', 'Trend M Salon', 'Langata OiLibya Petrol Station', null, 180, 'Usually next day'),
    ('Langata', 'Homecare, Tazama', 'T-Mall', null, 180, 'Usually next day'),
    ('Langata', 'Canditec Cyber', 'Madaraka Shopping Centre, Kaago Holding Building', null, 180, 'Usually next day'),
    -- Westlands side
    ('Karen', 'Ray Kiki Styles', 'Karen Shopping Centre, Tana House basement — electrical shop next to Al Aziz Electric', null, 180, 'Usually next day'),
    ('Kilimani', 'Home Care Ltd', 'Yaya Centre', null, 180, 'Usually next day'),
    ('Lavington', 'Halfpriced Books', 'Lavington Westfield Mall, Shop B62', null, 180, 'Usually next day'),
    ('Kileleshwa', 'Tunic Kitchen & Movie Shop', 'Kandara Road', null, 180, 'Usually next day'),
    ('Pangani', 'Neighbourhood Freshmart', 'Pangani Shopping Centre, next to the petrol station', null, 180, 'Usually next day'),
    ('Ngara', 'Shayona Trading', 'Park Road, opposite Shell Petrol Station', null, 180, 'Usually next day'),
    -- Eastlands
    ('Umoja', 'Exioni Dry Cleaners', 'Umoja Market', null, 180, 'Usually next day'),
    ('Umoja', 'Erico Studio', 'Umoja Kwa Chief', null, 180, 'Usually next day'),
    ('Buruburu', 'Hope Salon', 'Buruburu, Co-operative Bank', null, 180, 'Usually next day'),
    ('Buruburu', 'Friends Kennel, Shop C04', 'The Point Mall (Naivas area), next to NCBA Bank', null, 180, 'Usually next day'),
    ('Embakasi / Nyayo Estate', 'The Link Cyber', 'Embakasi / Baraka Estate / Nyayo Gate D & A — at Total Petrol Station', null, 180, 'Usually next day'),
    ('Embakasi / Nyayo Estate', 'Verian Boutique', 'Fedha Estate stage', null, 180, 'Usually next day'),
    ('Embakasi / Nyayo Estate', 'Sirkal Matiyo Cyber Café', 'Donholm, opposite PEFA Church, Kisumu Ndogo stage', null, 180, 'Usually next day'),
    ('Embakasi / Nyayo Estate', 'Aura Bookshop / Baby Shop', 'Nyayo Estate, Court 328 Shopping Centre', null, 180, 'Usually next day'),
    ('Utawala', 'Planet Movies (Shooters stage)', 'Shooters stage, Flame Grill Building, upstairs', null, 180, 'Usually next day'),
    ('Eastleigh', 'Bushra Cyber', 'Madina Mall, 1st Floor', null, 180, 'Usually next day'),
    ('Jericho', 'Stall 326', 'Jericho Market, opposite Stall 347', null, 180, 'Usually next day'),
    ('Komarock / Kayole', 'Endless Fancy Wear', 'K-Mall area, car wash stage (shop with bags and shoes outside)', null, 180, 'Usually next day'),
    ('Ngumo / Highrise', 'Digilab Cyber', 'Kenyatta Market, opposite the police station', null, 180, 'Usually next day'),
    ('Jamhuri Estate', 'Planet Movies (Jamhuri)', 'Jamhuri Estate, next to Buyrite Supermarket', null, 180, 'Usually next day'),
    -- South / outskirts
    ('Ngong Town', 'The Yard Movie Shop', 'Ngong stage, next to Ilade Oil Petrol Station', null, 180, 'Usually next day'),
    ('Syokimau / Mlolongo', 'Aquavet Services', 'Gateway Mall, ground floor, opposite Bata', null, 180, 'Usually next day'),
    ('Syokimau / Mlolongo', 'Eco Bella Tyres', 'Across the road from Luqman Petrol Station, Katani Road junction — 1st floor', null, 180, 'Usually next day'),
    ('Syokimau / Mlolongo', 'Mairenn Pharmacy', 'Katani Road, Rim House stage', null, 180, 'Usually next day'),
    ('Rongai / Kiserian', 'Xtreme Media (Tuskys stage)', 'Rongai, Tuskys stage, directly opposite Clean Shelf', null, 180, 'Usually next day'),
    ('Rongai / Kiserian', 'Xtreme Media (Tumaini)', 'Rongai, behind Quickmart / Tumaini', null, 180, 'Usually next day'),
    ('Rongai / Kiserian', 'Xtreme Media (Kiserian)', 'Kiserian, below Trap City Lounge', null, 180, 'Usually next day'),
    ('Wanyee Road', 'Great By Choice Enterprise', 'Wanyee Road, Sunna Estate stage', null, 180, 'Usually next day'),
    ('Kawangware', 'Posho Mill', '46 Mwisho, end of Gitanga Road', null, 180, 'Usually next day'),
    -- North-west
    ('Kiambu Road', 'African Bookhub Bookshop', 'Thindigua, next to Quickmart Kiambu Road', null, 180, 'Usually next day'),
    ('Ruaka', 'Dee Closet', 'Ruaka Arcade, opposite Cleanshelf Supermarket', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Fits On Time, Shop No. 10', 'Westlands — Masai Market / Business Centre, opposite Kenrail Towers', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Boutiqi Disney Clothier', 'Loresho Shopping Centre, opposite JD Supermarket', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Infospace Cyber', 'Kangemi flyover, next to Rocky', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Aigle Pharmacy', 'Kinoo stage, opposite Jacmil Supermarket', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Cyber café next to Kabiria Ecomatt', 'Uthiru Shopping Centre', null, 180, 'Usually next day'),
    ('Waiyaki Way', 'Clear Touch Salon & Spa', 'Kikuyu stage, close to PCEA Church Kikuyu', null, 180, 'Usually next day'),
    -- Outside Nairobi: towns, not agents — the customer types where to collect.
    ('Outside Nairobi', 'Nakuru', null, null, 200, 'Usually 1–2 days'),
    ('Outside Nairobi', 'Nyeri', null, null, 200, 'Usually 1–2 days'),
    ('Outside Nairobi', 'Thika', null, null, 200, 'Usually 1–2 days'),
    ('Outside Nairobi', 'Machakos', null, null, 200, 'Usually 1–2 days'),
    ('Outside Nairobi', 'Other town', null, null, 250, 'Usually 1–2 days')
) as v(zone, name, agent_location, hours, amount, estimate)
join public.shipping_zones z on z.name = v.zone
where not exists (
  select 1 from public.shipping_rates r where r.shipping_zone_id = z.id and lower(r.name) = lower(v.name)
);

-- Towns don't have one agent's opening hours.
update public.shipping_rates set hours = null
where shipping_zone_id in (select id from public.shipping_zones where asks_customer_location) and agent_location is null;
