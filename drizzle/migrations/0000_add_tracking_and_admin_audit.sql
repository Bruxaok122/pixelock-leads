CREATE TABLE public.tracking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  meta_pixel_id TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tracking_settings_pixel_format CHECK (meta_pixel_id IS NULL OR meta_pixel_id ~ '^[0-9]{5,30}$')
);
GRANT SELECT ON public.tracking_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracking_settings TO authenticated;
GRANT ALL ON public.tracking_settings TO service_role;
ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tracking settings" ON public.tracking_settings FOR SELECT TO anon, authenticated USING (setting_key = 'main');
CREATE POLICY "Admins can insert tracking settings" ON public.tracking_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tracking settings" ON public.tracking_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tracking settings" ON public.tracking_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.analytics_sessions (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL DEFAULT '/ufhurd',
  referrer TEXT,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  max_video_seconds INTEGER NOT NULL DEFAULT 0 CHECK (max_video_seconds >= 0),
  max_scroll_percent SMALLINT NOT NULL DEFAULT 0 CHECK (max_scroll_percent BETWEEN 0 AND 100),
  click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.analytics_sessions TO authenticated;
GRANT ALL ON public.analytics_sessions TO service_role;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view analytics sessions" ON public.analytics_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX analytics_sessions_started_idx ON public.analytics_sessions (started_at DESC);
CREATE INDEX analytics_sessions_lead_idx ON public.analytics_sessions (lead_id);

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','click','scroll','pointer_sample','video_progress','form_unlocked','lead_submitted','page_hidden')),
  target_key TEXT,
  x_percent SMALLINT CHECK (x_percent IS NULL OR x_percent BETWEEN 0 AND 100),
  y_percent SMALLINT CHECK (y_percent IS NULL OR y_percent BETWEEN 0 AND 100),
  numeric_value INTEGER CHECK (numeric_value IS NULL OR numeric_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view analytics events" ON public.analytics_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX analytics_events_session_idx ON public.analytics_events (session_id, created_at);
CREATE INDEX analytics_events_created_idx ON public.analytics_events (created_at DESC);

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('lead_deleted','all_leads_deleted','tracking_settings_updated','tracking_settings_removed')),
  target_id UUID,
  affected_count INTEGER NOT NULL DEFAULT 1 CHECK (affected_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX admin_audit_created_idx ON public.admin_audit_log (created_at DESC);