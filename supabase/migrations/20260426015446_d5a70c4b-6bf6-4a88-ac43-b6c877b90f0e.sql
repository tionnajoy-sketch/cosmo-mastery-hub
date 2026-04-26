-- Thinking pattern tracking — per-selection log with outcome
CREATE TABLE public.thinking_pattern_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid,
  module_id uuid,
  thinking_path text NOT NULL, -- visual | verbal | logical | story | kinesthetic
  is_correct boolean,
  attempt_number integer NOT NULL DEFAULT 1,
  surface text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tpe_user ON public.thinking_pattern_events(user_id, created_at DESC);
CREATE INDEX idx_tpe_user_path ON public.thinking_pattern_events(user_id, thinking_path);

ALTER TABLE public.thinking_pattern_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own thinking events"
  ON public.thinking_pattern_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own thinking events"
  ON public.thinking_pattern_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Aggregate profile per user (one row per user)
CREATE TABLE public.thinking_pattern_profile (
  user_id uuid PRIMARY KEY,
  total_selections integer NOT NULL DEFAULT 0,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,        -- { visual: 12, verbal: 4, ... }
  correct_counts jsonb NOT NULL DEFAULT '{}'::jsonb, -- { visual: 9, verbal: 1, ... }
  most_used text,
  most_successful text,
  least_effective text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.thinking_pattern_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own thinking profile"
  ON public.thinking_pattern_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own thinking profile"
  ON public.thinking_pattern_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own thinking profile"
  ON public.thinking_pattern_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);