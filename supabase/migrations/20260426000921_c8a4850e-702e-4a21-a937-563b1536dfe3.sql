CREATE TABLE IF NOT EXISTS public.term_entry_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  preferred_thinking_path text NOT NULL, -- 'visual' | 'real_life' | 'breakdown' | 'try_first' | 'metaphor' | 'reflect_first'
  routed_to_step text NOT NULL,          -- step key the learner was sent to
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tec_user_path ON public.term_entry_choices (user_id, preferred_thinking_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tec_user_term ON public.term_entry_choices (user_id, term_id);

ALTER TABLE public.term_entry_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own entry choices"
  ON public.term_entry_choices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own entry choices"
  ON public.term_entry_choices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);