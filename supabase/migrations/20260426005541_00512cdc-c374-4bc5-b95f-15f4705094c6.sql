
CREATE TABLE IF NOT EXISTS public.learning_rhythm_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  session_id text NOT NULL DEFAULT '',
  learning_rhythm_state text NOT NULL CHECK (learning_rhythm_state IN ('flow','steady','strained','overwhelmed','recovering')),
  cognitive_load text,
  confidence integer,
  wrong_attempts integer NOT NULL DEFAULT 0,
  fast_clicking_pattern boolean NOT NULL DEFAULT false,
  long_pause_pattern boolean NOT NULL DEFAULT false,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_rhythm_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own rhythm states"
ON public.learning_rhythm_states
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own rhythm states"
ON public.learning_rhythm_states
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_rhythm_user_recent
  ON public.learning_rhythm_states (user_id, created_at DESC);
