-- Per-term learning mode preferences (teach vs test) and aggregated time/switch stats
CREATE TABLE IF NOT EXISTS public.learning_mode_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  first_mode TEXT,
  preferred_mode TEXT,
  teach_mode_time INTEGER NOT NULL DEFAULT 0,
  test_mode_time INTEGER NOT NULL DEFAULT 0,
  teach_open_count INTEGER NOT NULL DEFAULT 0,
  test_open_count INTEGER NOT NULL DEFAULT 0,
  mode_switch_count INTEGER NOT NULL DEFAULT 0,
  last_mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id)
);

ALTER TABLE public.learning_mode_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own mode stats"
  ON public.learning_mode_stats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mode stats"
  ON public.learning_mode_stats FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own mode stats"
  ON public.learning_mode_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_mode_stats_user ON public.learning_mode_stats (user_id);

-- Append-only event log for per-session mode switches (useful for later analysis)
CREATE TABLE IF NOT EXISTS public.learning_mode_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  module_id UUID,
  from_mode TEXT,
  to_mode TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_mode_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own mode events"
  ON public.learning_mode_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own mode events"
  ON public.learning_mode_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_mode_events_user ON public.learning_mode_events (user_id);