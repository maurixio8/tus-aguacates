-- Additive offline-safe promo configuration for purchase sessions.
-- This migration is not executed by the application and does not write production data.

create table if not exists public.purchase_sessions (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid references public.purchase_jornadas(id) on delete cascade,
  promo_gift_enabled boolean not null default false,
  promo_gift_product_id uuid,
  promo_gift_qty_per_trigger numeric(12, 3) not null default 1 check (promo_gift_qty_per_trigger >= 0),
  promo_trigger_product_name text not null default 'Caja de 24',
  promo_trigger_variant_name text,
  promo_trigger_variant_value text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_session_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.purchase_sessions(id) on delete cascade,
  source_order_id uuid,
  source_order_line_id uuid,
  product_id uuid,
  product_name text not null,
  variant_name text,
  variant_value text,
  quantity numeric(12, 3) not null check (quantity >= 0),
  unit text not null,
  supplier_id text,
  sub_location_hint text,
  is_promo_gift boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, source_order_line_id, product_name, variant_value)
);

create index if not exists purchase_sessions_jornada_idx on public.purchase_sessions (jornada_id);
create index if not exists purchase_session_lines_session_idx on public.purchase_session_lines (session_id, supplier_id);
comment on table public.purchase_sessions is 'Draft/offline purchase-session configuration; no production API writes are implied.';
