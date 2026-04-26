CREATE TABLE IF NOT EXISTS public.error_type_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  block_number integer,
  question_ref text NOT NULL DEFAULT '',
  error_type text NOT NULL,    -- 'misread' | 'confused_terms' | 'didnt_understand' | 'overthought' | 'rushed' | 'guessed' | 'not_sure'
  routed_to text NOT NULL DEFAULT '', -- 'reading_strategy' | 'comparison_card' | 'breakdown' | 'simple_explanation' | 'slow_down_retry' | 'memory_anchor' | 'choice_offered'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etp_user_type ON public.error_type_picks (user_id, error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_etp_user_term ON public.error_type_picks (user_id, term_id);

ALTER TABLE public.error_type_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own error picks"
  ON public.error_type_picks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own error picks"
  ON public.error_type_picks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);