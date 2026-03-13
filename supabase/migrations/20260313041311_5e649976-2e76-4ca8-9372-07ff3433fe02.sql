
-- Quiz Bank table for exam-style questions extracted from slides
CREATE TABLE public.uploaded_module_quiz_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.uploaded_modules(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL DEFAULT '',
  option_a text NOT NULL DEFAULT '',
  option_b text NOT NULL DEFAULT '',
  option_c text NOT NULL DEFAULT '',
  option_d text NOT NULL DEFAULT '',
  correct_option text NOT NULL DEFAULT 'A',
  explanation text NOT NULL DEFAULT '',
  source_slide integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_module_quiz_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz bank" ON public.uploaded_module_quiz_bank
  FOR SELECT USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own quiz bank" ON public.uploaded_module_quiz_bank
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own quiz bank" ON public.uploaded_module_quiz_bank
  FOR DELETE USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));

-- New columns on uploaded_module_blocks
ALTER TABLE public.uploaded_module_blocks ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '';
ALTER TABLE public.uploaded_module_blocks ADD COLUMN IF NOT EXISTS instructor_notes text NOT NULL DEFAULT '';
ALTER TABLE public.uploaded_module_blocks ADD COLUMN IF NOT EXISTS slide_type text NOT NULL DEFAULT 'concept';
