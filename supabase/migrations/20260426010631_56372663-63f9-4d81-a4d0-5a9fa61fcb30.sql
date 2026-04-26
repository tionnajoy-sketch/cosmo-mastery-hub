-- Learning Cycle Loop: every cycle-stage transition for a learner.
CREATE TABLE public.learning_cycle_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NULL,
  module_id UUID NULL,
  session_id TEXT NOT NULL DEFAULT '',
  -- Cycle stage just entered: 'learn','try','struggle','reset','reenter','mastery'
  cycle_stage TEXT NOT NULL,
  -- Previous cycle stage (or null at the very start of a session)
  previous_stage TEXT NULL,
  -- Orb step key at the moment of transition (e.g. 'visual','quiz','application')
  step_key TEXT NOT NULL DEFAULT '',
  wrong_attempts INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_cycle_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own cycle stages"
  ON public.learning_cycle_stages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own cycle stages"
  ON public.learning_cycle_stages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_learning_cycle_stages_user_term ON public.learning_cycle_stages(user_id, term_id);
CREATE INDEX idx_learning_cycle_stages_session ON public.learning_cycle_stages(session_id);
CREATE INDEX idx_learning_cycle_stages_created ON public.learning_cycle_stages(created_at DESC);