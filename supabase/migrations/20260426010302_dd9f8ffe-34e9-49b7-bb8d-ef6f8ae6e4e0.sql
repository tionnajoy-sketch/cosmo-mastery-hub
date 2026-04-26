-- Guided Pace Adjustment events: every choice the learner makes
-- in response to a Breath prompt or follow-up pace control.
CREATE TABLE public.pace_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NULL,
  module_id UUID NULL,
  session_id TEXT NOT NULL DEFAULT '',
  -- The breath response that opened this pace flow ('continue','slow_down','different_way','tj_cafe','simpler_version')
  breath_choice TEXT NOT NULL,
  -- The specific pace action taken inside the follow-up flow
  -- ('route_breakdown','route_guided','route_visual','route_metaphor','route_practice',
  --  'different_way_visual','different_way_metaphor','different_way_guided',
  --  'simpler_version','tj_cafe','continue_override','slow_down_complete','slow_down_exit')
  pace_choice TEXT NOT NULL,
  -- For step-by-step Slow It Down route
  route_step INT NOT NULL DEFAULT 0,
  -- True when the learner pushed past the breath prompt without slowing
  pace_override BOOLEAN NOT NULL DEFAULT false,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pace_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own pace adjustments"
  ON public.pace_adjustments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own pace adjustments"
  ON public.pace_adjustments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_pace_adjustments_user_term ON public.pace_adjustments(user_id, term_id);
CREATE INDEX idx_pace_adjustments_session ON public.pace_adjustments(session_id);