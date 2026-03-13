

# Comprehensive App Restructure: Navigation, Homepage, Onboarding, My TJ Insights

This is a large restructure covering navigation, homepage redesign, new pages, and onboarding improvements. Here is the implementation plan.

---

## 1. Navigation Menu Overhaul

Update the dropdown menu in `Home.tsx` header to:

- Dashboard
- Study Modules (scrolls to modules or navigates to a dedicated page)
- Practice Lab
- Progress Tracker
- Ask TJ Mentor (placeholder page)
- My TJ Insights (new page — all notes/reflections/journal)
- Upload to TJ Blocks
- My Study Modules
- Settings (placeholder)
- Terms of Use
- Sign Out

This header will be extracted into a reusable `AppHeader.tsx` component used across all pages.

---

## 2. Homepage Redesign (`Home.tsx`)

Restructure into clear sections:

1. **Welcome** — personalized greeting + motivational message
2. **Daily Study Goal** — streak, progress bar, editable goal (existing)
3. **What You Will Walk Away With** — outcome cards (existing)
4. **The TJ Anderson Layer Method** — visual explanation with icons for each layer (Definition, Visualize, Metaphor, Affirmation, Reflection, Journal, Quiz)
5. **How to Use the App** — 6 numbered steps
6. **Continue Studying** button — navigates to study modules section
7. **Study Modules** — section cards (existing)
8. **My TJ Study Modules** — uploaded modules (existing)

Remove redundant sections; keep existing progress dashboard.

---

## 3. Rename "Build" Tab to "Practice"

In `TermCard.tsx`, rename the "Build" tab label from "🧩 Build" to "Practice".

---

## 4. Welcome/Onboarding Page Redesign (`WelcomePage.tsx`)

Restructure into the 7 sections described:

1. Header: "Welcome to CosmoPrep" + "Powered by The TJ Anderson Layer Method™"
2. Who I Am section
3. Why I Created This Platform
4. How the TJ Anderson Layer Method Works — visual blocks with icons for each layer (Definition, Pronunciation, Visualize, Metaphor, Affirmation, Reflection, Journal, Quiz)
5. How to Use the App — 4 steps
6. Student Outcomes — bullet boxes
7. "Start My Study Journey" button → dashboard

This page shows only on first login (check `has_completed_pretest` or a new profile flag). After completion, users go straight to dashboard.

---

## 5. My TJ Insights Page (New)

New page at `/insights` with:

- **Search bar** — full-text search across reflections, journal notes
- **Filters** — by module, block, term, date
- **Insight cards** — each showing term name, module, the reflection/journal text, date
- Click card → navigates to original study block

Data sources: `reflections` table, `journal_notes` table. Join with `terms` and `sections` tables to get context.

---

## 6. Learning Style Discovery Improvements

The existing `PretestPage.tsx` already has a learning style quiz. Enhancements:

- Add a `learning_style` field display on the dashboard (from `pretest_results`)
- Show personalized tip on homepage: "Based on your learning style, focus on Visualization and Reflection sections"
- Pass learning style to Ask TJ Mentor edge function so it can personalize responses

Database: `pretest_results` already stores `learning_style`. Add `learning_style` to the `profiles` table for quick access.

---

## 7. Updated Footer

Update `AppFooter.tsx` to match the new copyright text:

> Copyright © 2026 Tionna Anderson
> The TJ Anderson Layer Method™ is a proprietary learning framework created by Tionna Anderson. Unauthorized reproduction, distribution, or instructional replication is prohibited.

---

## 8. Database Migration

Add `learning_style` column to `profiles` table so it's readily accessible without joining `pretest_results`.

---

## Files

**New files:**
- `src/components/AppHeader.tsx` — reusable nav header
- `src/pages/InsightsPage.tsx` — My TJ Insights page

**Modified files:**
- `src/pages/Home.tsx` — redesigned layout, use AppHeader
- `src/pages/WelcomePage.tsx` — restructured onboarding
- `src/pages/StudyPage.tsx` — use AppHeader
- `src/pages/SectionPage.tsx` — use AppHeader
- `src/components/TermCard.tsx` — rename Build → Practice
- `src/components/AppFooter.tsx` — updated copyright
- `src/components/AIMentorChat.tsx` — no changes needed (already has quick actions)
- `src/App.tsx` — add `/insights` route
- `src/hooks/useAuth.tsx` — add learning_style to Profile interface
- `supabase/functions/ai-mentor-chat/index.ts` — accept learning_style in body, personalize responses

**Migration:**
- Add `learning_style` column to `profiles` table

---

## Implementation Order

1. Database migration (add learning_style to profiles)
2. AppHeader component
3. AppFooter update
4. TermCard tab rename
5. Homepage redesign
6. WelcomePage restructure
7. My TJ Insights page + route
8. Learning style dashboard integration
9. AI mentor learning style awareness

