CREATE TABLE public.second_chance_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id UUID,
  module_id UUID,
  block_number INTEGER,
  question_ref TEXT DEFAULT '',
  error_type TEXT,
  second_chance_behavior TEXT NOT NULL,
  recovery_pattern TEXT,
  retry_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.second_chance_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own second-chance picks"
  ON public.second_chance_picks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own second-chance picks"
  ON public.second_chance_picks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own second-chance picks"
  ON public.second_chance_picks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_second_chance_user_created ON public.second_chance_picks (user_id, created_at DESC);