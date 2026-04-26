CREATE TABLE IF NOT EXISTS public.layer_integrity_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  completion_pct INTEGER NOT NULL DEFAULT 0,
  completed_layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  most_important_missing TEXT,
  decision TEXT NOT NULL,
  integrity_override BOOLEAN NOT NULL DEFAULT false,
  integrity_recovery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.layer_integrity_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own integrity checks"
  ON public.layer_integrity_checks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own integrity checks"
  ON public.layer_integrity_checks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_layer_integrity_checks_user
  ON public.layer_integrity_checks (user_id);