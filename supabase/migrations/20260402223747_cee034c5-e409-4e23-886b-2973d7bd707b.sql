
-- Add new columns to tts_cache for enhanced tracking
ALTER TABLE public.tts_cache
  ADD COLUMN IF NOT EXISTS voice_id text NOT NULL DEFAULT 'b3Sj49ffEoyFHYHBRE2z',
  ADD COLUMN IF NOT EXISTS usage_type text NOT NULL DEFAULT 'dynamic',
  ADD COLUMN IF NOT EXISTS is_always_cache boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cache_hits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS voice_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz NOT NULL DEFAULT now();

-- Index for fast lookups by usage type and voice
CREATE INDEX IF NOT EXISTS idx_tts_cache_usage_type ON public.tts_cache(usage_type);
CREATE INDEX IF NOT EXISTS idx_tts_cache_voice_id ON public.tts_cache(voice_id);
CREATE INDEX IF NOT EXISTS idx_tts_cache_always_cache ON public.tts_cache(is_always_cache) WHERE is_always_cache = true;
