

# Full Upload-to-TJ-Blocks System Upgrade

## Overview
Enhance the upload processing pipeline and module viewing experience so uploaded content produces and displays full-fidelity TJ Anderson Layer Method blocks identical to native study modules. Add module management (rename, duplicate, delete), a dedicated module quiz page, and block-level navigation with activities.

## Changes

### 1. MyModulesPage — Module Management Menu
**File: `src/pages/MyModulesPage.tsx`**
- Add a `DropdownMenu` (three-dot icon) on each module card with options: View, Rename, Duplicate, Delete.
- **Rename**: Inline edit or dialog that updates `uploaded_modules.title`.
- **Duplicate**: Creates a new `uploaded_modules` row + copies all `uploaded_module_blocks` rows.
- **Delete**: Confirmation `AlertDialog` warning that all blocks, notes, reflections, and quiz progress will be permanently removed. On confirm, deletes from `uploaded_modules` (cascade deletes blocks).

### 2. ModuleViewPage — Block-Level Navigation
**File: `src/pages/ModuleViewPage.tsx`**
- After each block group's term cards, add two navigation buttons matching `SectionPage` style:
  - **Practice Activities** → navigates to `/module/:id/activity/:block`
  - **Quiz Me** → navigates to `/module/:id/quiz/:block`
- Keep existing Mini Block Quiz as an inline option.
- Add block-level progress indicators (completed quiz badge) similar to `SectionPage`.

### 3. New: Module Quiz Page
**File: `src/pages/ModuleQuizPage.tsx`** (new)
- Replicates the full `QuizPage.tsx` experience (mode selection, strategy mode, calming messages, pie chart stats) but sources questions from `uploaded_module_blocks` quiz fields.
- Pulls all quiz questions (q1, q2, q3) from blocks in the selected block group.
- Formats them as `{ question_text, option_a/b/c/d, correct_option, explanation }` to match native quiz structure.
- On completion, navigates to a results view showing score, mode, and wrong answers.
- Store results in a new `uploaded_quiz_results` table.

### 4. New: Module Activity Page
**File: `src/pages/ModuleActivityPage.tsx`** (new)
- Mirrors `ActivityPage.tsx` but sources terms from `uploaded_module_blocks`.
- Maps block fields to the `Term` interface: `{ id, term: term_title, definition }`.
- Includes matching game, flashcard drill, fill-in-the-blank, word scramble, crossword clues, own words, brain dump, picture match, and mnemonic builder — same activity components.

### 5. Database Migration
Add table for uploaded module quiz results:
```sql
CREATE TABLE public.uploaded_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid REFERENCES public.uploaded_modules(id) ON DELETE CASCADE NOT NULL,
  block_number integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'practice',
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own results" ON public.uploaded_quiz_results
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own results" ON public.uploaded_quiz_results
  FOR SELECT TO public USING (auth.uid() = user_id);
```

### 6. Routes
**File: `src/App.tsx`**
Add three new routes:
- `/module/:id/quiz/:block` → `ModuleQuizPage`
- `/module/:id/results/:block` → `ModuleResultsPage`
- `/module/:id/activity/:block` → `ModuleActivityPage`

### 7. New: Module Results Page
**File: `src/pages/ModuleResultsPage.tsx`** (new)
- Mirrors `ResultsPage.tsx` styling (sunset gradient, score display, wrong answer review).
- Sources data from route state (score, total, mode, wrongCount).
- Saves results to `uploaded_quiz_results` table.
- Navigation back to module view.

### 8. Edge Function — Already Updated
The `process-upload` edge function already generates all required fields (pronunciation, practice_scenario, 3 quiz questions). No changes needed.

### 9. UploadedTermCard — Minor Enhancement
- The Visualize tab currently shows text only. Add auto-generation of images using the existing `generate-term-image` edge function when the Visualize tab is opened (same pattern as native `TermCard`).

## Implementation Order
1. Database migration (uploaded_quiz_results table)
2. MyModulesPage module management (rename/duplicate/delete)
3. ModuleViewPage block navigation buttons
4. ModuleActivityPage
5. ModuleQuizPage + ModuleResultsPage
6. App.tsx route additions
7. UploadedTermCard visualize image generation

## Files Summary
- **New**: `ModuleQuizPage.tsx`, `ModuleActivityPage.tsx`, `ModuleResultsPage.tsx`
- **Modified**: `MyModulesPage.tsx`, `ModuleViewPage.tsx`, `UploadedTermCard.tsx`, `App.tsx`
- **Migration**: `uploaded_quiz_results` table with RLS

