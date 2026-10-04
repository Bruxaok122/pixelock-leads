CREATE OR REPLACE FUNCTION public.get_daily_panel_activity(day_start timestamptz, day_end timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH active_ids AS (
  SELECT id FROM public.analytics_sessions WHERE page_path = '/ufhurd' AND started_at >= day_start AND started_at < day_end
  UNION
  SELECT e.session_id FROM public.analytics_events e JOIN public.analytics_sessions s ON s.id = e.session_id
  WHERE e.created_at >= day_start AND e.created_at < day_end AND s.page_path = '/ufhurd'
), activity AS (
  SELECT s.id, s.page_path, s.started_at, s.last_seen_at, s.max_video_seconds, s.lead_id,
    (SELECT max(e.created_at) FROM public.analytics_events e WHERE e.session_id = s.id AND e.created_at >= day_start AND e.created_at < day_end) AS latest_event_at,
    (SELECT e.event_type FROM public.analytics_events e WHERE e.session_id = s.id AND e.created_at >= day_start AND e.created_at < day_end AND e.event_type <> 'video_progress' ORDER BY e.created_at DESC, e.id DESC LIMIT 1) AS last_event,
    (SELECT e.target_key FROM public.analytics_events e WHERE e.session_id = s.id AND e.created_at >= day_start AND e.created_at < day_end AND e.event_type <> 'video_progress' ORDER BY e.created_at DESC, e.id DESC LIMIT 1) AS last_target,
    EXISTS (SELECT 1 FROM public.analytics_events e WHERE e.session_id = s.id AND e.event_type = 'lead_submitted') AS has_lead_event
  FROM active_ids a JOIN public.analytics_sessions s ON s.id = a.id
), normalized AS (
  SELECT id, page_path, started_at, greatest(last_seen_at, coalesce(latest_event_at, last_seen_at)) AS activity_at,
    max_video_seconds, (lead_id IS NOT NULL OR has_lead_event) AS converted,
    coalesce(last_event, 'page_view') AS last_event, last_target
  FROM activity
), metrics AS (
  SELECT count(*) AS total, count(*) FILTER (WHERE activity_at >= now() - interval '10 seconds' AND activity_at <= now() + interval '5 seconds' AND last_event <> 'page_exit') AS online,
    count(*) FILTER (WHERE max_video_seconds > 0) AS played,
    count(*) FILTER (WHERE max_video_seconds >= 120) AS unlocked,
    count(*) FILTER (WHERE converted) AS converted,
    coalesce(round(avg(max_video_seconds)), 0) AS average_seconds
  FROM normalized
)
SELECT CASE WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN
  jsonb_build_object('metrics', (SELECT to_jsonb(metrics) FROM metrics),
    'visitors', coalesce((SELECT jsonb_agg(to_jsonb(v)) FROM (
      SELECT id AS session_id, page_path AS path, started_at AS page_viewed_at, activity_at AS last_seen_at,
        max_video_seconds > 0 AS video_played, max_video_seconds AS video_seconds, converted,
        CASE WHEN last_event = 'click' AND last_target = 'checkout' THEN 'checkout_clicked' ELSE last_event END AS last_event,
        activity_at >= now() - interval '10 seconds' AND activity_at <= now() + interval '5 seconds' AND last_event <> 'page_exit' AS is_online
      FROM normalized ORDER BY activity_at DESC LIMIT 500
    ) v), '[]'::jsonb))
ELSE NULL END
$$;
REVOKE ALL ON FUNCTION public.get_daily_panel_activity(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_panel_activity(timestamptz, timestamptz) TO authenticated;