CREATE OR REPLACE FUNCTION public.validate_lms_lesson()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.module_id IS NULL THEN
    RAISE EXCEPTION 'lms_lessons.module_id is required';
  END IF;

  IF NEW.lesson_type IS NULL OR length(btrim(NEW.lesson_type)) = 0 THEN
    RAISE EXCEPTION 'lms_lessons.lesson_type is required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_lms_lesson_trigger ON public.lms_lessons;

CREATE TRIGGER validate_lms_lesson_trigger
BEFORE INSERT OR UPDATE ON public.lms_lessons
FOR EACH ROW
EXECUTE FUNCTION public.validate_lms_lesson();