-- Raw micro-decision event log
CREATE TABLE public.micro_decision_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID,
  module_id UUID,
  block_number INTEGER,
  surface TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  time_on_surface_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.micro_decision_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own micro events"
  ON public.micro_decision_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users select own micro events"
  ON public.micro_decision_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_micro_events_user_action ON public.micro_decision_events (user_id, action, created_at DESC);
CREATE INDEX idx_micro_events_user_term ON public.micro_decision_events (user_id, term_id, created_at DESC);

-- Derived behavior flags (one row per learner+term+flag)
CREATE TABLE public.micro_decision_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID,
  flag TEXT NOT NULL,
  triggered BOOLEAN NOT NULL DEFAULT true,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  last_triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id, flag)
);

ALTER TABLE public.micro_decision_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own micro flags"
  ON public.micro_decision_flags FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own micro flags"
  ON public.micro_decision_flags FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users select own micro flags"
  ON public.micro_decision_flags FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_micro_flags_user_flag ON public.micro_decision_flags (user_id, flag);

CREATE TRIGGER trg_micro_flags_touch
  BEFORE UPDATE ON public.micro_decision_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();