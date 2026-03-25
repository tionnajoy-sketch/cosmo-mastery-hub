
CREATE TABLE public.cosmo_grid_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  level integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 0,
  total_words integer NOT NULL DEFAULT 0,
  words_correct integer NOT NULL DEFAULT 0,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  weak_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmo_grid_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own grid sessions"
  ON public.cosmo_grid_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own grid sessions"
  ON public.cosmo_grid_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own grid sessions"
  ON public.cosmo_grid_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
