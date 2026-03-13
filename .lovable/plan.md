

# Upload to TJ Blocks + Navigation Overhaul + Ask TJ Improvements + Block Titles

This is a large scope request spanning multiple systems. Here is the implementation plan broken into phases.

---

## Phase 1: Updated Navigation Menu

Update the header dropdown in `Home.tsx` to match the new menu structure:

- Dashboard (Home)
- TJ Learning Modules (sections list — current home scroll)
- TJ Practice Lab (links to activity pages)
- Ask TJ Mentor (dedicated page)
- Upload to TJ Blocks (new page)
- Progress Tracker (existing `/progress`)
- Settings (placeholder)

---

## Phase 2: Block Title Labels

Currently blocks show "Block 1", "Block 2" etc. with no topic context.

**Change**: Fetch the first few term names per block from the `terms` table and display them as a subtitle under each block heading.

Example: **Block 1** — *Epidermis, Dermis, Subcutaneous*

Files modified: `SectionPage.tsx` (fetch term names per block, display under block title), `StudyPage.tsx` (show block title in header).

---

## Phase 3: TermCard Tab Rename

Rename tabs to match the TJ Layer Method terminology:
- Definition → Definition
- Picture → Visualize
- Metaphor → Metaphor
- Affirmation → Affirmation
- Reflection → Reflection
- Build → Build
- Journal → Journal

The quiz tab lives on QuizPage already, so "Recall Quiz" is the quiz step.

File modified: `TermCard.tsx` (rename "Picture" to "Visualize").

---

## Phase 4: Ask TJ Mentor Improvements

Add quick action buttons above the message input in `AIMentorChat.tsx`:

- Explain this simply
- Give me a metaphor
- Quiz me on this topic
- Break this down TJ style
- Why does this matter in cosmetology
- Encourage me

Each button pre-fills a prompt and sends it. "Break this down TJ style" instructs the AI to return a full TJ block (Definition, Visual, Metaphor, Affirmation, Reflection, Quiz).

Update the edge function system prompt to recognize these action types and respond appropriately.

Also add a welcome header with subtext explaining the mentor's purpose.

---

## Phase 5: Upload to TJ Blocks

### Database

New tables:
- `uploaded_modules` — id, user_id, title, status (uploading/processing/ready), source_filename, created_at, is_instructor_mode boolean
- `uploaded_module_blocks` — id, module_id, block_number, title, definition, visualization_desc, metaphor, affirmation, reflection_prompt, quiz_question, quiz_options (jsonb), quiz_answer, user_notes, created_at

RLS: users can CRUD their own modules and blocks.

### New Edge Function: `process-upload`

- Accepts file content (text extracted client-side for .txt; for PDF/DOCX, use the `document--parse_document` approach via a client-side parser or accept pasted text initially)
- Sends content to Lovable AI (Gemini) with instructions to:
  1. Identify key terms and concepts
  2. For each term, generate: definition, visual description, TJ-style metaphor, affirmation, reflection prompt, quiz question with 3 options
  3. Group terms into blocks of 6-10
  4. Return structured JSON
- Returns the generated blocks

### New Pages

**`UploadPage.tsx`** (`/upload`):
- File upload area (drag-and-drop + click)
- Accept: .pdf, .pptx, .docx, .txt
- Client-side text extraction for .txt files
- For binary formats: use file upload to storage, then edge function processes
- "Convert to TJ Blocks" button appears after upload
- Progress indicator during AI processing
- Two mode toggle: Student Mode / Instructor Mode (instructor mode requires future license check)

**`MyModulesPage.tsx`** (`/my-modules`):
- Lists all user's uploaded modules under "My TJ Study Modules"
- Each module card shows title, block count, date created
- Click to view/edit blocks

**`ModuleViewPage.tsx`** (`/module/:id`):
- View generated TJ blocks
- Edit any field (definition, metaphor, affirmation, etc.)
- Regenerate individual fields via Ask TJ
- Add notes, images
- Save changes
- Ask TJ integration scoped to uploaded content

### Home Page Integration

Add a "My TJ Study Modules" section on the dashboard showing user's uploaded modules, with a link to `/upload`.

---

## Phase 6: Instructor Upload Mode

For now, Instructor Mode will show a "License Required" message with contact info. This placeholder prepares for future school licensing.

---

## Technical Architecture

```text
Client                          Edge Function              AI Gateway
──────                          ─────────────              ──────────
Upload file ──→ Extract text ──→ process-upload ──→ Gemini 3 Flash
                                      │
                                      ▼
                              Parse JSON response
                                      │
                                      ▼
                              Save to uploaded_module_blocks
```

---

## Implementation Order

1. Database migration (uploaded_modules, uploaded_module_blocks)
2. Navigation menu update
3. Block titles on SectionPage
4. TermCard tab rename (Picture → Visualize)
5. Ask TJ quick action buttons
6. Upload page + process-upload edge function
7. My Modules listing + Module view/edit page
8. Dashboard integration

---

## New Files

```text
src/pages/UploadPage.tsx
src/pages/MyModulesPage.tsx
src/pages/ModuleViewPage.tsx
supabase/functions/process-upload/index.ts
```

## Modified Files

```text
src/pages/Home.tsx — new nav items, My Modules section
src/pages/SectionPage.tsx — block title labels
src/components/TermCard.tsx — tab rename
src/components/AIMentorChat.tsx — quick action buttons
src/App.tsx — new routes
supabase/config.toml — new edge function
```

