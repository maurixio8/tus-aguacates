create table if not exists public.ripeness_proposals (
  id uuid primary key default gen_random_uuid(),
  source_proposal_id integer not null unique,
  source_event_id text not null unique,
  conversation_key text not null,
  customer_masked text not null,
  preference text not null check (preference in ('verde','pinton','maduro','mixto')),
  confidence text not null,
  source text,
  evidence text,
  proposal_text text not null,
  context_patch_json jsonb not null default '{}'::jsonb,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','applied')),
  approved_by text,
  approved_at timestamptz,
  target_type text check (target_type in ('customer','preorder','order')),
  target_id text,
  applied_to_customer boolean not null default false,
  applied_to_order boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ripeness_proposals_status_idx on public.ripeness_proposals(approval_status, created_at desc);
alter table public.ripeness_proposals enable row level security;
revoke all on public.ripeness_proposals from anon, authenticated;
