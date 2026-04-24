-- Add the new 9-dimension Brain Strengths model to profiles.
-- This is ADDITIVE: existing tj_dna_code / dna_engagement / dna_retention /
-- dna_confidence / dna_layer_strength columns remain and are derived from
-- this richer source of truth going forward.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS brain_strengths jsonb NOT NULL DEFAULT
    jsonb_build_object(
      'visual', 50,
      'language', 50,
      'analysis', 50,
      'pattern', 50,
      'abstraction', 50,
      'intake', 50,
      'reflection', 50,
      'application', 50,
      'recall', 50,
      'engagement', 50,
      'retention', 50,
      'confidence', 50
    );

-- Persist per-term recall reconstruction attempts so we can show progress
-- and trigger the reinforcement loop when recall < 60%.
CREATE TABLE IF NOT EXISTS public.recall_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'fill_blank',           -- 'fill_blank' | 'write_fully'
  score_pct integer NOT NULL DEFAULT 0,              -- 0-100
  response text NOT NULL DEFAULT '',
  triggered_reinforcement boolean NOT NULL DEFAULT false,
  reinforcement_passed boolean,                      -- null = not run, true/false = outcome
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recall_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own recall attempts"
  ON public.recall_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own recall attempts"
  ON public.recall_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recall_attempts_user_term_idx
  ON public.recall_attempts (user_id, term_id, created_at DESC);
