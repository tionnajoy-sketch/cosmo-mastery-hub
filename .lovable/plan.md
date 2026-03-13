

# Smart Slide Classification & Enhanced Upload Processing

## Overview
Upgrade the upload pipeline so the AI classifies each slide/section as one of three types — **concept**, **visual/diagram**, or **quiz question** — then routes each accordingly: concepts become full TJ Blocks, visuals get preserved in the Visualize tab, quiz slides feed a Quiz Bank, and handwritten annotations become "Instructor Notes" or "Student Insights."

## Current Limitation
The current system sends raw text to the AI as a single blob. It cannot:
- Distinguish slide types (concept vs diagram vs quiz)
- Extract or preserve images from uploaded files
- Detect handwritten annotations
- Route quiz-style slides to a separate quiz bank

## Changes

### 1. Database Migration — New columns + Quiz Bank table

**New table: `uploaded_module_quiz_bank`**
Stores exam-style questions detected on slides (separate from TJ Block quiz questions).

```sql
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
-- RLS via parent module ownership
CREATE POLICY "Users can view own quiz bank" ON public.uploaded_module_quiz_bank
  FOR SELECT USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own quiz bank" ON public.uploaded_module_quiz_bank
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own quiz bank" ON public.uploaded_module_quiz_bank
  FOR DELETE USING (EXISTS (SELECT 1 FROM uploaded_modules WHERE id = module_id AND user_id = auth.uid()));
```

**New columns on `uploaded_module_blocks`:**
- `image_url text DEFAULT ''` — stores extracted or generated diagram URL
- `instructor_notes text DEFAULT ''` — stores detected handwritten annotations
- `slide_type text DEFAULT 'concept'` — classification: concept, visual, quiz

### 2. Edge Function — `process-upload/index.ts` (Major Rewrite)

The updated prompt instructs the AI to classify each section/slide:

**Classification rules in the system prompt:**
- **concept**: Terminology, bullet-point explanations → generate full TJ Block
- **visual**: Charts, diagrams, comparison tables → generate TJ Block with enhanced `visualization_desc` preserving the chart structure, plus a practice question about the visual
- **quiz**: Multiple-choice review questions → extract into structured quiz bank format (question, 4 options, correct answer, explanation)
- **handwritten_note**: Annotations like "could be asymptomatic" → stored as `instructor_notes` on the nearest related concept block

**Updated tool schema** adds:
- `slide_type` field on each block (concept/visual)
- `instructor_notes` field for detected handwritten content
- `image_description` field (detailed description of any diagram for later AI image generation)
- New `quiz_bank_questions` array at the top level for detected exam questions

**Response structure:**
```json
{
  "blocks": [...],           // concept + visual blocks → TJ Blocks
  "quiz_bank_questions": [   // quiz slides → Quiz Bank
    { "question_text", "option_a/b/c/d", "correct_option", "explanation", "source_slide" }
  ]
}
```

### 3. `UploadPage.tsx` — Handle new response shape

After calling `process-upload`:
- Insert `blocks` into `uploaded_module_blocks` (same as now, plus new fields)
- Insert `quiz_bank_questions` into `uploaded_module_quiz_bank`
- Show toast summary: "Created X TJ Blocks and added Y questions to your Quiz Bank"

### 4. `UploadedTermCard.tsx` — Show instructor notes + image generation

- If `instructor_notes` is not empty, display a collapsible "Instructor Notes" or "Student Insight" callout (with a notebook icon) below the term title
- In the Visualize tab: if `image_url` is set, show the image; otherwise trigger auto-generation via `generate-term-image` (existing pattern)

### 5. `ModuleViewPage.tsx` — Quiz Bank access

- Add a "Quiz Bank" button/section at the bottom of the module view
- Shows count of quiz bank questions available
- Links to a quiz experience using `uploaded_module_quiz_bank` questions

### 6. New: `ModuleQuizBankPage.tsx`

- Fetches questions from `uploaded_module_quiz_bank` for the module
- Presents them in the same quiz UI as `ModuleQuizPage` (mode selection, strategy steps, score tracking)
- Saves results to `uploaded_quiz_results` with a distinct mode like `"quiz_bank"`

### 7. Routes — `App.tsx`

Add: `/module/:id/quiz-bank` → `ModuleQuizBankPage`

## Implementation Order
1. Database migration (quiz bank table + new columns on blocks)
2. Rewrite `process-upload` edge function with classification prompt
3. Update `UploadPage.tsx` to handle new response (blocks + quiz bank)
4. Update `UploadedTermCard.tsx` for instructor notes + image support
5. Update `ModuleViewPage.tsx` with Quiz Bank section
6. Create `ModuleQuizBankPage.tsx`
7. Add route in `App.tsx`

## Files Summary
- **New**: `src/pages/ModuleQuizBankPage.tsx`
- **Modified**: `supabase/functions/process-upload/index.ts`, `src/pages/UploadPage.tsx`, `src/components/UploadedTermCard.tsx`, `src/pages/ModuleViewPage.tsx`, `src/App.tsx`
- **Migration**: New `uploaded_module_quiz_bank` table + new columns on `uploaded_module_blocks`

