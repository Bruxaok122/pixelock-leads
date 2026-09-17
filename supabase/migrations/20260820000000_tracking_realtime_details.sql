alter table public.analytics_sessions
  add column if not exists ip_address text,
  add column if not exists return_visit boolean not null default false;

create index if not exists analytics_sessions_ip_address_idx
  on public.analytics_sessions (ip_address);

alter publication supabase_realtime add table public.analytics_events;