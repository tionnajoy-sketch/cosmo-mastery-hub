-- TJ Engine rule overrides (DB rows override JSON defaults)
CREATE TABLE public.tj_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_key TEXT NOT NULL UNIQUE,
  rule_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tj_rules_type_active ON public.tj_rules(rule_type, is_active);

ALTER TABLE public.tj_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rules readable by authenticated"
ON public.tj_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage rules"
ON public.tj_rules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER tj_rules_touch_updated_at
BEFORE UPDATE ON public.tj_rules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Per-student per-term stage progress
CREATE TABLE public.tj_term_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NOT NULL,
  stage_id TEXT NOT NULL,
  completion_state TEXT NOT NULL DEFAULT 'locked',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  accuracy_score INTEGER NOT NULL DEFAULT 0,
  last_submission TEXT NOT NULL DEFAULT '',
  detected_stage TEXT,
  missing_layer TEXT,
  recommended_next_action TEXT NOT NULL DEFAULT '',
  last_feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  reinforcement_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id, stage_id)
);

CREATE INDEX idx_tj_term_stages_user_term ON public.tj_term_stages(user_id, term_id);

ALTER TABLE public.tj_term_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stage progress"
ON public.tj_term_stages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own stage progress"
ON public.tj_term_stages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stage progress"
ON public.tj_term_stages FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER tj_term_stages_touch_updated_at
BEFORE UPDATE ON public.tj_term_stages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();