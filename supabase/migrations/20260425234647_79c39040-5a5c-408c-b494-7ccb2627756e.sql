CREATE TABLE public.learner_behavior_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  term_id uuid NOT NULL,
  stage_id text NOT NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  mode text NOT NULL DEFAULT 'teach',
  confidence_rating integer,
  explain_back_text text NOT NULL DEFAULT '',
  explain_back_word_count integer NOT NULL DEFAULT 0,
  thinking_path text,
  error_type text NOT NULL DEFAULT 'none',
  second_chance_used boolean NOT NULL DEFAULT false,
  second_chance_improved boolean NOT NULL DEFAULT false,
  micro_decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  layer_completion_integrity integer NOT NULL DEFAULT 0,
  breakdown_point text,
  cognitive_load text NOT NULL DEFAULT 'medium',
  time_on_stage_ms integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.learner_behavior_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own behavior signals"
  ON public.learner_behavior_signals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own behavior signals"
  ON public.learner_behavior_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own behavior signals"
  ON public.learner_behavior_signals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_learner_behavior_signals_lookup
  ON public.learner_behavior_signals (user_id, term_id, stage_id, created_at DESC);
