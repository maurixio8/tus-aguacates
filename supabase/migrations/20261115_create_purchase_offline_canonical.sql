-- Canonical additive buyer purchase schema.
-- The live project already contains an unrelated public.purchase_items table.
-- Therefore this pilot schema is isolated under purchase_offline and never alters
-- or reuses any existing public business table.

create schema if not exists purchase_offline;

create table if not exists purchase_offline.purchase_sessions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  delivery_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  cash_advanced numeric(14,2) not null default 0 check (cash_advanced >= 0),
  operational_expenses jsonb not null default '{}'::jsonb,
  actual_total_paid numeric(14,2) not null default 0 check (actual_total_paid >= 0),
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

create table if not exists purchase_offline.purchase_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references purchase_offline.purchase_sessions(id) on delete cascade,
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
  surplus_qty numeric(12,3) generated always as (greatest(purchased_qty - requested_qty, 0)) stored,
  weight_kg numeric(12,3) check (weight_kg is null or weight_kg >= 0),
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

create table if not exists purchase_offline.purchase_price_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references purchase_offline.purchase_sessions(id) on delete cascade,
  purchase_item_id uuid not null references purchase_offline.purchase_items(id) on delete cascade,
  blind_price numeric(14,2) not null check (blind_price >= 0),
  actual_total_paid numeric(14,2) check (actual_total_paid is null or actual_total_paid >= 0),
  weight_kg numeric(12,3) check (weight_kg is null or weight_kg >= 0),
  observed_at timestamptz not null default now(),
  evidence_photo_url text,
  notes text
);

create table if not exists purchase_offline.packing_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references purchase_offline.purchase_sessions(id) on delete cascade,
  source_order_id uuid,
  source_order_line_id uuid,
  source_order_number text,
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

create index if not exists purchase_offline_sessions_buyer_date_idx
  on purchase_offline.purchase_sessions (buyer_id, delivery_date);
create index if not exists purchase_offline_items_session_supplier_idx
  on purchase_offline.purchase_items (session_id, supplier_id);
create index if not exists purchase_offline_items_source_order_idx
  on purchase_offline.purchase_items (source_order_id, source_order_line_id);
create index if not exists purchase_offline_price_observations_session_idx
  on purchase_offline.purchase_price_observations (session_id, observed_at desc);
create index if not exists purchase_offline_packing_items_session_status_idx
  on purchase_offline.packing_items (session_id, status);
create index if not exists purchase_offline_packing_items_source_order_idx
  on purchase_offline.packing_items (source_order_id, source_order_line_id);

comment on schema purchase_offline is 'Isolated additive schema for the buyer purchase pilot; existing public.purchase_items remains untouched.';
comment on table purchase_offline.purchase_sessions is 'Additive offline purchase sessions owned by a buyer; orders and products remain authoritative.';
comment on column purchase_offline.purchase_sessions.promo_gift_qty_per_trigger is 'Gift quantity per trigger; supports a package of 5-6 duraznos per Caja 24.';
comment on table purchase_offline.purchase_items is 'Read/write purchase capture lines with source-order lineage and generated shortage/surplus quantities.';
comment on column purchase_offline.purchase_items.weight_kg is 'Measured avocado or produce weight captured from the physical scale.';
comment on table purchase_offline.purchase_price_observations is 'Blind supplier price observations and actual paid totals, append-only by application policy.';
comment on table purchase_offline.packing_items is 'Packing projection with source-order/customer lineage and generated shortage quantity.';

-- The application reads this projection through service-role RPC so the private
-- pilot schema does not need to be exposed as a public PostgREST schema.
create or replace function public.get_buyer_purchase_projection(
  p_buyer_id uuid,
  p_delivery_date date default null
)
returns jsonb
language sql
security definer
set search_path = public, purchase_offline
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'delivery_date', s.delivery_date,
      'status', s.status,
      'cash_advanced', s.cash_advanced,
      'actual_total_paid', s.actual_total_paid,
      'promo_gift_enabled', s.promo_gift_enabled,
      'promo_gift_qty_per_trigger', s.promo_gift_qty_per_trigger,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', i.id,
          'source_order_id', i.source_order_id,
          'product_id', i.product_id,
          'product_name', i.product_name,
          'variant_name', i.variant_name,
          'variant_value', i.variant_value,
          'requested_qty', i.requested_qty,
          'purchased_qty', i.purchased_qty,
          'missing_qty', i.missing_qty,
          'surplus_qty', i.surplus_qty,
          'weight_kg', i.weight_kg,
          'unit', i.unit,
          'supplier_id', i.supplier_id,
          'sub_location_hint', i.sub_location_hint,
          'ripeness_note_snapshot', i.ripeness_note_snapshot,
          'is_promo_gift', i.is_promo_gift
        ) order by i.product_name)
        from purchase_offline.purchase_items i
        where i.session_id = s.id
      ), '[]'::jsonb),
      'packing_items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', p.id,
          'source_order_id', p.source_order_id,
          'source_order_number', p.source_order_number,
          'customer_name', p.customer_name,
          'product_id', p.product_id,
          'product_name', p.product_name,
          'variant_name', p.variant_name,
          'variant_value', p.variant_value,
          'requested_qty', p.requested_qty,
          'picked_qty', p.picked_qty,
          'missing_qty', p.missing_qty,
          'ripeness_note_snapshot', p.ripeness_note_snapshot,
          'is_promo_gift', p.is_promo_gift,
          'status', p.status
        ) order by p.source_order_number nulls last, p.customer_name nulls last, p.product_name)
        from purchase_offline.packing_items p
        where p.session_id = s.id
      ), '[]'::jsonb)
    ) order by s.delivery_date desc
  ), '[]'::jsonb)
  from purchase_offline.purchase_sessions s
  where s.buyer_id = p_buyer_id
    and (p_delivery_date is null or s.delivery_date = p_delivery_date);
$$;

revoke all on function public.get_buyer_purchase_projection(uuid, date) from public, anon, authenticated;
grant execute on function public.get_buyer_purchase_projection(uuid, date) to service_role;
