-- 1. Add static content columns to terms
ALTER TABLE public.terms
  ADD COLUMN IF NOT EXISTS visualize_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS define_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS break_it_down_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recognize_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS metaphor_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS information_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reflect_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS apply_content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assess_question text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assess_answer text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assess_explanation text NOT NULL DEFAULT '';

-- 2. Role enum + user_roles table (secure pattern)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Allow admins to UPDATE terms (read stays open to authenticated)
DROP POLICY IF EXISTS "Admins can update terms" ON public.terms;
CREATE POLICY "Admins can update terms"
  ON public.terms FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert terms" ON public.terms;
CREATE POLICY "Admins can insert terms"
  ON public.terms FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));