## Goal

Transform the floating DNA bubble from a small "recent changes" peek into a full, student-friendly progress center. Every change is saved permanently, organized by lesson, filterable, celebrated with milestones, and downloadable as a report.

---

## What the student will see

When the student taps the floating DNA bubble, a full panel opens with five clear tabs:

1. **Overview** — current DNA code, plain-English meaning of each letter, live Engagement / Retention / Confidence bars, and "What changed today."
2. **Timeline** — every DNA update ever recorded, grouped by day, with the lesson name attached so they can see *which* lesson moved the needle.
3. **Lessons** — a per-lesson breakdown: which lesson, what step, before → after for each metric, and a short auto-written note ("Confidence rose after you nailed the final check on Hair Anatomy").
4. **Milestones** — achievement cards (First DNA Update, 5 Lessons Complete, Confidence Climber +20, Code Evolved, 7-Day Streak, etc.) with locked/unlocked states.
5. **Export** — one button to download a clean PDF "DNA Progress Report" they can share with an instructor or keep for themselves.

A **filter bar** at the top of Timeline and Lessons lets them narrow by:
- Time range (Today / This Week / This Month / All Time)
- Metric (Code, Engagement, Retention, Confidence, Layer)
- Direction (Improved / Declined / Any)

The bubble itself keeps its pulse + "DNA+" badge so they always know when something new happened.

---

## What gets built

### 1. Database — persistent history
New table `dna_progress_events` so changes survive refresh and device switches:

```text
dna_progress_events
  id, user_id, created_at
  field          (code | engagement | retention | confidence | layer)
  from_value     (text)
  to_value       (text)
  delta          (integer, nullable — for numeric fields)
  lesson_context (jsonb: { module_id, term_id, term_title, step_key, step_label })
  note           (text — short auto-generated explanation)
```

Plus `dna_milestones` to track unlocked achievements:

```text
dna_milestones
  id, user_id, milestone_key, unlocked_at, metadata (jsonb)
  unique (user_id, milestone_key)
```

RLS: users can SELECT/INSERT their own rows only. No UPDATE/DELETE.

### 2. Lesson context tracking
A tiny global store (`src/lib/dna/currentLessonContext.ts`) the LearningOrbDialog updates whenever a step opens. The bubble reads it when a DNA change fires so each event is tagged with the lesson + step that caused it.

### 3. Bubble → full panel rewrite (`src/components/DNAProgressBubble.tsx`)
- Keep the floating bubble trigger (unchanged look).
- Replace the small popover with a larger sheet/dialog (mobile: full-screen drawer; desktop: 420px right-side sheet) with the 5 tabs above.
- On mount: load events + milestones from Supabase. On every detected DNA change: insert a new event, regenerate notes, evaluate milestones, refresh UI.
- Each event row shows: icon (up/down/neutral), metric name, "before → after (+delta)", lesson name + step badge, time-ago, and the auto note.

### 4. Auto-note generator (`src/lib/dna/progressNotes.ts`)
Pure function that takes `{ field, delta, lessonContext }` and returns a friendly sentence. Examples:
- "Confidence climbed +8 after the Final Check on Hair Anatomy."
- "Your DNA code evolved from VDRG → VDSG — your retention layer leveled up."
- "Engagement dipped slightly during Reflection on Sanitation. Try a shorter session next time."

### 5. Milestone engine (`src/lib/dna/milestones.ts`)
Pure rules evaluated after every event insert:
- `first_change` — first ever DNA update.
- `confidence_climber` — +20 cumulative confidence.
- `retention_master` — retention reaches "strong".
- `code_evolved` — DNA code character changes for the first time.
- `lesson_streak_5` / `lesson_streak_10` — 5 / 10 lessons completed.
- `recovery_hero` — bounced back after a dip.
Unlocks animate a toast + a card in the Milestones tab.

### 6. PDF export (`src/lib/dna/exportReport.ts`)
Client-side using `jspdf` + `jspdf-autotable` (lightweight, no server call). The report includes:
- Header with student name + current DNA code + date.
- Plain-English summary of each DNA letter.
- Trend chart (engagement / retention / confidence over last 30 days, drawn as simple SVG → image).
- Table of every event in the selected filter range.
- Milestones unlocked.
- Footer: "TJ Anderson Layer Method™: Core Cross Agent™ — Copyright © 2026 Tionna Anderson."

Download button in the Export tab triggers `report.pdf` save.

### 7. Quick-filter controls
Reusable `<DNAFilters />` component used by Timeline and Lessons tabs. Filters live in component state and are also reflected in the Export so the downloaded report matches what the student is viewing.

---

## Files

**New**
- `src/lib/dna/currentLessonContext.ts` — tiny pub/sub for active lesson
- `src/lib/dna/progressNotes.ts` — friendly note generator
- `src/lib/dna/milestones.ts` — milestone rules + evaluator
- `src/lib/dna/exportReport.ts` — PDF builder
- `src/components/dna/DNAFullPanel.tsx` — the 5-tab dashboard
- `src/components/dna/DNAFilters.tsx` — filter controls
- `src/components/dna/DNAEventRow.tsx` — single event card
- `src/components/dna/DNAMilestoneCard.tsx` — achievement card

**Edited**
- `src/components/DNAProgressBubble.tsx` — load/persist events, open new full panel
- `src/components/LearningOrbDialog.tsx` — push current term + step into lesson-context store on every step change
- `package.json` — add `jspdf`, `jspdf-autotable`

**Migration**
- Create `dna_progress_events` and `dna_milestones` tables with RLS

---

## Privacy & safety
- All data is per-user, RLS enforced.
- Export is generated client-side — no third-party share.
- No new secrets needed.

---

## What stays the same
- The bubble's position, pulse animation, and "DNA+" badge.
- The "Open My Learning DNA Hub" deep link (moves into the Overview tab footer).
- The lesson flow itself — no changes to the 9-step orchestration.
