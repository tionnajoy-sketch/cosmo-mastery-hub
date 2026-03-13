
-- uploaded_modules table
CREATE TABLE public.uploaded_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'uploading',
  source_filename text NOT NULL DEFAULT '',
  is_instructor_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modules" ON public.uploaded_modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modules" ON public.uploaded_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modules" ON public.uploaded_modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modules" ON public.uploaded_modules FOR DELETE USING (auth.uid() = user_id);

-- uploaded_module_blocks table
CREATE TABLE public.uploaded_module_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.uploaded_modules(id) ON DELETE CASCADE,
  block_number integer NOT NULL DEFAULT 1,
  term_title text NOT NULL DEFAULT '',
  definition text NOT NULL DEFAULT '',
  visualization_desc text NOT NULL DEFAULT '',
  metaphor text NOT NULL DEFAULT '',
  affirmation text NOT NULL DEFAULT '',
  reflection_prompt text NOT NULL DEFAULT '',
  quiz_question text NOT NULL DEFAULT '',
  quiz_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_answer text NOT NULL DEFAULT '',
  user_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_module_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own module blocks" ON public.uploaded_module_blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own module blocks" ON public.uploaded_module_blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own module blocks" ON public.uploaded_module_blocks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own module blocks" ON public.uploaded_module_blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.uploaded_modules WHERE id = module_id AND user_id = auth.uid()));

-- Storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
