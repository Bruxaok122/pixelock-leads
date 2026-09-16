create table if not exists public.tracking_settings (
  id boolean primary key default true check (id),
  pixel_id text,
  pixel_enabled boolean not null default false,
  tracked_events jsonb not null default '["PageView","ViewContent","InitiateCheckout","Lead"]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.tracking_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.visitor_sessions (
  session_id text primary key,
  path text not null,
  ip_address text,
  user_agent text,
  page_viewed_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  video_played boolean not null default false,
  video_seconds integer not null default 0,
  converted boolean not null default false
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tracking_settings enable row level security;
alter table public.visitor_sessions enable row level security;
alter table public.tracking_events enable row level security;

create policy "Admins can read tracking settings"
on public.tracking_settings for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage tracking settings"
on public.tracking_settings for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can read visitor sessions"
on public.visitor_sessions for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can read tracking events"
on public.tracking_events for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index if not exists visitor_sessions_last_seen_idx
on public.visitor_sessions (last_seen_at desc);

create index if not exists tracking_events_created_at_idx
on public.tracking_events (created_at desc);

alter publication supabase_realtime add table public.visitor_sessions;