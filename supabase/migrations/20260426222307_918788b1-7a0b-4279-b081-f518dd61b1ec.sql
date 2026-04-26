ALTER TABLE public.lms_lessons
  ADD COLUMN IF NOT EXISTS resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duration text NOT NULL DEFAULT '';