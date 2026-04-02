
-- New table: module_chapters
CREATE TABLE public.module_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.uploaded_modules(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  page_range_start integer NOT NULL DEFAULT 1,
  page_range_end integer NOT NULL DEFAULT 1,
  parent_chapter_id uuid REFERENCES public.module_chapters(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chapters"
  ON public.module_chapters FOR SELECT
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_chapters.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can insert own chapters"
  ON public.module_chapters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_chapters.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can update own chapters"
  ON public.module_chapters FOR UPDATE
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_chapters.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can delete own chapters"
  ON public.module_chapters FOR DELETE
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_chapters.module_id AND uploaded_modules.user_id = auth.uid()));

-- New table: module_document_overview
CREATE TABLE public.module_document_overview (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL UNIQUE REFERENCES public.uploaded_modules(id) ON DELETE CASCADE,
  document_title text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  total_chapters integer NOT NULL DEFAULT 0,
  chapter_outline jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  overview_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_document_overview ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overview"
  ON public.module_document_overview FOR SELECT
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_document_overview.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can insert own overview"
  ON public.module_document_overview FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_document_overview.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can update own overview"
  ON public.module_document_overview FOR UPDATE
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_document_overview.module_id AND uploaded_modules.user_id = auth.uid()));

CREATE POLICY "Users can delete own overview"
  ON public.module_document_overview FOR DELETE
  USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE uploaded_modules.id = module_document_overview.module_id AND uploaded_modules.user_id = auth.uid()));

-- Alter uploaded_module_blocks: add structural metadata
ALTER TABLE public.uploaded_module_blocks
  ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES public.module_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS explanation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS key_concepts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS memory_anchors jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS application_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS difficulty_level text NOT NULL DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS search_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS page_reference text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS chunk_index integer NOT NULL DEFAULT 0;

-- Alter uploaded_modules: add document-level metadata
ALTER TABLE public.uploaded_modules
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS detected_subject text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS total_chapters integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_phase text NOT NULL DEFAULT 'uploading';

-- Index for chapter lookups
CREATE INDEX IF NOT EXISTS idx_module_chapters_module_id ON public.module_chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_blocks_chapter_id ON public.uploaded_module_blocks(chapter_id);
