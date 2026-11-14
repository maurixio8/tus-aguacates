-- Phase 2 design artifact: purchase jornada projection.
-- This migration is intentionally additive. It does not alter orders, products, or n8n.

create table if not exists public.purchase_jornadas (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  delivery_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_jornada_lines (
  id uuid primary key default gen_random_uuid(),
  jornada_id uuid not null references public.purchase_jornadas(id) on delete cascade,
  source_order_id uuid not null,
  source_order_line_id uuid not null,
  product_id uuid,
  product_name text not null,
  requested_quantity numeric(12, 3) not null check (requested_quantity >= 0),
  purchased_quantity numeric(12, 3) check (purchased_quantity is null or purchased_quantity >= 0),
  shortage_quantity numeric(12, 3) generated always as (
    greatest(requested_quantity - coalesce(purchased_quantity, 0), 0)
  ) stored,
  unit text not null,
  zone text not null check (zone in ('Bodega del Aguacate', 'Bodega Popular')),
  aggregate_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jornada_id, source_order_line_id)
);

create table if not exists public.purchase_jornada_review_rules (
  jornada_id uuid not null references public.purchase_jornadas(id) on delete cascade,
  rule_id text not null check (rule_id in ('R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8')),
  passed boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  primary key (jornada_id, rule_id)
);

create index if not exists purchase_jornadas_buyer_date_idx
  on public.purchase_jornadas (buyer_id, delivery_date);

create index if not exists purchase_jornada_lines_aggregate_idx
  on public.purchase_jornada_lines (jornada_id, aggregate_key, zone);

comment on table public.purchase_jornadas is 'Offline purchase journey design projection; source orders remain authoritative.';
comment on table public.purchase_jornada_lines is 'Expanded, zone-assigned purchase lines with idempotent source lineage.';
comment on table public.purchase_jornada_review_rules is 'Executable review evidence for the eight Phase 2 reviewer rules.';
