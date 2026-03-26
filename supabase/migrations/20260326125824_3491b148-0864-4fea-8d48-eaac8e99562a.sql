
-- Learning metrics table for confidence, retention, understanding per user
CREATE TABLE public.user_learning_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  confidence integer NOT NULL DEFAULT 0,
  retention integer NOT NULL DEFAULT 0,
  understanding integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  layers_completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  mastery_achieved boolean NOT NULL DEFAULT false,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, term_id)
);

ALTER TABLE public.user_learning_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON public.user_learning_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.user_learning_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.user_learning_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
