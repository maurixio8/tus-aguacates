-- Delivery location resolutions are deliberately separate from orders/customers.
-- Shadow/manual geocoding only; no original address is overwritten.
create extension if not exists pgcrypto;

create table if not exists public.delivery_location_resolutions (
  id uuid primary key default gen_random_uuid(),
  original_address text not null,
  normalized_address text not null unique,
  latitude double precision,
  longitude double precision,
  provider text not null default 'manual',
  confidence text not null default 'baja' check (confidence in ('alta','media','baja','sin_coordenadas')),
  status text not null default 'sin_coordenadas' check (status in ('sin_coordenadas','candidata','confirmada','rechazada')),
  candidates jsonb not null default '[]'::jsonb,
  resolved_at timestamptz,
  confirmed_by text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delivery_location_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create index if not exists delivery_location_resolutions_status_idx
  on public.delivery_location_resolutions(status);

alter table public.delivery_location_resolutions enable row level security;
revoke all on public.delivery_location_resolutions from anon, authenticated;
