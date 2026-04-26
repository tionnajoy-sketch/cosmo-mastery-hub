
-- ============================================================
-- LMS MODULE: tables, RLS, seed
-- ============================================================

-- Helper: generic timestamp updater (reuse if exists)
CREATE OR REPLACE FUNCTION public.lms_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------- learners ----------
CREATE TABLE public.learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT 'Learner',
  cohort text NOT NULL DEFAULT 'Spring Cohort',
  learning_goal text NOT NULL DEFAULT 'Pass the State Board exam with confidence',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own learner row" ON public.learners
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own learner row" ON public.learners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own learner row" ON public.learners
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all learners" ON public.learners
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_learners_updated BEFORE UPDATE ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_courses ----------
CREATE TABLE public.lms_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Cosmetology',
  level text NOT NULL DEFAULT 'Foundational',
  status text NOT NULL DEFAULT 'Published',
  lesson_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read courses" ON public.lms_courses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage courses" ON public.lms_courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lms_courses_updated BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_modules ----------
CREATE TABLE public.lms_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lms_modules_course ON public.lms_modules(course_id);
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read modules" ON public.lms_modules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.lms_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lms_modules_updated BEFORE UPDATE ON public.lms_modules
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_lessons ----------
CREATE TABLE public.lms_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.lms_modules(id) ON DELETE CASCADE,
  term_id uuid NULL,
  title text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'reading',
  duration_minutes integer NOT NULL DEFAULT 10,
  objective text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lms_lessons_module ON public.lms_lessons(module_id);
CREATE INDEX idx_lms_lessons_term ON public.lms_lessons(term_id);
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read lessons" ON public.lms_lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage lessons" ON public.lms_lessons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lms_lessons_updated BEFORE UPDATE ON public.lms_lessons
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_enrollments ----------
CREATE TABLE public.lms_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  progress_pct integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(learner_id, course_id)
);
CREATE INDEX idx_lms_enrollments_learner ON public.lms_enrollments(learner_id);
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own enrollments" ON public.lms_enrollments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users insert own enrollments" ON public.lms_enrollments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users update own enrollments" ON public.lms_enrollments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Admins view all enrollments" ON public.lms_enrollments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lms_enrollments_updated BEFORE UPDATE ON public.lms_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_lesson_progress ----------
CREATE TABLE public.lms_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(learner_id, lesson_id)
);
CREATE INDEX idx_lms_progress_learner ON public.lms_lesson_progress(learner_id);
ALTER TABLE public.lms_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progress" ON public.lms_lesson_progress
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users insert own progress" ON public.lms_lesson_progress
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users update own progress" ON public.lms_lesson_progress
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Admins view all progress" ON public.lms_lesson_progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_lms_progress_updated BEFORE UPDATE ON public.lms_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.lms_touch_updated_at();

-- ---------- lms_quiz_attempts ----------
CREATE TABLE public.lms_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lms_quiz_learner ON public.lms_quiz_attempts(learner_id);
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz attempts" ON public.lms_quiz_attempts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users insert own quiz attempts" ON public.lms_quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Admins view all quiz attempts" ON public.lms_quiz_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------- lms_activities ----------
CREATE TABLE public.lms_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  message text NOT NULL,
  related_lesson_id uuid NULL,
  related_course_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lms_activities_learner ON public.lms_activities(learner_id, created_at DESC);
ALTER TABLE public.lms_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activities" ON public.lms_activities
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Users insert own activities" ON public.lms_activities
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.learners l WHERE l.id = learner_id AND l.user_id = auth.uid())
  );
CREATE POLICY "Admins view all activities" ON public.lms_activities
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SEED CONTENT
-- ============================================================
DO $seed$
DECLARE
  c1 uuid; c2 uuid; c3 uuid;
  m1a uuid; m1b uuid; m2a uuid; m2b uuid; m3a uuid; m3b uuid;
BEGIN
  -- Course 1
  INSERT INTO public.lms_courses (title, subtitle, description, category, level, status, lesson_count, sort_order)
  VALUES ('Layer Method Foundations',
          'Learn the TJ Anderson Layer Method from the ground up',
          'A guided introduction to the nine-layer learning system used to master cosmetology concepts with confidence.',
          'Method', 'Foundational', 'Published', 6, 1)
  RETURNING id INTO c1;

  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c1, 'Welcome to the Layer Method', 'Understand why nine layers, and how each layer builds the next.', 1) RETURNING id INTO m1a;
  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c1, 'Practicing the Loop', 'Apply Break Down, Information, Apply, and Assess to your first concept.', 2) RETURNING id INTO m1b;

  INSERT INTO public.lms_lessons (module_id, title, lesson_type, duration_minutes, objective, content, sort_order) VALUES
    (m1a, 'What the Layer Method Solves', 'reading', 8,
     'Understand the gap traditional study leaves behind on the State Board.',
     'The TJ Anderson Layer Method breaks every concept into nine repeatable steps so nothing slips through. In this lesson you will see why memorization alone fails on board day and how layered practice changes the outcome.', 1),
    (m1a, 'The Nine Layers, In Plain Talk', 'video', 12,
     'Name each of the nine layers and what they do for memory.',
     'Watch as TJ walks through Visualize, Define, Break It Down, Recognize, Connect, Information, Reflect, Apply, and Assess using a real client scenario.', 2),
    (m1a, 'Layer Method Vocabulary Check', 'quiz', 6,
     'Recall the nine layers and pair each with its purpose.',
     'A short five-question check on the names and order of the layers.', 3),
    (m1b, 'Break It Down: Your First Term', 'practice', 15,
     'Use the Break Down step on a real cosmetology term.',
     'You will choose a term, split it into root and meaning, and write a one-line plain-English definition you can teach back.', 1),
    (m1b, 'Apply It at the Shampoo Bowl', 'reading', 10,
     'Translate one term into a real client moment.',
     'Take the term you broke down and describe how it shows up during a wet service consultation.', 2),
    (m1b, 'Foundations Mastery Check', 'quiz', 10,
     'Demonstrate end-to-end use of the Layer Method on one concept.',
     'A scored ten-question check covering all nine layers in sequence.', 3);

  -- Course 2
  INSERT INTO public.lms_courses (title, subtitle, description, category, level, status, lesson_count, sort_order)
  VALUES ('Cosmetology State Board Prep',
          'Targeted review for the written and practical exam',
          'High-yield review across anatomy, chemistry, sanitation, and salon law using the Layer Method to build durable recall.',
          'Cosmetology', 'Intermediate', 'Published', 6, 2)
  RETURNING id INTO c2;

  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c2, 'Skin and Scalp Essentials', 'Anatomy you must recognize on sight for the written exam.', 1) RETURNING id INTO m2a;
  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c2, 'Chemistry at the Bowl', 'pH, porosity, and the chemistry behind every service.', 2) RETURNING id INTO m2b;

  INSERT INTO public.lms_lessons (module_id, title, lesson_type, duration_minutes, objective, content, sort_order) VALUES
    (m2a, 'The Five Skin Layers', 'reading', 10,
     'Name and order the five layers of the epidermis.',
     'Walk through stratum corneum down to stratum germinativum with salon-relevant examples.', 1),
    (m2a, 'Scalp Conditions on Consultation', 'practice', 12,
     'Identify three common scalp conditions before you start a service.',
     'Practice spotting tinea capitis, seborrheic dermatitis, and contact dermatitis from photo prompts.', 2),
    (m2a, 'Skin and Scalp Quiz', 'quiz', 8,
     'Score 80% or higher on a 10-question skin anatomy check.',
     'Mixed-format questions covering layers, conditions, and contraindications.', 3),
    (m2b, 'pH for Stylists', 'video', 11,
     'Explain pH in language a client can understand.',
     'Acidic, neutral, and alkaline products and what each does to the cuticle.', 1),
    (m2b, 'Porosity Reading at the Bowl', 'practice', 14,
     'Diagnose porosity using a strand test in under three minutes.',
     'Step-by-step strand-test routine and how to adjust formulation based on the result.', 2),
    (m2b, 'Chemistry Mastery Check', 'quiz', 10,
     'Demonstrate readiness on the chemistry block of the written exam.',
     'Twelve-question check across pH, porosity, and product chemistry.', 3);

  -- Course 3
  INSERT INTO public.lms_courses (title, subtitle, description, category, level, status, lesson_count, sort_order)
  VALUES ('Salon Client Experience Lab',
          'Consultation, communication, and recovery skills',
          'Real salon scenarios that train the soft skills that turn one-time clients into rebookings.',
          'Salon Skills', 'Applied', 'Published', 5, 3)
  RETURNING id INTO c3;

  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c3, 'Consultation That Converts', 'Open the appointment with clarity and confidence.', 1) RETURNING id INTO m3a;
  INSERT INTO public.lms_modules (course_id, title, description, sort_order) VALUES
    (c3, 'Service Recovery Moments', 'Handle the moment a client says they are unhappy.', 2) RETURNING id INTO m3b;

  INSERT INTO public.lms_lessons (module_id, title, lesson_type, duration_minutes, objective, content, sort_order) VALUES
    (m3a, 'The Three-Question Consultation', 'reading', 7,
     'Lead any consultation with three calibrated questions.',
     'Lifestyle, history, and goal questions that protect both you and the client.', 1),
    (m3a, 'Saying No With Care', 'video', 9,
     'Decline a service the client cannot safely receive.',
     'Scripted phrasing for common decline scenarios.', 2),
    (m3a, 'Consultation Role-Play Quiz', 'quiz', 8,
     'Choose the best response in five live consultation prompts.',
     'Scenario-based quiz scored on professional judgment.', 3),
    (m3b, 'When the Color Pulled Brassy', 'practice', 12,
     'Recover a brassy result without losing the client.',
     'Walk through the diagnostic and the conversation, side by side.', 1),
    (m3b, 'Client Recovery Mastery Check', 'quiz', 10,
     'Demonstrate confident recovery language across three scenarios.',
     'Mixed-scenario check covering brassy results, missed appointments, and pricing pushback.', 2);

  -- Update lesson counts to match
  UPDATE public.lms_courses SET lesson_count = (
    SELECT count(*) FROM public.lms_lessons l
    JOIN public.lms_modules m ON m.id = l.module_id
    WHERE m.course_id = lms_courses.id
  );
END $seed$;
