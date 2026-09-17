DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'analytics_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
  END IF;
END
$$;