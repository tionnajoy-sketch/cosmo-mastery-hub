

User asks for two things:
1. **Replace "next-button-through-9-steps" with a vibrant, block-style layout inside each term** — DNA-ordered tiles instead of linear pagination.
2. **Stimulating quizzes with shuffled answers** — confirm/extend shuffling everywhere.

Looking at current state:
- `LearningOrbDialog.tsx` uses linear Back/Next nav through `adaptedSteps[]` (9 steps).
- `shuffleOptions.ts` already exists and is used in `ReinforcementDialog` + `QuizPage`. Need to verify `LearningOrbDialog`'s built-in quiz step + `ModuleQuizPage` + `StateboardQuiz` use it too.
- DNA already produces `adaptedSteps` order — we just need to expose it visually.

## Plan: Block-Style Layer Navigator + Universal Answer Shuffling

### 1. New: Block-Style Step Navigator (replaces linear Next button)

Create **`src/components/LayerBlockNavigator.tsx`** — a colorful tile grid shown at the top of `LearningOrbDialog`, replacing the small step dots.

- Renders one vibrant tile per step in the **DNA-adapted order** (already computed as `adaptedSteps`)
- Each tile shows: step number badge, icon, short label, and a status ring (locked / available / current / complete)
- Tiles use the existing per-step accent colors (already in `STEPS[].color`) with gradient fills + soft glow for vibrancy
- Tap a tile → jumps to that step (only if unlocked: current + completed steps tappable; next step always tappable; future ones locked until prerequisites done)
- Current step pulses; completed tiles show a check; locked tiles dim with a small lock icon
- Mobile: 2-column grid; desktop: horizontal scroll row of 9

DNA wiring (already in place — just surface it):
- `adaptedSteps` order already reflects dominantLayer / engagement
- Add a small caption above the grid: "Your TJ-recommended path" with the first 2-3 step names highlighted

### 2. Layout shift in `LearningOrbDialog`

- Keep top header (avatar, voice toggle, title) unchanged
- **Replace** the existing step-dots row + bottom Back/Next bar with:
  - Top: `LayerBlockNavigator` (collapsible "Show all steps" on mobile)
  - Bottom: only **"Mark step complete"** button (advances state + unlocks next tile) and **"Let TJ Explain Again"**
- Linear Back/Next removed; navigation is tile-driven
- Reinforcement gate logic preserved — locked tiles stay locked while reinforcement is active

### 3. More stimulating quiz visuals (built-in quiz step inside the orb)

In the `quiz` case of `renderContent`:
- Wrap each option in a vibrant gradient card (using `blockAccentColors` from `src/lib/colors.ts`) with hover lift + tap scale
- Add a subtle icon per option (A=spark, B=leaf, C=star, D=heart) so learners stop pattern-matching letters
- Larger touch targets, bolder typography, soft shadow on selected

### 4. Universal answer shuffling

Audit & ensure `shuffleOptions(...)` (already in `src/lib/shuffleOptions.ts`) is applied in **every** quiz surface:

| File | Status | Action |
|---|---|---|
| `ReinforcementDialog.tsx` | ✅ done | none |
| `QuizPage.tsx` | ✅ done | none |
| `ModuleQuizPage.tsx` | ❓ verify | add if missing |
| `LearningOrbDialog.tsx` (quiz step) | ❓ verify | add if missing |
| `LearningOrbStepContent.tsx` (`StateboardQuiz`) | ❓ verify | add if missing |
| `DailyPopQuestion.tsx` | ❌ likely raw | add shuffle |
| `RandomQuizPopup.tsx` | ❌ likely raw | add shuffle |
| `PopQuizPage.tsx` | ❓ verify | add if missing |

Seed shuffle by `question.id` so order is stable within a session but randomized across question loads.

### 5. Files

**New**
- `src/components/LayerBlockNavigator.tsx`

**Modified**
- `src/components/LearningOrbDialog.tsx` — swap step dots + Back/Next for tile navigator; restyle quiz options
- `src/components/LearningOrbStepContent.tsx` — apply shuffle in `StateboardQuiz`
- `src/pages/ModuleQuizPage.tsx` — apply shuffle
- `src/pages/PopQuizPage.tsx` — apply shuffle
- `src/components/DailyPopQuestion.tsx` — apply shuffle
- `src/components/RandomQuizPopup.tsx` — apply shuffle

### Notes
- DNA logic, step content, audio, and reinforcement gate all preserved
- All existing collapsible blocks (just shipped) stay inside each step
- Colors come from existing `pageColors` / `blockAccentColors` — no new palette
- Locked tiles enforce DNA-recommended order while still letting confident learners revisit completed steps

