
# Refining Learn & Practice vs TJ Anderson Layer Method™ v2

Two distinct environments, each with a clear purpose, active learning every 1–2 screens, and tighter visual polish.

## 1. Positioning & entry points

- **Learn & Practice** → rapid mastery / state-board prep.
- **TJ Anderson Layer Method™ v2** → deep learning, reflection, transformation.
- Update Home tiles + `AppMenuSheet` so each path has a one-line promise:
  - Learn & Practice: "Drill, recall, and pass the exam."
  - Layer Method™ v2: "Think it. Connect it. Transform it."
- Route map:
  - `/practice` → new **Rapid Mastery Hub** (replaces current Practice Lab landing for this purpose; existing routes preserved).
  - `/cluster/skin-structure-and-growth` and `/lesson/:slug` continue to host v2.

## 2. Learn & Practice — Rapid Mastery environment

New surface: `src/pages/RapidMasteryPage.tsx` at `/practice`. Pulls existing terms from `terms` table; reuses existing activity components.

Modes, one per tab, all built around **active recall every screen**:

1. **Flashcards** — front/back flip, "Got it / Review" buttons (writes to existing confidence/review tables via `saveConfidenceRating`).
2. **Matching** — term ↔ definition pair game (reuse logic from `src/components/activities/PictureMatch.tsx` styling).
3. **Multiple Choice** — 4-option state-board format (reuse `quiz_question_*` fields already on `terms`).
4. **Timed Challenge** — 60-second rapid MCQ; coin reward via `useCoins`.
5. **State Board Prep** — 25-question mixed bank pulling from any completed section.
6. **Progress Checkpoint** — auto-shown every lesson completion: 3-question mini-check + confidence slider; stores result so the Readiness Meter updates.

Each screen ends with one action (answer, rate confidence, or flag for review). No passive reading screens.

## 3. TJ Anderson Layer Method™ v2 — Deep Learning environment

Upgrade `src/pages/TJLessonPage.tsx` so every 1–2 layers has an active beat:

- **Visualize** → "What do you notice?" 1-tap prompt.
- **Apply** → scenario tap-choice.
- **Breakdown** → drag-or-tap word-part match.
- **Recognize** → existing spatial click.
- **Metaphor** → "Make it yours" short input.
- **Awareness** → 3-option self-check.
- **Reflect** → journal entry → **contextual TJ response** (see §5).
- **Assess** → open response (existing).
- **TJ Insight™** → reveal-on-tap card (already present, restyle).

All v2 active beats write to existing behavior-intake / DNA tables — no new schema.

## 4. Knowledge Web™ → Learning Pathways

Rework the SVG in `src/pages/TJClusterPage.tsx` and the in-lesson pill row in `TJLessonPage.tsx`:

- Render nodes in a **progression chain** (left → right) with curved edges for "leads to" relationships, plus thin dotted edges for "related to".
- Color edges by relationship type; size nodes by mastery (read from `term_learning_status`).
- Add a legend: ● mastered, ◐ in progress, ○ not started; → prerequisite chain, ⋯ related concept.
- Clicking a node still routes to `/lesson/:slug`; hovering shows a tooltip with the term's one-line purpose.

Data: store prerequisite chain in a new `tj_lessons.prerequisites text[]` column (migration), backfill the 10 Skin cluster lessons.

## 5. Contextual TJ in Reflection

In `TJLessonPage.tsx` Reflect layer:

- After learner submits reflection, call existing `generate-guided-lesson` edge function with a new `mode: "reflection_response"` branch (small addition), which returns a 3-part TJ reply: **mirror → affirm → next nudge**.
- Cache per (user, term) in a new `tj_reflection_responses` table so re-opening shows the same response.
- Empty-state placeholder before they write: "TJ is listening. Two sentences is enough."

## 6. Visual alignment pass on lesson cards

Standardize across `TJLessonPage`, `TJClusterPage`, Rapid Mastery cards, and Home v2 tile:

- Card: `rounded-2xl`, `min-h-[280px]` for grid cards, `p-6`, consistent 1px border + soft accent glow.
- Image / icon block: fixed `h-32` top region, `object-cover`, centered.
- Typography scale: title `font-display text-lg`, body `text-sm leading-relaxed text-muted-foreground`, meta `text-xs uppercase tracking-wide`.
- Spacing rhythm: `space-y-3` inside cards, `gap-4` between cards, `py-8` between sections.
- All colors via existing semantic tokens + `accent_color` per lesson — no hard-coded hex in components.

## Files to be created or edited

**New**
- `src/pages/RapidMasteryPage.tsx`
- `src/components/rapid-mastery/FlashcardDeck.tsx`
- `src/components/rapid-mastery/MatchingBoard.tsx`
- `src/components/rapid-mastery/MultipleChoiceRunner.tsx`
- `src/components/rapid-mastery/TimedChallenge.tsx`
- `src/components/rapid-mastery/StateBoardPrep.tsx`
- `src/components/rapid-mastery/ProgressCheckpoint.tsx`
- `src/components/tj-lesson/ActiveBeat.tsx` (shared 1-screen active prompt)
- `src/components/tj-lesson/ReflectionWithTJ.tsx`
- `src/components/knowledge-web/PathwayGraph.tsx`

**Edited**
- `src/App.tsx` — register `/practice`
- `src/pages/Home.tsx` — two clear entry tiles + promise copy
- `src/components/AppMenuSheet.tsx` — relabel + reorder
- `src/pages/TJLessonPage.tsx` — wire ActiveBeat into Visualize / Apply / Awareness, swap Reflect for `ReflectionWithTJ`, restyle cards
- `src/pages/TJClusterPage.tsx` — swap radial SVG for `PathwayGraph`, add legend, card polish
- `supabase/functions/generate-guided-lesson/index.ts` — add `mode: "reflection_response"` branch

**Schema (migration)**
- `tj_lessons.prerequisites text[]` (nullable), backfill 10 Skin cluster rows
- `tj_reflection_responses` table: `id`, `user_id`, `lesson_slug`, `reflection_text`, `tj_response`, timestamps; RLS owner-only; GRANTs to authenticated + service_role

## Out of scope this pass

- New clusters beyond Skin Structure & Growth
- Replacing legacy `/learn` flow
- Reflection Journal aggregation page (separate future task)
- New AI models or providers
