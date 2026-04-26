
CREATE TABLE public.cognitive_load_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  session_id TEXT NOT NULL DEFAULT '',
  cognitive_load TEXT NOT NULL,
  time_on_term_ms INTEGER NOT NULL DEFAULT 0,
  time_on_question_ms INTEGER NOT NULL DEFAULT 0,
  wrong_attempts INTEGER NOT NULL DEFAULT 0,
  fast_clicking_pattern BOOLEAN NOT NULL DEFAULT false,
  long_pause_pattern BOOLEAN NOT NULL DEFAULT false,
  skipped_sections INTEGER NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cognitive_load_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own cognitive load"
ON public.cognitive_load_snapshots
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own cognitive load"
ON public.cognitive_load_snapshots
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_cog_load_user_term ON public.cognitive_load_snapshots(user_id, term_id, created_at DESC);
