create table if not exists public.whatsapp_audit_context (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null unique,
  customer_masked text not null,
  last_seen_at timestamptz,
  summary text not null default '',
  intent text not null default '',
  customer_goal text not null default '',
  friction text not null default '',
  current_state text not null default '',
  risk_level text not null default 'low' check (risk_level in ('low','medium','high')),
  evidence text not null default '',
  suggested_reply text not null default '',
  action_plan text not null default '',
  context_status text not null default 'generated' check (context_status in ('generated','reviewed','stale')),
  context_model text not null default 'rules-context-v1',
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists whatsapp_audit_context_risk_idx on public.whatsapp_audit_context(risk_level, last_seen_at desc);
alter table public.whatsapp_audit_context enable row level security;
revoke all on public.whatsapp_audit_context from anon, authenticated;
