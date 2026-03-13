ALTER TABLE public.uploaded_module_blocks
ADD COLUMN pronunciation text NOT NULL DEFAULT '',
ADD COLUMN practice_scenario text NOT NULL DEFAULT '',
ADD COLUMN quiz_question_2 text NOT NULL DEFAULT '',
ADD COLUMN quiz_options_2 jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN quiz_answer_2 text NOT NULL DEFAULT '',
ADD COLUMN quiz_question_3 text NOT NULL DEFAULT '',
ADD COLUMN quiz_options_3 jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN quiz_answer_3 text NOT NULL DEFAULT '';