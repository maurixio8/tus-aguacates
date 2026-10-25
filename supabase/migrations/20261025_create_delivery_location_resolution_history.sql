-- Immutable audit trail for every delivery-location resolution attempt.
create table if not exists public.delivery_location_resolution_history (
  id uuid primary key default gen_random_uuid(),
  resolution_id uuid,
  event text not null,
  original_address text not null,
  corrected_address text,
  normalized_address text not null,
  latitude double precision,
  longitude double precision,
  provider text,
  confidence text,
  status text not null,
  candidates jsonb not null default '[]'::jsonb,
  resolved_at timestamptz,
  confirmed_by text,
  rejection_reason text,
  captured_at timestamptz not null default now(),
  is_current boolean not null default false
);

create index if not exists delivery_location_resolution_history_resolution_idx
  on public.delivery_location_resolution_history(resolution_id, captured_at desc);
create index if not exists delivery_location_resolution_history_original_idx
  on public.delivery_location_resolution_history(original_address);

alter table public.delivery_location_resolution_history enable row level security;
revoke all on public.delivery_location_resolution_history from anon, authenticated;
