create table if not exists public.panel_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

create index if not exists panel_audit_logs_created_at_idx
  on public.panel_audit_logs (created_at desc);

alter table public.panel_audit_logs enable row level security;