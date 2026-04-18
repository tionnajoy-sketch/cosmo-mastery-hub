

User reports 5 distinct issues. Let me address each:

1. **"Updates as you learn" 404** — `LiveDNASnapshot` links to `/dna` but the actual route is `/learning-dna`. Need to fix the Link target.

2. **Not every term has a picture** — backfill hasn't completed for all terms; the lazy-load fallback in GameGridPage may also not be triggering reliably. Need to: (a) re-run backfill more aggressively, (b) strengthen the on-demand generation to fire immediately when a tile mounts without an image, with retry.

3. **Picture doesn't pop up automatically when entering learning** — the LearningOrbDialog "Visualize" step requires the user to click "Generate" instead of auto-fetching. Need to auto-trigger image generation on step mount if no image exists.

4. **Wrong answer still lets you exit the learning area** — `ReinforcementDialog` was wired into `QuizPage`, but NOT into `LearningOrbDialog` / `LearningOrchestrator` (the in-block "Assess" / quiz step). User answers wrong inside the learning flow → can still close dialog. Need to:
   - Wire `ReinforcementDialog` into the quiz step inside `LearningOrbDialog`/`LearningOrbStepContent`
   - Lock the dialog `onOpenChange` while a wrong answer is unresolved
   - Block "Next" / close button until correct answer achieved (or 3 cycles → guided mode)

5. **Answers should be shuffled / not obvious** — currently quiz options render in fixed A/B/C/D order from DB, and reinforcement-loop generates options where correct answer might trend toward "A". Need to:
   - Shuffle option order on every render in `QuizPage`, `StateboardQuiz`, and `ReinforcementDialog`
   - Update `reinforcement-loop` edge function prompt to explicitly randomize correct option position and make distractors conceptually close

## Plan

### Fix 1 — DNA snapshot route
- `src/components/LiveDNASnapshot.tsx`: change `to="/dna"` → `to="/learning-dna"` (verify exact path in `App.tsx`)

### Fix 2 — Universal term images
- `src/pages/GameGridPage.tsx`: strengthen lazy-load — fire `generate-term-image` immediately on tile mount for any missing image, increase concurrency to 5, add a localStorage flag so the page kicks off a one-time bulk fill on first visit
- Trigger `backfill-term-images` automatically on dashboard load if missing-image count > 0 (debounced, once per session)

### Fix 3 — Auto-load picture in learning dialog
- `src/components/LearningOrbDialog.tsx` (Visualize step): in the `useEffect` that runs when `currentStep.key === "visualize"`, auto-call `generateImage()` if no `imageUrl` is set yet — instead of waiting for a manual click
- Same for `LearningOrbStepContent` if the visualize render lives there

### Fix 4 — Lock learning flow on wrong quiz answer
- `src/components/LearningOrbDialog.tsx`:
  - Track `reinforcementLocked` state
  - When the in-flow quiz answer is wrong → set lock → render `ReinforcementDialog`
  - Pass `onOpenChange` guard: while locked, ignore close attempts (return early)
  - Disable "Next" / "Complete" buttons while locked
  - On reinforcement success → unlock + advance
- Same wiring for `LearningOrbStepContent` `StateboardQuiz` component (record incorrect → open ReinforcementDialog)
- `ActivityPage.tsx` if it has quiz-style activities: same gating

### Fix 5 — Shuffle answers + harder distractors
- Create `src/lib/shuffleOptions.ts` helper: takes `{A,B,C,D, correct}` → returns shuffled order plus new correct letter mapping (deterministic per question id so refresh doesn't change layout, but truly randomized vs source)
- Apply in:
  - `src/pages/QuizPage.tsx` (main quiz render)
  - `src/components/LearningOrbStepContent.tsx` `StateboardQuiz`
  - `src/components/ReinforcementDialog.tsx`
- `supabase/functions/reinforcement-loop/index.ts`: update system prompt to:
  - Explicitly require correct answer to be randomly placed across A/B/C/D (not biased to A)
  - Make all 4 distractors plausible, conceptually adjacent, similar length, no "obviously wrong" filler
  - No repeated phrasing patterns from the original missed question

### Files to change
- `src/components/LiveDNASnapshot.tsx` — fix route
- `src/pages/GameGridPage.tsx` — aggressive lazy image fill + auto-backfill trigger
- `src/components/LearningOrbDialog.tsx` — auto-load visualize image, gate close on wrong answer, render ReinforcementDialog
- `src/components/LearningOrbStepContent.tsx` — wire reinforcement into in-flow quiz, shuffle options
- `src/pages/QuizPage.tsx` — shuffle options
- `src/components/ReinforcementDialog.tsx` — shuffle options
- `src/lib/shuffleOptions.ts` — new helper
- `supabase/functions/reinforcement-loop/index.ts` — stronger anti-pattern prompt

### Notes
- No DB schema changes needed
- Reinforcement gate already exists in QuizPage — just extending it into the learning dialog
- Shuffle is deterministic per-question (seeded by question id) to avoid jarring re-orders during a session

