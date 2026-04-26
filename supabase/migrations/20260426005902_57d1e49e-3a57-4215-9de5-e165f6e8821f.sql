
CREATE TABLE IF NOT EXISTS public.breath_trigger_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  session_id text NOT NULL DEFAULT '',
  breath_response_choice text NOT NULL CHECK (breath_response_choice IN (
    'continue', 'slow_down', 'different_way', 'tj_cafe', 'simpler_version', 'dismissed'
  )),
  trigger_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_rhythm_state text,
  cognitive_load text,
  confidence_rating integer,
  wrong_attempts integer NOT NULL DEFAULT 0,
  fast_clicking_pattern boolean NOT NULL DEFAULT false,
  long_pause_pattern boolean NOT NULL DEFAULT false,
  repeated_skipping boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.breath_trigger_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own breath events"
ON public.breath_trigger_events
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own breath events"
ON public.breath_trigger_events
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_breath_trigger_user_recent
  ON public.breath_trigger_events (user_id, created_at DESC);
