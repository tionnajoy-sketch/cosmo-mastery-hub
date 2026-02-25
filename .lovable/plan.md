

## Plan: Build Skin Structure and Growth Module

This is a significant expansion that replaces the existing 5-term "Skin" section with a full 35-term module, adds new UI features, and introduces two quiz modes.

### Scope overview

```text
Current state:
  1 section ("Skin") → 5 terms (Block 1) → 5 questions (Block 1)

Target state:
  1 section ("Skin Structure and Growth") → 35 terms (7 blocks of 5) → 35+ questions (5+ per block)
  + bookmarking table + progress indicators + 2 quiz modes
```

### 1. Database schema changes (migration)

**New table: `bookmarks`**
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, NOT NULL, references profiles.id)
- `term_id` (uuid, NOT NULL, references terms.id)
- `created_at` (timestamptz, default now())
- Unique constraint on (user_id, term_id)
- RLS: users can SELECT/INSERT/DELETE their own bookmarks

No other schema changes needed. The existing `terms`, `questions`, `sections`, and `quiz_results` tables already support everything else.

### 2. Data operations (insert tool, not migrations)

**Step 2a: Update the section**
- UPDATE the existing "Skin" section to rename it "Skin Structure and Growth" with a new description reflecting the TJ Anderson Layer Method voice.

**Step 2b: Delete existing terms and questions**
- DELETE the 5 existing questions (Block 1)
- DELETE the 5 existing terms (Block 1)

**Step 2c: Insert 35 terms across 7 blocks**

Each term gets a Definition, Metaphor, and Affirmation written in the TJ Anderson Layer Method voice, following all the rules specified (no dashes, no slang, warm professional tone, vocabulary reinforcement in metaphors, grounding "I" statements for affirmations).

Block layout (5 terms each):

| Block | Terms |
|-------|-------|
| 1 | Epidermis, Dermis, Subcutaneous Tissue, Subcutaneous Layer, Dermal Epidermal Junction |
| 2 | Stratum Corneum, Stratum Lucidum, Stratum Granulosum, Stratum Spinosum, Stratum Germinativum |
| 3 | Papillary Layer, Reticular Layer, Dermal Papillae, Collagen, Elastin |
| 4 | Keratin, Melanin, Melanocytes, Eumelanin, Pheomelanin |
| 5 | Sebaceous Glands, Sebum, Sudoriferous Glands, Sweat Glands, Secretory Coil |
| 6 | Arrector Pili Muscles, Hair Papillae, Barrier Function, Broad Spectrum Sunscreen, Tactile Corpuscles |
| 7 | Sensory Nerve Fibers, Motor Nerve Fibers, Secretory Nerve Fibers, Dermatologist, Dermatology |

**Step 2d: Insert quiz questions (5 per block = 35 questions)**
- State board exam paragraph style stems with realistic client scenarios
- 4 options (A/B/C/D), one best answer, one plausible distractor, two clearly wrong
- Warm supportive explanation field
- Each question linked to its related_term_id

Due to the volume (35 terms + 35 questions), this will require multiple data insertion steps.

### 3. Frontend changes

**3a. Section page (`SectionPage.tsx`)**
- Add a supportive TJ voice welcome message at the top: encouraging the learner to take their time and focus on understanding
- Add progress indicators per block showing completion status (uses `quiz_results` to check if block was completed and score)

**3b. Study page (`StudyPage.tsx`)**
- Add bookmark toggle (heart/bookmark icon) on each TermCard, wired to the new `bookmarks` table
- Add a brief supportive message at the top of each block encouraging slow, intentional learning

**3c. Quiz page (`QuizPage.tsx`)**
- Add mode selection before quiz starts: "Practice Mode" (standard exam prep) and "Confidence Builder Mode" (extra encouragement, gentler feedback on wrong answers, reinforces that mistakes are part of learning)
- In Confidence Builder Mode, wrong-answer feedback includes additional reassurance text
- Answer is hidden until selection (already implemented)

**3d. Results page (`ResultsPage.tsx`)**
- Differentiate messaging based on quiz mode
- Confidence Builder Mode shows more nurturing feedback regardless of score

**3e. Home page (`Home.tsx`)**
- Add overall progress indicator for the section (e.g., "3/7 blocks completed")

### 4. Implementation order

1. Create `bookmarks` table (migration)
2. Update section data, delete old terms/questions, insert all 35 terms (data tool, multiple batches)
3. Insert all 35 questions (data tool, multiple batches)
4. Update `SectionPage.tsx` with supportive message and progress indicators
5. Update `StudyPage.tsx` with bookmark toggle and supportive header
6. Update `QuizPage.tsx` with mode selection (Practice / Confidence Builder)
7. Update `ResultsPage.tsx` with mode-aware messaging
8. Update `Home.tsx` with section progress

### Technical details

- Bookmarks use optimistic UI updates via local state, with background Supabase insert/delete
- Progress is computed by querying `quiz_results` for the current user and section, checking which block_numbers have entries
- Quiz mode is passed as URL query param or route state (no schema change needed)
- All 35 terms will be written with complete Definition, Metaphor, and Affirmation content in the TJ Anderson Layer Method voice before insertion
- Content follows all stated rules: no dashes, no slang, no sarcasm, professional warmth, vocabulary reinforcement in metaphors, grounding "I" statements in affirmations

