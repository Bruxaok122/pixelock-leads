-- Adiciona coluna para rastro do último evento na sessão para performance e realtime imediato
ALTER TABLE public.analytics_sessions 
ADD COLUMN IF NOT EXISTS last_event_type text DEFAULT 'page_view';

-- Garante que a tabela está na publicação de realtime (caso não esteja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'analytics_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_sessions;
  END IF;
END $$;
