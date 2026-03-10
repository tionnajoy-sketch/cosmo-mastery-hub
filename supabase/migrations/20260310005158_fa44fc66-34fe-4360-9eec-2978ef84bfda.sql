
CREATE TABLE public.study_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  questions_answered integer NOT NULL DEFAULT 0,
  activities_completed integer NOT NULL DEFAULT 0,
  goal_met boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.study_activity FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.study_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity" ON public.study_activity FOR UPDATE TO authenticated USING (auth.uid() = user_id);
