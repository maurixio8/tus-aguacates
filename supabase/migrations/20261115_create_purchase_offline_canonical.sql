-- Canonical additive buyer purchase schema. Apply once after existing business tables.
-- No orders/products tables are altered or dropped.

create table if not exists public.purchase_sessions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  delivery_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  cash_advanced numeric(14,2) not null default 0 check (cash_advanced >= 0),
  operational_expenses jsonb not null default '{}'::jsonb,
  promo_gift_enabled boolean not null default false,
  promo_gift_product_id uuid,
  promo_gift_qty_per_trigger numeric(12,3) not null default 5 check (promo_gift_qty_per_trigger >= 0),
  promo_trigger_product_id uuid,
  promo_trigger_product_name text,
  promo_trigger_variant_id uuid,
  promo_trigger_variant_name text,
  promo_trigger_variant_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.purchase_sessions(id) on delete cascade,
  source_order_id uuid,
  source_order_line_id uuid,
  product_id uuid,
  product_name text not null,
  variant_id uuid,
  variant_name text,
  variant_value text,
  requested_qty numeric(12,3) not null default 0 check (requested_qty >= 0),
  purchased_qty numeric(12,3) not null default 0 check (purchased_qty >= 0),
  missing_qty numeric(12,3) generated always as (greatest(requested_qty - purchased_qty, 0)) stored,
  supplier_id text,
  sub_location_hint text,
  ripeness_note_snapshot text,
  evidence_photo_url text,
  is_promo_gift boolean not null default false,
  unit text not null default 'unit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, source_order_line_id, product_id, variant_id, product_name, variant_value)
);

create table if not exists public.purchase_price_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.purchase_sessions(id) on delete cascade,
  purchase_item_id uuid not null references public.purchase_items(id) on delete cascade,
  blind_price numeric(14,2) not null check (blind_price >= 0),
  observed_at timestamptz not null default now(),
  evidence_photo_url text,
  notes text
);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.purchase_sessions(id) on delete cascade,
  source_order_id uuid,
  source_order_line_id uuid,
  customer_id uuid,
  customer_name text,
  product_id uuid,
  product_name text not null,
  variant_id uuid,
  variant_name text,
  variant_value text,
  requested_qty numeric(12,3) not null default 0 check (requested_qty >= 0),
  picked_qty numeric(12,3) not null default 0 check (picked_qty >= 0),
  missing_qty numeric(12,3) generated always as (greatest(requested_qty - picked_qty, 0)) stored,
  ripeness_note_snapshot text,
  evidence_photo_url text,
  is_promo_gift boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'picked', 'missing', 'packed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, source_order_line_id, product_id, variant_id, customer_id, product_name, variant_value)
);

create index if not exists purchase_sessions_buyer_date_idx on public.purchase_sessions (buyer_id, delivery_date);
create index if not exists purchase_items_session_supplier_idx on public.purchase_items (session_id, supplier_id);
create index if not exists purchase_items_source_order_idx on public.purchase_items (source_order_id, source_order_line_id);
create index if not exists purchase_price_observations_session_idx on public.purchase_price_observations (session_id, observed_at desc);
create index if not exists packing_items_session_status_idx on public.packing_items (session_id, status);
create index if not exists packing_items_source_order_idx on public.packing_items (source_order_id, source_order_line_id);

comment on table public.purchase_sessions is 'Additive offline purchase sessions owned by a buyer; orders and products remain authoritative.';
comment on column public.purchase_sessions.promo_gift_qty_per_trigger is 'Gift quantity per trigger; supports a package of 5-6 duraznos per Caja 24.';
comment on table public.purchase_items is 'Read/write purchase capture lines with source-order lineage and generated shortage quantity.';
comment on table public.purchase_price_observations is 'Blind supplier price observations, append-only by application policy.';
comment on table public.packing_items is 'Packing projection with source-order/customer lineage and generated shortage quantity.';
