CREATE TABLE public.recovery_mode_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NULL,
  module_id UUID NULL,
  session_id TEXT NOT NULL DEFAULT '',
  -- 'entered' | 'exited'
  action TEXT NOT NULL,
  -- 'rhythm_overwhelmed' | 'cycle_reset' | 'manual'
  trigger_source TEXT NULL,
  -- 'correct_answer' | 'manual' | null when entering
  exit_reason TEXT NULL,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recovery_mode_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own recovery events"
  ON public.recovery_mode_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own recovery events"
  ON public.recovery_mode_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_recovery_mode_events_user ON public.recovery_mode_events(user_id, created_at DESC);
CREATE INDEX idx_recovery_mode_events_session ON public.recovery_mode_events(session_id);