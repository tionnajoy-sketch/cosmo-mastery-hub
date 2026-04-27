ALTER TABLE public.terms
  ADD COLUMN IF NOT EXISTS diversified_questions jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_terms_diversified_questions_gin
  ON public.terms USING gin (diversified_questions);