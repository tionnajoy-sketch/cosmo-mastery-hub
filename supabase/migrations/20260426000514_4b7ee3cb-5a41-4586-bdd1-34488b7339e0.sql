-- Explain-It-Back responses + skip tracking
CREATE TABLE IF NOT EXISTS public.explain_it_back_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  block_number integer,
  trigger_source text NOT NULL DEFAULT 'definition', -- 'definition' | 'guided_lesson' | 'missed_question'
  context_ref text NOT NULL DEFAULT '',
  explain_it_back_response text NOT NULL DEFAULT '',
  word_count integer NOT NULL DEFAULT 0,
  follow_up_action text, -- 'understand' | 'need_explanation' | 'want_visual' | 'want_metaphor' | null
  skipped boolean NOT NULL DEFAULT false,
  learning_behavior_flag text, -- 'avoids explanation' when set
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eib_user_term ON public.explain_it_back_responses (user_id, term_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eib_user_skipped ON public.explain_it_back_responses (user_id, term_id, skipped);

ALTER TABLE public.explain_it_back_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own explain it back"
  ON public.explain_it_back_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own explain it back"
  ON public.explain_it_back_responses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own explain it back"
  ON public.explain_it_back_responses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);