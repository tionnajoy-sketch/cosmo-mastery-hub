CREATE TABLE IF NOT EXISTS public.breakdown_point_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  breakdown_point TEXT NOT NULL,
  incorrect_attempts_at_pick INTEGER NOT NULL DEFAULT 0,
  routed_to TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.breakdown_point_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own breakdown picks"
  ON public.breakdown_point_picks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own breakdown picks"
  ON public.breakdown_point_picks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_breakdown_point_picks_user
  ON public.breakdown_point_picks (user_id);