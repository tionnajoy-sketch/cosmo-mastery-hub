

## Plan: Full Rebuild — CosmoPrep Learning Platform

This is a ground-up rebuild of the app from a simple quiz tool into a layered learning platform with authentication, a Supabase database, 6 distinct page types with unique color themes, and the definition-metaphor-affirmation study method at its core.

---

### Architecture Overview

```text
Auth (Login/Signup)
       ↓
   Home Page
   (section cards)
       ↓
  Section Page
  (block list)
     ↙     ↘
Study Page   Quiz Page
(terms w/    (scenario
 tabs)        questions)
       ↘     ↙
    Results Page
```

---

### 1. Supabase Setup — Database Tables

**Requires connecting Supabase to this project first.**

Create the following tables via migrations:

- **profiles** — `id (uuid, FK → auth.users)`, `name`, `state`, `exam_date`, `program`, `created_at`
  - Trigger: auto-create profile row on signup
  - RLS: users read/update only their own row

- **sections** — `id (uuid)`, `name`, `description`, `order`, `color_theme` (string like "coral", "teal", etc.)

- **terms** — `id (uuid)`, `section_id (FK)`, `term`, `definition`, `metaphor`, `affirmation`, `block_number`, `order`

- **questions** — `id (uuid)`, `section_id (FK)`, `block_number`, `question_text`, `option_a–d`, `correct_option` (A/B/C/D), `explanation`, `related_term_id (FK → terms)`

- **quiz_results** — `id (uuid)`, `user_id (FK → profiles)`, `section_id (FK)`, `block_number`, `score`, `total_questions`, `completed_at`

RLS policies on all tables: sections/terms/questions readable by authenticated users; quiz_results readable/insertable by owner only.

**Seed data** for Skin Block 1: 1 section row, 5 terms (epidermis, dermis, subcutaneous tissue, sebaceous gland, sudoriferous gland), 5 paragraph-style questions with related_term_id links.

---

### 2. Color Theme System — Per-Page Vibrant Palettes

Each page gets its own CSS class that overrides the base CSS variables. Added to `index.css`:

| Page | Theme class | Dominant colors |
|------|------------|-----------------|
| Auth | `.theme-auth` | Deep berry (#7B2D5F) + soft pink |
| Home | `.theme-home` | Warm peach (#F4A460) + cream |
| Section | `.theme-section` | Coral (#E8725A) + white |
| Study | `.theme-study` | Soft gold (#D4A847) + light teal |
| Quiz | `.theme-quiz` | Deep teal (#1A7A6D) + plum accents |
| Results | `.theme-results` | Rose-gold gradient + bright accent |

Each class redefines `--primary`, `--background`, `--card`, etc. so every component on that page automatically picks up the new palette. The wrapper `<div>` on each page applies the class.

---

### 3. Auth Flow — New Pages

**Files:** `src/pages/Login.tsx`, `src/pages/Signup.tsx`

- **Signup**: Fields for name, email, password, state (US state dropdown), exam date (date picker), program (select: Cosmetology / Esthetics / Nail Tech). Calls `supabase.auth.signUp()` then inserts profile row. Warm, encouraging copy.
- **Login**: Email + password. Redirects to Home on success.
- Both pages wrapped in `.theme-auth` with the berry/pink palette.
- Protected route wrapper: redirects unauthenticated users to `/login`.

**Routes added to App.tsx:**
- `/login`, `/signup` — public
- `/` (Home), `/section/:id`, `/section/:id/study/:block`, `/section/:id/quiz/:block`, `/section/:id/results/:block` — protected

---

### 4. Home Page — Rebuild

**File:** `src/pages/Home.tsx`

- `.theme-home` wrapper (peach background).
- Header: "Welcome, [first name]" pulled from profiles table. Subline: "Let's get you ready to pass your boards."
- Fetches all sections ordered by `order`. Renders a card per section with name, description, and "Start" / "Continue" button.
- Tapping a card navigates to `/section/:id`.

---

### 5. Section Page — New

**File:** `src/pages/SectionPage.tsx`

- `.theme-section` wrapper (coral).
- Header: section name + description (fetched by ID).
- Fetches terms for this section, groups by `block_number`.
- Renders a row per block: "Block [#] — [X] terms" with two buttons:
  - **Study Block** (primary) → `/section/:id/study/:block`
  - **Quiz Block** (outline) → `/section/:id/quiz/:block`

---

### 6. Study Page — The Heart of the Method

**File:** `src/pages/StudyPage.tsx`

- `.theme-study` wrapper (soft gold/teal).
- Header: section name + "Block [#]". Instruction text: "Tap through Definition, Metaphor, and Affirmation for each term. Take your time."
- Fetches terms where `section_id` and `block_number` match, ordered by `order`.
- Each term rendered as a card:
  - Term name displayed prominently.
  - Three pill-style toggle buttons: **Definition** | **Metaphor** | **Affirmation**.
  - Only one text block visible at a time (default: Definition).
  - Smooth animated text swap on toggle.
- Bottom: primary button "Quiz Me on This Block" → navigates to quiz for same section + block.

---

### 7. Quiz Page — Scenario Questions

**File:** `src/pages/QuizPage.tsx`

- `.theme-quiz` wrapper (deep teal/plum).
- Header: "[Section] — Block [#] Quiz". Subline: "Scenario questions — choose the best answer."
- Fetches questions for this section + block. Shows one at a time.
- Question text rendered as a paragraph. Four answer buttons (A–D).
- On answer:
  - Correct → green "Correct!" banner.
  - Wrong → "Not quite. Let's look at why."
  - Shows explanation text.
  - Shows related term + its metaphor: "Related term: [term]" with the metaphor text.
- "Next question" button advances. After last question → Results page.

---

### 8. Results Page — New

**File:** `src/pages/ResultsPage.tsx`

- `.theme-results` wrapper (rose-gold gradient).
- "Block [#] Complete!" with score display.
- Encouraging message.
- Saves result to `quiz_results` table.
- Two buttons:
  - "Review this block" → back to Study page.
  - "Back to section" → back to Section page.

---

### 9. Existing Files — What Happens

| File | Action |
|------|--------|
| `src/data/quizData.ts` | Removed — data moves to Supabase |
| `src/pages/Index.tsx` | Replaced by Home.tsx (Index becomes redirect) |
| `src/components/CategoryCard.tsx` | Replaced by new SectionCard component |
| `src/components/QuizCard.tsx` | Rebuilt for new question format |
| `src/components/QuizView.tsx` | Replaced by QuizPage.tsx |
| `src/components/QuizResults.tsx` | Replaced by ResultsPage.tsx |
| `src/components/NavLink.tsx` | Kept/updated |

---

### 10. Files Created / Modified Summary

**New files (~12):**
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Home.tsx`
- `src/pages/SectionPage.tsx`
- `src/pages/StudyPage.tsx`
- `src/pages/QuizPage.tsx`
- `src/pages/ResultsPage.tsx`
- `src/components/SectionCard.tsx`
- `src/components/TermCard.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useAuth.tsx` (auth context)
- `src/lib/supabase.ts` (client init)

**Modified files:**
- `src/App.tsx` — new routes + auth provider
- `src/index.css` — 6 theme classes added
- `tailwind.config.ts` — any new color tokens

**Removed files:**
- `src/data/quizData.ts`
- `src/components/CategoryCard.tsx`
- `src/components/QuizView.tsx`
- `src/components/QuizResults.tsx`
- `src/components/QuizCard.tsx`

**Supabase migrations:**
- 1 migration: create tables (profiles, sections, terms, questions, quiz_results) + trigger + RLS
- 1 seed: insert Skin section, 5 Block 1 terms, 5 Block 1 questions

---

### Prerequisites

Supabase must be connected to this project before implementation can begin. The first step will be to connect Supabase, then run the migration and seed data.

