

# CosmoPrep – TJ Anderson Layer Method Implementation Plan

This is a large-scope spec covering 8 major areas. I'll organize it into phases to keep implementation manageable.

---

## Phase 1: Navigation & Menu Restructure

**AppHeader.tsx** — Update the dropdown menu to include a "Study Modules" submenu that lists available sections (Anatomy & Physiology, Skin & Growth, Infection Control) and Coming Soon items. "Study Modules" in the menu currently just navigates to `/` — change it to open a sub-list or navigate to a new `/study-modules` page.

**Home.tsx** — Remove the "My TJ Study Modules" section from the dashboard body. Keep the upload shortcut. The Study Modules selector dropdown and section cards remain (they show progress), but "My Study Modules" moves to menu-only access.

**Calm microcopy** — Add encouraging reminder text at quiz start and new module entry points:
- UploadPage: "You're in a safe place to learn, not to be perfect."
- QuizPage: calm reminder before quiz begins
- ModuleViewPage: gentle welcome text

---

## Phase 2: User Profile & Personalization

**Database migration** — Add columns to `profiles` table:
- `birth_month` (integer, nullable)
- `birth_year` (integer, nullable)  
- `sex` (text, nullable — 'female'/'male'/'prefer_not_to_say')
- `tone_preference` (text, default 'gentle' — 'gentle'/'hype_coach'/'straight')
- `leaderboard_preference` (text, default 'private' — 'private'/'friends'/'global')

**Signup.tsx** — Add fields for birth month/year, sex, tone preference.

**Personalization logic** — The existing `learning_style` already drives study tips. Extend this so:
- UploadedTermCard and TermCard reorder tabs based on learning style (visual → Visualize first, kinesthetic → Practice first, etc.)
- All layers remain available; only default tab order changes

---

## Phase 3: Upload Engine Improvements

**process-upload/index.ts** — Update the system prompt to:
1. **Primary concept per slide** — Pick one main concept as Block title; supporting terms become bullets under Definition or quiz fodder
2. **Merge duplicates** — Add post-processing client-side: before inserting blocks, check if `term_title` already exists in the module and merge content
3. **Real-life metaphors** — Update prompt: "Write a real-world, everyday-life analogy (money, time, relationships, social media, family). Explicitly connect it to the definition using buzz words from the definition. Salon examples are allowed but not required."
4. **Cosmetology State Board quiz style** — Update prompt: "Generate 4-option cosmetology State Board–style multiple choice questions using proper Board phrasing and difficulty."
5. **Source tag** — Add `"Source: Slide X of Y"` to `instructor_notes` for each block
6. **Slide type detection** — Improve prompt to detect case-question slides vs bullet slides vs comparison tables

**UploadPage.tsx** — Add client-side deduplication: after all chunks are processed, merge blocks with identical or very similar `term_title` values before inserting.

---

## Phase 4: Video Support

**Database migration** — Add `video_url` column (text, default '') to `uploaded_module_blocks` table.

**UploadedTermCard.tsx** — For each layer tab, if `video_url` is set, render a small embedded video player below the text. No autoplay. Add a "watched" tracking mechanism that counts toward block completion.

**process-upload/index.ts** — Add `video_url` to the tool schema (optional field, empty string default).

---

## Phase 5: Gamification — Coins, Sounds, Leaderboard

**Database migration** — Create `user_coins` table:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `coins` (integer, default 0)
- `updated_at` (timestamptz)

Add RLS policies for users to read/update their own coins.

**New hook: `useCoins.ts`** — Manages coin state, provides `addCoins(amount, reason)` function. Updates database and triggers UI animation.

**Sound system** — Add small audio files for correct-answer "coin" sound and block-complete "level-up" sound. Global toggle in a settings context (stored in localStorage).

**Integration points:**
- QuizPage / ModuleQuizPage: +10 first attempt, +5 second attempt
- Reflection/Journal save: +3
- Audio listen completion: +2  
- All layers completed in a block: +15

**Leaderboard** — Uses `leaderboard_preference` from profile. New `LeaderboardPage.tsx` showing total coins, streak, blocks mastered. Only shows users who opted in to 'global'.

---

## Phase 6: Study Modules Page

**New page: `StudyModulesPage.tsx`** — Lists all available sections organized as:
- **Available Now**: Anatomy & Physiology, Skin Structure & Growth, Infection Control (clickable, opens section)
- **Coming Soon**: Product Knowledge, Chemical Services, Haircutting & Styling, Business & Professionalism (shows friendly "Notify me" message)

**AppHeader.tsx** — "Study Modules" menu item navigates to `/study-modules` instead of `/`.

**App.tsx** — Add route for `/study-modules`.

---

## Implementation Order

Given the scope, I recommend implementing in this order:

1. **Phase 1** (Navigation + calm microcopy) — quickest, highest UX impact
2. **Phase 3** (Upload engine improvements) — addresses core content quality
3. **Phase 2** (Profile personalization) — database + signup + tab reordering
4. **Phase 6** (Study Modules page) — new page + menu update
5. **Phase 4** (Video support) — database + UI addition
6. **Phase 5** (Gamification) — largest scope, most new tables/logic

---

## Technical Notes

- Profile columns added via database migration tool
- New tables (`user_coins`) need RLS policies scoped to `auth.uid() = user_id`
- Upload prompt changes are the most impactful for content quality — the metaphor and quiz style instructions go into the edge function system prompt
- Tab reordering for personalization is purely client-side based on `profile.learning_style`
- Sound files can be small base64-encoded or hosted in storage bucket

Shall I proceed with Phase 1 first, or would you prefer a different starting point?

