

# Upgrade Uploaded Modules to Match Native TJ Block Experience

## Problem
Currently, uploaded modules display in a simplified collapsible layout (`ModuleViewPage.tsx`) that doesn't match the rich, tabbed, interactive experience of the native study modules (`StudyPage.tsx` + `TermCard.tsx`). The user wants uploaded content to look and behave identically to built-in modules.

## Approach

Rather than duplicating all native module infrastructure (which uses separate `terms`, `questions`, `bookmarks`, `reflections`, `journal_notes` tables), the most effective approach is to **rebuild ModuleViewPage to render each uploaded block using the same tabbed card UI as TermCard**, adapting it to work with the `uploaded_module_blocks` table.

### 1. Add `pronunciation` column to `uploaded_module_blocks` table
**Migration** — add a field for phonetic pronunciation text so the AI can generate it during processing.

### 2. Update Edge Function (`process-upload/index.ts`)
Expand the AI prompt and tool schema to also generate:
- `pronunciation` — phonetic spelling of the term
- `practice_scenario` — a scenario-based practice activity
- `quiz_options_2` / `quiz_question_2` / `quiz_answer_2` — second reinforcement quiz question
- `quiz_options_3` / `quiz_question_3` / `quiz_answer_3` — third reinforcement quiz question

These additional fields get stored in the `uploaded_module_blocks` table.

### 3. Database Migration
Add columns to `uploaded_module_blocks`:
- `pronunciation` (text, default '')
- `practice_scenario` (text, default '')
- `quiz_question_2`, `quiz_options_2`, `quiz_answer_2`
- `quiz_question_3`, `quiz_options_3`, `quiz_answer_3`

### 4. Rebuild `ModuleViewPage.tsx`
Replace the current collapsible section layout with a **full TermCard-style tabbed interface** per block:

**Tabs per block (matching native TermCard):**
1. **Definition** — with SpeakButton
2. **Pronunciation** — phonetic text + SpeakButton for audio playback
3. **Visualize** — shows `visualization_desc`; future: extract/generate images
4. **Metaphor** — with SpeakButton
5. **Affirmation** — with SpeakButton
6. **Reflection** — editable textarea with SpeechToTextButton, saves to `uploaded_module_blocks.user_notes` or a dedicated field
7. **Practice** — displays the practice scenario
8. **Quiz** — interactive quiz with the primary question (select answer, show feedback)
9. **Journal** — editable notes textarea with auto-save and SpeechToTextButton

**Additional per-block features:**
- SpeakButton on term title
- Bookmark toggle (using existing bookmarks table or local state)

**Block group level:**
- "Mini Block Quiz" button per block group — shows 2-3 reinforcement questions
- "Practice Activities" button per block group — links to activity-style exercises
- AIMentorChat integration at bottom

### 5. Add Module Study/Block Routes
Add routes for block-level navigation within uploaded modules:
- `/module/:id/block/:block` — study view for a specific block group

Or keep single-page with scroll-to-block anchors (simpler).

### 6. Create `UploadedTermCard` Component
A new component `src/components/UploadedTermCard.tsx` that mirrors `TermCard.tsx` but reads from `uploaded_module_blocks` fields instead of the `terms` table. This keeps the native TermCard clean while providing identical UI.

---

## Files

**New files:**
- `src/components/UploadedTermCard.tsx` — tabbed card matching TermCard UI for uploaded blocks

**Modified files:**
- `src/pages/ModuleViewPage.tsx` — complete rebuild using UploadedTermCard, block groups, mini quizzes, activities
- `supabase/functions/process-upload/index.ts` — expanded AI prompt with pronunciation, practice scenario, extra quiz questions

**Migration:**
- Add `pronunciation`, `practice_scenario`, `quiz_question_2`, `quiz_options_2`, `quiz_answer_2`, `quiz_question_3`, `quiz_options_3`, `quiz_answer_3` columns to `uploaded_module_blocks`

## Implementation Order
1. Database migration (add columns)
2. Update edge function prompt
3. Create UploadedTermCard component
4. Rebuild ModuleViewPage

