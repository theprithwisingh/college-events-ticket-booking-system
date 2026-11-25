create extension if not exists pgcrypto;

create type public.profile_role as enum ('STUDENT', 'VOLUNTEER', 'ADMIN');
create type public.booking_status as enum (
  'PENDING',
  'CONFIRMED',
  'EXPIRED',
  'MANUAL_REFUND_NEEDED'
);
create type public.ticket_status as enum ('VALID', 'CHECKED_IN', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  roll_number text,
  department text,
  semester text,
  role public.profile_role not null default 'STUDENT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  venue_name text not null,
  starts_at timestamptz not null,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_internal boolean not null default false,
  price_inr integer not null check (price_inr >= 0),
  total_capacity integer not null check (total_capacity > 0),
  max_per_order integer not null check (max_per_order between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  tier_id uuid not null,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 6),
  total_amount_inr integer not null check (total_amount_inr >= 0),
  status public.booking_status not null default 'PENDING',
  attendees_json jsonb not null default '[]'::jsonb,
  razorpay_order_id text,
  razorpay_payment_id text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (event_id) references public.events(id) on delete restrict,
  foreign key (event_id, tier_id) references public.ticket_tiers(event_id, id) on delete restrict
);

create unique index bookings_razorpay_payment_id_uidx
  on public.bookings (razorpay_payment_id)
  where razorpay_payment_id is not null;

create index bookings_tier_status_expires_idx
  on public.bookings (tier_id, status, expires_at);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_id uuid not null,
  tier_id uuid not null,
  ticket_code text not null check (char_length(ticket_code) = 6),
  attendee_name text not null,
  attendee_roll_no text,
  attendee_dept text,
  attendee_semester text,
  qr_signature text not null,
  status public.ticket_status not null default 'VALID',
  checked_in_at timestamptz,
  scanned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (event_id) references public.events(id) on delete restrict,
  foreign key (event_id, tier_id) references public.ticket_tiers(event_id, id) on delete restrict
);

create index tickets_event_status_idx
  on public.tickets (event_id, status);

create index tickets_ticket_code_idx
  on public.tickets (ticket_code);

create function public.validate_booking_tier()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.ticket_tiers
    where id = new.tier_id
      and event_id = new.event_id
      and new.quantity between 1 and max_per_order
  ) then
    raise exception 'booking quantity must be between 1 and the tier max_per_order'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_booking_tier
before insert or update of event_id, tier_id, quantity
on public.bookings
for each row
execute function public.validate_booking_tier();
