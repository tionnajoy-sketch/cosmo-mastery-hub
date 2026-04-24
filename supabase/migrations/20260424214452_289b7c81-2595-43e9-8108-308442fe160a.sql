-- DNA Progress Events: persistent log of every DNA change
CREATE TABLE public.dna_progress_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  field TEXT NOT NULL,
  from_value TEXT NOT NULL DEFAULT '',
  to_value TEXT NOT NULL DEFAULT '',
  delta INTEGER,
  lesson_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dna_progress_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own dna events"
ON public.dna_progress_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own dna events"
ON public.dna_progress_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dna_progress_events_user_created
ON public.dna_progress_events(user_id, created_at DESC);

-- DNA Milestones: unlocked achievements
CREATE TABLE public.dna_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_key)
);

ALTER TABLE public.dna_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own milestones"
ON public.dna_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestones"
ON public.dna_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dna_milestones_user
ON public.dna_milestones(user_id, unlocked_at DESC);