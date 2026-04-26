CREATE TABLE public.reentry_choices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  session_id TEXT NOT NULL DEFAULT '',
  trigger_source TEXT NOT NULL DEFAULT 'tj_cafe',
  reentry_choice TEXT NOT NULL,
  routed_to TEXT NOT NULL DEFAULT '',
  recovery_success BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reentry_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reentry choices"
ON public.reentry_choices FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own reentry choices"
ON public.reentry_choices FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own reentry choices"
ON public.reentry_choices FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_reentry_choices_user_term ON public.reentry_choices(user_id, term_id, created_at DESC);