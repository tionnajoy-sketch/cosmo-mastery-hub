ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS layer_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS behavior_history jsonb NOT NULL DEFAULT '{"recentQuizzes":[],"recentTimes":[],"recentReflections":[],"recentLayerEvals":[]}'::jsonb;