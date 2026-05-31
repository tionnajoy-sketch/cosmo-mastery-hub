
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.tj_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  cluster TEXT,
  purpose TEXT,
  definition TEXT,
  word_origin TEXT,
  related_concepts TEXT[] DEFAULT '{}'::text[],
  visualize TEXT,
  apply TEXT,
  breakdown TEXT,
  recognize TEXT,
  metaphor TEXT,
  information TEXT,
  awareness TEXT,
  reflect_prompt TEXT,
  assess JSONB,
  tj_insight TEXT,
  layer_color_overrides JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tj_lessons TO anon;
GRANT SELECT ON public.tj_lessons TO authenticated;
GRANT ALL ON public.tj_lessons TO service_role;

ALTER TABLE public.tj_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TJ lessons are readable by everyone"
ON public.tj_lessons FOR SELECT USING (true);

CREATE TRIGGER update_tj_lessons_updated_at
BEFORE UPDATE ON public.tj_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tj_lesson_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_slug TEXT NOT NULL,
  reflection TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tj_lesson_reflections TO authenticated;
GRANT ALL ON public.tj_lesson_reflections TO service_role;

ALTER TABLE public.tj_lesson_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reflections"
ON public.tj_lesson_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reflections"
ON public.tj_lesson_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reflections"
ON public.tj_lesson_reflections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reflections"
ON public.tj_lesson_reflections FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_tj_lesson_reflections_user_lesson
ON public.tj_lesson_reflections(user_id, lesson_slug);

CREATE TRIGGER update_tj_lesson_reflections_updated_at
BEFORE UPDATE ON public.tj_lesson_reflections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
