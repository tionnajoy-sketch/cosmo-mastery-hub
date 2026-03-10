
-- Add has_completed_pretest to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_pretest boolean NOT NULL DEFAULT false;

-- Student contracts table
CREATE TABLE public.student_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commitment_text text NOT NULL DEFAULT '',
  goal_date date,
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.student_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contract" ON public.student_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contract" ON public.student_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contract" ON public.student_contracts FOR UPDATE USING (auth.uid() = user_id);

-- Pretest results table
CREATE TABLE public.pretest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  learning_style text NOT NULL DEFAULT 'visual',
  section_scores jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.pretest_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pretest" ON public.pretest_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pretest" ON public.pretest_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pretest answers table
CREATE TABLE public.pretest_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false
);
ALTER TABLE public.pretest_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pretest answers" ON public.pretest_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pretest answers" ON public.pretest_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posttest results table
CREATE TABLE public.posttest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  section_scores jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posttest_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own posttest" ON public.posttest_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posttest" ON public.posttest_results FOR INSERT WITH CHECK (auth.uid() = user_id);
