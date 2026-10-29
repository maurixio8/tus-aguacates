create table if not exists public.whatsapp_audit_findings (
 id uuid primary key default gen_random_uuid(), source_event_id text not null unique,
 severity text not null check (severity in ('rojo','amarillo','verde')),
 category text not null, customer_masked text not null, received_at timestamptz,
 incoming_text text, luz_response text, flags text[] not null default '{}', recommendations text[] not null default '{}',
 model text, provider text, provider_status text, review_status text not null default 'pending' check (review_status in ('pending','approved','dismissed')),
 scope text not null default 'global' check (scope in ('global','conversation','customer')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists whatsapp_audit_findings_idx on public.whatsapp_audit_findings(severity,review_status,received_at desc);
create table if not exists public.whatsapp_recovery_opportunities (
 id uuid primary key default gen_random_uuid(), opportunity_key text not null unique,
 customer_masked text not null, last_seen_at timestamptz, intent_score integer not null, intent_level text not null,
 evidence text, order_state text, recommendation text, status text not null default 'pending_human_review' check(status in ('pending_human_review','approved','resolved','dismissed')),
 assigned_to text, resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists whatsapp_recovery_idx on public.whatsapp_recovery_opportunities(status,intent_level,last_seen_at desc);
alter table public.whatsapp_audit_findings enable row level security;
alter table public.whatsapp_recovery_opportunities enable row level security;
revoke all on public.whatsapp_audit_findings from anon, authenticated;
revoke all on public.whatsapp_recovery_opportunities from anon, authenticated;
