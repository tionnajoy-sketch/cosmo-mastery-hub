
-- Add language preference to profiles
ALTER TABLE public.profiles ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Create journal_notes table for per-term notes
CREATE TABLE public.journal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, term_id)
);

ALTER TABLE public.journal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes" ON public.journal_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.journal_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.journal_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.journal_notes FOR DELETE USING (auth.uid() = user_id);

-- Create wrong_answers table to track incorrect answers
CREATE TABLE public.wrong_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  block_number integer NOT NULL DEFAULT 1,
  selected_option text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.wrong_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wrong answers" ON public.wrong_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wrong answers" ON public.wrong_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own wrong answers" ON public.wrong_answers FOR DELETE USING (auth.uid() = user_id);

-- Create term_images table for AI-generated images
CREATE TABLE public.term_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE UNIQUE,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.term_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Term images readable by authenticated" ON public.term_images FOR SELECT TO authenticated USING (true);
