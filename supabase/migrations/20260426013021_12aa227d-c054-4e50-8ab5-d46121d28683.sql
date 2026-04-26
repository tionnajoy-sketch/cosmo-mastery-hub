-- Cache generated TJ-voice Guided Lessons per term
CREATE TABLE public.term_guided_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  opening_breakdown TEXT NOT NULL DEFAULT '',
  origin_root_meaning TEXT NOT NULL DEFAULT '',
  history_context TEXT NOT NULL DEFAULT '',
  guided_understanding TEXT NOT NULL DEFAULT '',
  why_it_matters TEXT NOT NULL DEFAULT '',
  voice_version TEXT NOT NULL DEFAULT 'tj-v1',
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (term_id, voice_version)
);

ALTER TABLE public.term_guided_lessons ENABLE ROW LEVEL SECURITY;

-- Any authenticated learner can read generated lessons
CREATE POLICY "Authenticated can read guided lessons"
ON public.term_guided_lessons FOR SELECT
TO authenticated
USING (true);

-- Only admins can directly insert/update/delete from the client.
-- The edge function uses the service role key and bypasses RLS for caching.
CREATE POLICY "Admins can insert guided lessons"
ON public.term_guided_lessons FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guided lessons"
ON public.term_guided_lessons FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete guided lessons"
ON public.term_guided_lessons FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_term_guided_lessons_updated_at
BEFORE UPDATE ON public.term_guided_lessons
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_term_guided_lessons_term_id ON public.term_guided_lessons(term_id);