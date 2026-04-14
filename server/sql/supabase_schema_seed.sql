-- Flipkart Clone: Full schema + seed data
-- Run in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Users profile table linked to auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  slug text not null unique,
  image_url text not null
);

create table if not exists public.products (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  mrp numeric(10,2) not null check (mrp >= price),
  stock integer not null default 0 check (stock >= 0),
  category_id bigint not null references public.categories(id) on delete restrict,
  brand text not null,
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  images text[] not null default '{}',
  specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  phone varchar(15) not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode varchar(10) not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.wishlist (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete restrict,
  address_id bigint not null references public.addresses(id) on delete restrict,
  status public.order_status not null default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null check (price_at_purchase >= 0)
);

-- Indexes
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_name on public.products using gin (to_tsvector('simple', name));
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_cart_items_user_id on public.cart_items(user_id);
create index if not exists idx_wishlist_user_id on public.wishlist(user_id);

-- Create profile row whenever a new auth user is created.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Atomic order placement: validates stock, deducts stock, creates order + order_items, clears cart.
create or replace function public.place_order_atomic(
  p_user_id uuid,
  p_address_id bigint,
  p_discount numeric default 0
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_order_id bigint;
  v_cart_count integer := 0;
  v_item record;
begin
  select count(*) into v_cart_count
  from public.cart_items
  where user_id = p_user_id;

  if v_cart_count = 0 then
    raise exception 'Cart is empty';
  end if;

  if not exists (
    select 1
    from public.addresses
    where id = p_address_id and user_id = p_user_id
  ) then
    raise exception 'Invalid address for user';
  end if;

  for v_item in
    select ci.product_id, ci.quantity, p.price, p.stock
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = p_user_id
    for update of p
  loop
    if v_item.stock < v_item.quantity then
      raise exception 'Insufficient stock for product_id %', v_item.product_id;
    end if;

    v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount, 0), 0);

  insert into public.orders (user_id, address_id, subtotal, discount, total, status)
  values (p_user_id, p_address_id, v_subtotal, coalesce(p_discount, 0), v_total, 'pending')
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, quantity, price_at_purchase)
  select v_order_id, ci.product_id, ci.quantity, p.price
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id;

  update public.products p
  set stock = p.stock - ci.quantity
  from public.cart_items ci
  where ci.user_id = p_user_id and p.id = ci.product_id;

  delete from public.cart_items where user_id = p_user_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'discount', coalesce(p_discount, 0),
    'total', v_total
  );
end;
$$;

-- Basic RLS setup
alter table public.users enable row level security;
alter table public.addresses enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories
for select
using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products
for select
using (true);

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses"
on public.addresses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own cart" on public.cart_items;
create policy "Users manage own cart"
on public.cart_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own wishlist" on public.wishlist;
create policy "Users manage own wishlist"
on public.wishlist
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users manage own orders" on public.orders;
create policy "Users manage own orders"
on public.orders
for select
using (auth.uid() = user_id);

drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items"
on public.order_items
for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

-- Seed categories
insert into public.categories (name, slug, image_url)
values
('Electronics', 'electronics', 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop'),
('Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'),
('Home & Kitchen', 'home-kitchen', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop'),
('Books', 'books', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop'),
('Sports', 'sports', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop')
on conflict (slug) do update set
  name = excluded.name,
  image_url = excluded.image_url;

-- Seed 30 products
with c as (
  select id, slug from public.categories
)
insert into public.products (
  name, slug, description, price, mrp, stock, category_id, brand, rating, review_count, images, specifications
)
values
(
  'Samsung Galaxy S23 FE 5G (Mint, 128 GB)',
  'samsung-galaxy-s23-fe-5g-128gb',
  'Flagship-grade performance with AMOLED display and pro-grade camera setup.',
  42999, 59999, 42,
  (select id from c where slug = 'electronics'),
  'Samsung',
  4.4, 1824,
  array['https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/s23fe/1200/900'],
  '{"display":"6.4-inch AMOLED","ram":"8 GB","storage":"128 GB","battery":"4500 mAh"}'::jsonb
),
(
  'Apple iPhone 14 (Blue, 128 GB)',
  'apple-iphone-14-blue-128gb',
  'A15 Bionic processor with advanced dual-camera system and all-day battery.',
  58999, 69900, 20,
  (select id from c where slug = 'electronics'),
  'Apple',
  4.7, 5120,
  array['https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/iphone14/1200/900'],
  '{"display":"6.1-inch Super Retina","chip":"A15 Bionic","storage":"128 GB","camera":"12MP Dual"}'::jsonb
),
(
  'boAt Rockerz 450 Bluetooth Headphones',
  'boat-rockerz-450-headphones',
  'Wireless over-ear headphones with deep bass and long battery life.',
  1499, 3990, 120,
  (select id from c where slug = 'electronics'),
  'boAt',
  4.2, 8412,
  array['https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/rockerz450/1200/900'],
  '{"type":"Over Ear","battery":"15 hours","connectivity":"Bluetooth 5.0","weight":"168 g"}'::jsonb
),
(
  'Dell Inspiron 15 Laptop (12th Gen i5)',
  'dell-inspiron-15-i5-12th-gen',
  'Reliable daily laptop with Full HD display, SSD storage and backlit keyboard.',
  52990, 67990, 16,
  (select id from c where slug = 'electronics'),
  'Dell',
  4.3, 962,
  array['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/inspiron15/1200/900'],
  '{"processor":"Intel Core i5 12th Gen","ram":"16 GB","storage":"512 GB SSD","display":"15.6-inch FHD"}'::jsonb
),
(
  'Mi Smart TV 5A 43 inch Full HD',
  'mi-smart-tv-5a-43-inch-fhd',
  'Smart Android TV with vivid display, Dolby audio and built-in Chromecast.',
  21999, 32999, 34,
  (select id from c where slug = 'electronics'),
  'Xiaomi',
  4.1, 2275,
  array['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/mis5a/1200/900'],
  '{"screen":"43-inch","resolution":"1920x1080","os":"Android TV","audio":"24W"}'::jsonb
),
(
  'Canon EOS 1500D DSLR Camera',
  'canon-eos-1500d-dslr-camera',
  'Entry-level DSLR with 24.1MP sensor and Wi-Fi for easy sharing.',
  37999, 42995, 11,
  (select id from c where slug = 'electronics'),
  'Canon',
  4.5, 1288,
  array['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/eos1500d/1200/900'],
  '{"sensor":"24.1 MP APS-C","lens":"18-55 mm","video":"Full HD","connectivity":"Wi-Fi"}'::jsonb
),
(
  'Men Slim Fit Casual Shirt',
  'men-slim-fit-casual-shirt',
  'Soft cotton blend shirt for office and casual wear.',
  799, 1999, 260,
  (select id from c where slug = 'fashion'),
  'Roadster',
  4.0, 4620,
  array['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/shirtmenslim/1200/900'],
  '{"fabric":"Cotton Blend","fit":"Slim Fit","sleeve":"Full Sleeve","pattern":"Solid"}'::jsonb
),
(
  'Women Printed Kurta Set',
  'women-printed-kurta-set',
  'Elegant ethnic kurta set with dupatta for festive and daily wear.',
  1299, 2899, 180,
  (select id from c where slug = 'fashion'),
  'Libas',
  4.3, 3105,
  array['https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/kurtaset/1200/900'],
  '{"fabric":"Rayon","occasion":"Casual/Festive","set":"Kurta, Pant, Dupatta","wash":"Machine Wash"}'::jsonb
),
(
  'Levis Men 511 Slim Jeans',
  'levis-men-511-slim-jeans',
  'Classic slim-fit stretch denim jeans with all-day comfort.',
  2499, 3999, 140,
  (select id from c where slug = 'fashion'),
  'Levis',
  4.4, 2011,
  array['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/levis511/1200/900'],
  '{"fit":"Slim","material":"98% Cotton 2% Elastane","rise":"Mid Rise","closure":"Button and Zip"}'::jsonb
),
(
  'Puma Running Shoes For Men',
  'puma-running-shoes-men',
  'Lightweight running shoes with cushioned sole and breathable upper.',
  2199, 5999, 95,
  (select id from c where slug = 'fashion'),
  'Puma',
  4.2, 3670,
  array['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/pumarun/1200/900'],
  '{"type":"Running Shoes","sole":"Rubber","upper":"Mesh","warranty":"3 Months"}'::jsonb
),
(
  'Titan Neo Analog Watch',
  'titan-neo-analog-watch',
  'Premium analog watch with stainless steel strap and mineral glass.',
  4599, 6495, 56,
  (select id from c where slug = 'fashion'),
  'Titan',
  4.5, 980,
  array['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/titanneo/1200/900'],
  '{"dial":"Round","strap":"Stainless Steel","water_resistance":"50 m","movement":"Quartz"}'::jsonb
),
(
  'Wildcraft 45L Travel Backpack',
  'wildcraft-45l-travel-backpack',
  'Spacious travel backpack with padded shoulder straps and rain cover.',
  1799, 3499, 88,
  (select id from c where slug = 'fashion'),
  'Wildcraft',
  4.3, 1495,
  array['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/wild45/1200/900'],
  '{"capacity":"45 L","material":"Polyester","compartments":"3","waterproof":"Yes"}'::jsonb
),
(
  'Prestige Popular Pressure Cooker 5L',
  'prestige-popular-pressure-cooker-5l',
  'Durable aluminum cooker with precision weight valve and safety features.',
  1699, 2450, 150,
  (select id from c where slug = 'home-kitchen'),
  'Prestige',
  4.4, 5880,
  array['https://images.unsplash.com/photo-1585659722983-3a675dabf23d?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/prestige5l/1200/900'],
  '{"capacity":"5 L","material":"Aluminium","base":"Gas Stove Compatible","warranty":"5 Years"}'::jsonb
),
(
  'Philips Air Fryer HD9200',
  'philips-air-fryer-hd9200',
  'Healthy frying with Rapid Air technology and easy touch controls.',
  7999, 13995, 40,
  (select id from c where slug = 'home-kitchen'),
  'Philips',
  4.6, 2400,
  array['https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/airfryer9200/1200/900'],
  '{"capacity":"4.1 L","power":"1400 W","control":"Manual","warranty":"2 Years"}'::jsonb
),
(
  'Sleepyhead Orthopedic Mattress Queen',
  'sleepyhead-orthopedic-mattress-queen',
  'High-resilience foam mattress for pressure relief and spinal support.',
  10999, 22999, 25,
  (select id from c where slug = 'home-kitchen'),
  'Sleepyhead',
  4.2, 712,
  array['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/mattressqueen/1200/900'],
  '{"size":"Queen","material":"Memory Foam","thickness":"8 inch","warranty":"10 Years"}'::jsonb
),
(
  'Cello Stainless Steel Water Bottle 1L',
  'cello-stainless-steel-water-bottle-1l',
  'Leak-proof stainless steel bottle for office, gym and travel.',
  499, 899, 320,
  (select id from c where slug = 'home-kitchen'),
  'Cello',
  4.1, 1840,
  array['https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/cellobottle/1200/900'],
  '{"capacity":"1 L","material":"Stainless Steel","insulation":"Single Wall","leakproof":"Yes"}'::jsonb
),
(
  'Urban Ladder Wooden Coffee Table',
  'urban-ladder-wooden-coffee-table',
  'Modern engineered wood coffee table with smooth finish.',
  4999, 8999, 34,
  (select id from c where slug = 'home-kitchen'),
  'Urban Ladder',
  4.0, 408,
  array['https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/coffeetable/1200/900'],
  '{"material":"Engineered Wood","shape":"Rectangular","assembly":"DIY","color":"Walnut"}'::jsonb
),
(
  'Milton Thermosteel Flask 1.5L',
  'milton-thermosteel-flask-1-5l',
  'Vacuum insulated flask keeps beverages hot/cold for long hours.',
  999, 1699, 190,
  (select id from c where slug = 'home-kitchen'),
  'Milton',
  4.3, 1562,
  array['https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/miltonflask/1200/900'],
  '{"capacity":"1.5 L","material":"SS 304","insulation":"Double Wall","retention":"24 Hours"}'::jsonb
),
(
  'Atomic Habits by James Clear',
  'atomic-habits-james-clear',
  'A practical guide to building good habits and breaking bad ones.',
  499, 899, 500,
  (select id from c where slug = 'books'),
  'Random House',
  4.8, 15020,
  array['https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/atomichabits/1200/900'],
  '{"author":"James Clear","language":"English","pages":"320","format":"Paperback"}'::jsonb
),
(
  'The Psychology of Money',
  'the-psychology-of-money',
  'Timeless lessons on wealth, greed and happiness.',
  399, 699, 410,
  (select id from c where slug = 'books'),
  'Jaico',
  4.7, 11342,
  array['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/psychmoney/1200/900'],
  '{"author":"Morgan Housel","language":"English","pages":"256","format":"Paperback"}'::jsonb
),
(
  'Ikigai: The Japanese Secret to a Long and Happy Life',
  'ikigai-japanese-secret',
  'Discover your purpose and live with joy through Japanese wisdom.',
  329, 599, 360,
  (select id from c where slug = 'books'),
  'Penguin',
  4.5, 9201,
  array['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/ikigai/1200/900'],
  '{"author":"Hector Garcia","language":"English","pages":"208","format":"Paperback"}'::jsonb
),
(
  'Rich Dad Poor Dad',
  'rich-dad-poor-dad',
  'Classic personal finance book on mindset and money principles.',
  349, 599, 450,
  (select id from c where slug = 'books'),
  'Plata Publishing',
  4.6, 20054,
  array['https://images.unsplash.com/photo-1455885666463-9af4d24e4f90?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/richdad/1200/900'],
  '{"author":"Robert T. Kiyosaki","language":"English","pages":"336","format":"Paperback"}'::jsonb
),
(
  'Do Epic Shit by Ankur Warikoo',
  'do-epic-shit-ankur-warikoo',
  'Straight-talk life and career advice from real experiences.',
  259, 499, 390,
  (select id from c where slug = 'books'),
  'Juggernaut',
  4.4, 7044,
  array['https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/doepic/1200/900'],
  '{"author":"Ankur Warikoo","language":"English","pages":"216","format":"Paperback"}'::jsonb
),
(
  'The Alchemist',
  'the-alchemist-paulo-coelho',
  'Inspirational novel about following your dreams.',
  249, 399, 420,
  (select id from c where slug = 'books'),
  'HarperCollins',
  4.7, 18760,
  array['https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/alchemist/1200/900'],
  '{"author":"Paulo Coelho","language":"English","pages":"208","format":"Paperback"}'::jsonb
),
(
  'Nivia Storm Football Size 5',
  'nivia-storm-football-size-5',
  'Durable stitched football suitable for training and matches.',
  799, 1299, 140,
  (select id from c where slug = 'sports'),
  'Nivia',
  4.2, 2412,
  array['https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/niviafootball/1200/900'],
  '{"size":"5","material":"PU","surface":"Grass","weight":"410-450 g"}'::jsonb
),
(
  'Yonex GR 303 Badminton Racquet (Pack of 2)',
  'yonex-gr-303-racquet-pack-2',
  'Beginner-friendly lightweight racquets for regular play.',
  1299, 2290, 130,
  (select id from c where slug = 'sports'),
  'Yonex',
  4.3, 3894,
  array['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/yonex303/1200/900'],
  '{"weight":"95 g","material":"Aluminium","pack":"2 Racquets","cover":"Included"}'::jsonb
),
(
  'Cosco Cricket Bat Kashmir Willow',
  'cosco-cricket-bat-kashmir-willow',
  'Powerful stroke bat for tennis and soft-leather ball matches.',
  1599, 2899, 84,
  (select id from c where slug = 'sports'),
  'Cosco',
  4.1, 1219,
  array['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/coscobat/1200/900'],
  '{"wood":"Kashmir Willow","handle":"Cane","grip":"Rubber","weight":"1.2 kg"}'::jsonb
),
(
  'Adidas Yoga Mat 6mm',
  'adidas-yoga-mat-6mm',
  'Non-slip cushioned mat for yoga, stretching and bodyweight workouts.',
  1199, 2499, 165,
  (select id from c where slug = 'sports'),
  'Adidas',
  4.4, 1744,
  array['https://images.unsplash.com/photo-1571019613576-2b22c76fd955?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/adidasmat/1200/900'],
  '{"thickness":"6 mm","material":"TPE","length":"183 cm","anti_skid":"Yes"}'::jsonb
),
(
  'Decathlon Dumbbell Set 20kg',
  'decathlon-dumbbell-set-20kg',
  'Adjustable dumbbell set for home strength training.',
  2999, 5499, 72,
  (select id from c where slug = 'sports'),
  'Decathlon',
  4.5, 2638,
  array['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/dumbbell20/1200/900'],
  '{"total_weight":"20 kg","plates":"Cast Iron","handle":"Chrome","usage":"Home Gym"}'::jsonb
),
(
  'HRX Running T-shirt Men',
  'hrx-running-tshirt-men',
  'Quick-dry performance tee for training and outdoor runs.',
  699, 1499, 220,
  (select id from c where slug = 'sports'),
  'HRX',
  4.1, 2090,
  array['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop','https://picsum.photos/seed/hrxtshirt/1200/900'],
  '{"fabric":"Polyester","fit":"Regular","sleeve":"Half Sleeve","technology":"Quick Dry"}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  mrp = excluded.mrp,
  stock = excluded.stock,
  category_id = excluded.category_id,
  brand = excluded.brand,
  rating = excluded.rating,
  review_count = excluded.review_count,
  images = excluded.images,
  specifications = excluded.specifications;
-- Enable pgvector extension
create extension if not exists vector;

-- Separate table for product embeddings (professional pattern)
create table if not exists public.product_embeddings (
  id bigint primary key references public.products(id) on delete cascade,
  embedding vector(1024),
  embedded_at timestamptz default now()
);

-- IVFFlat index for fast approximate nearest-neighbor search
create index if not exists product_embeddings_embedding_idx
  on public.product_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- RLS: public read (same as products)
alter table public.product_embeddings enable row level security;

drop policy if exists "Public read embeddings" on public.product_embeddings;
create policy "Public read embeddings"
  on public.product_embeddings for select using (true);

-- Helper function: vector similarity search
-- Returns top K product IDs sorted by cosine similarity
create or replace function match_products(
  query_embedding vector(1024),
  match_count int default 5
)
returns table (
  id bigint,
  similarity float
)
language sql stable
as $$
  select
    pe.id,
    1 - (pe.embedding <=> query_embedding) as similarity
  from public.product_embeddings pe
  order by pe.embedding <=> query_embedding
  limit match_count;
$$;