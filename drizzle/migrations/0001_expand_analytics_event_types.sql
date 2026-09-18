ALTER TABLE public.analytics_events
  DROP CONSTRAINT analytics_events_event_type_check;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'page_view'::text,
    'click'::text,
    'scroll'::text,
    'pointer_sample'::text,
    'video_progress'::text,
    'video_played'::text,
    'video_paused'::text,
    'form_unlocked'::text,
    'pix_focused'::text,
    'pix_typing'::text,
    'pix_typing_stopped'::text,
    'pix_blurred'::text,
    'whatsapp_focused'::text,
    'whatsapp_typing'::text,
    'whatsapp_typing_stopped'::text,
    'whatsapp_blurred'::text,
    'page_scrolled'::text,
    'back_intercepted'::text,
    'page_exit'::text,
    'lead_submitted'::text,
    'page_hidden'::text
  ]));