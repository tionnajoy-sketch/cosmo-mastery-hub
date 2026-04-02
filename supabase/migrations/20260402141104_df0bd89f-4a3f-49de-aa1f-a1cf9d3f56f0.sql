
-- Create tts_cache table
CREATE TABLE public.tts_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash text NOT NULL,
  text_preview text NOT NULL DEFAULT '',
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_tts_cache_text_hash ON public.tts_cache (text_hash);

-- Enable RLS but no public policies — only service role can access
ALTER TABLE public.tts_cache ENABLE ROW LEVEL SECURITY;

-- Create private storage bucket for cached audio
INSERT INTO storage.buckets (id, name, public) VALUES ('tts-cache', 'tts-cache', false);
