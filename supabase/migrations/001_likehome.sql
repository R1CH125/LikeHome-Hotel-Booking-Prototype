create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) >= 2),
  email text not null,
  reward_points_balance integer not null default 0 check (reward_points_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  location text not null,
  description text not null,
  rating numeric(2,1) not null check (rating between 0 and 5),
  amenities text[] not null default '{}',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists hotel_images (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  image_url text not null,
  alt_text text not null,
  display_order integer not null default 0
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  room_type text not null,
  description text not null,
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  guest_capacity integer not null check (guest_capacity >= 1),
  total_inventory integer not null default 1 check (total_inventory >= 1),
  image_url text not null,
  active boolean not null default true
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  confirmation_number text unique not null,
  user_id uuid not null references profiles(id),
  hotel_id uuid not null references hotels(id),
  room_id uuid not null references rooms(id),
  check_in_date date not null,
  check_out_date date not null,
  guest_count integer not null check (guest_count >= 1),
  number_of_nights integer not null check (number_of_nights >= 1),
  subtotal numeric(10,2) not null,
  reward_discount numeric(10,2) not null default 0,
  cancellation_charge numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','partially_refunded','refunded','failed')),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check (check_out_date > check_in_date)
);

create table if not exists reward_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  reservation_id uuid references reservations(id),
  transaction_type text not null check (transaction_type in ('earned','redeemed','reversed','adjusted')),
  points integer not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_records (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id),
  user_id uuid not null references profiles(id),
  amount numeric(10,2) not null,
  payment_type text not null check (payment_type in ('charge','cancellation_charge','refund')),
  payment_status text not null,
  stripe_reference text,
  created_at timestamptz not null default now()
);

create index if not exists hotels_location_idx on hotels(location);
create index if not exists reservations_user_idx on reservations(user_id);
create index if not exists reservations_room_idx on reservations(room_id);
create index if not exists reservations_dates_idx on reservations(check_in_date, check_out_date);
create index if not exists rooms_hotel_idx on rooms(hotel_id);

alter table profiles enable row level security;
alter table reservations enable row level security;
alter table reward_transactions enable row level security;
alter table payment_records enable row level security;
alter table hotels enable row level security;
alter table rooms enable row level security;
alter table hotel_images enable row level security;

create policy "profiles are private" on profiles for select using (auth.uid() = id);
create policy "profiles update own row" on profiles for update using (auth.uid() = id);
create policy "reservations are private" on reservations for select using (auth.uid() = user_id);
create policy "rewards are private" on reward_transactions for select using (auth.uid() = user_id);
create policy "payments are private" on payment_records for select using (auth.uid() = user_id);
create policy "hotels are public" on hotels for select using (true);
create policy "rooms are public" on rooms for select using (active = true);
create policy "hotel images are public" on hotel_images for select using (true);