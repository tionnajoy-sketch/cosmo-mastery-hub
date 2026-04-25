## Learner Behavior Intake Layer

A modular, rules-only data layer that sits **between the student submission and the TJ Engine**. It captures 10 behavior signals per stage submission, persists them, and makes them available for the TJ Engine + DNA Code to consume later. No AI calls.

### Goals
- Collect the 10 requested behavior signals during normal stage flow.
- Keep the layer **modular and isolated** so the existing TJ Engine, DNA, and Brain Strength code stays untouched.
- Use form inputs, conditional UI, and timing — no LLMs.
- Provide a clean read API so the future "full backend learning engine" can pull behavior history and route adaptively.

---

### 1. New database table — `learner_behavior_signals`

One row per stage submission. Stores raw signals + a normalized snapshot.

Columns:
- `id` uuid PK
- `user_id` uuid (RLS: own rows)
- `term_id` uuid
- `stage_id` text (matches TJ Engine stage IDs)
- `attempt_number` int
- `mode` text — `'teach'` or `'test'` (signal #7)
- `confidence_rating` int 1–5 (signal #1)
- `explain_back_text` text, `explain_back_word_count` int (signal #2)
- `thinking_path` text — `'visual' | 'verbal' | 'logical' | 'story' | 'kinesthetic'` (signal #3)
- `error_type` text — `'none' | 'misread' | 'forgot' | 'guessed' | 'wrong_layer' | 'partial'` (signal #4)
- `second_chance_used` bool, `second_chance_improved` bool (signal #5)
- `micro_decisions` jsonb — array of `{action, ts}` events: hint clicks, replays, scrolls past, skips (signal #6)
- `layer_completion_integrity` int 0–100 — derived score: % of required sub-actions completed (signal #8)
- `breakdown_point` text — `'visual' | 'definition' | 'breakdown' | 'recall' | 'recognize' | 'metaphor' | 'information' | 'reflection' | 'application' | 'assess' | null` (signal #9)
- `cognitive_load` text — `'low' | 'medium' | 'high'` (signal #10) — derived from time-on-task, hint count, retries
- `time_on_stage_ms` int
- `created_at` timestamptz default now()

RLS: select / insert / update where `auth.uid() = user_id`. No delete.

Index on `(user_id, term_id, stage_id, created_at desc)`.

### 2. Behavior Intake module (`src/lib/behavior-intake/`)

Pure TS, no React, no AI. Mirrors the structure of `src/lib/tj-engine/`.

Files:
- `types.ts` — `BehaviorSignal`, `MicroDecision`, `IntakeDraft`, `IntakeSnapshot`.
- `derive.ts` — pure functions:
  - `deriveCognitiveLoad({ timeMs, hintCount, retries, errorType })`
  - `deriveLayerIntegrity({ requiredActions, completedActions })`
  - `deriveBreakdownPoint({ stageId, errorType, completionState })`
- `rules.ts` — thresholds (e.g., `cognitiveLoad: high if time>180s OR hints>=3`).
- `store.ts` — `saveSignal()`, `loadRecentSignals(userId, termId, n)`, `loadProfileAggregate(userId)` (rolling averages of confidence, dominant thinking path, most common breakdown point, mode preference).
- `index.ts` — barrel export.

### 3. Hook — `useBehaviorIntake(termId, stageId)`

Manages a draft in React state during a stage:
- `setConfidence(n)`, `setThinkingPath(p)`, `setExplainBack(t)`, `setMode(m)`
- `recordMicroDecision(action)` — push to in-memory queue
- `markErrorType(t)`, `markSecondChance({ used, improved })`
- `commit({ stageOutcome })` — derives integrity, cognitive load, breakdown point, then writes to `learner_behavior_signals` via `store.saveSignal`.

Auto-resets when `(termId, stageId)` changes.

### 4. UI — Behavior Intake Strip (component)

`src/components/behavior-intake/BehaviorIntakeStrip.tsx`

A compact, premium card that renders inline at the bottom of each stage in `LearningOrbDialog.tsx`, **above** the existing TJ Feedback Panel. Three short prompts only — never feels like a survey:

1. **Mode toggle**: "Teach Mode 🎓 / Test Mode 🧪" (pill switch). Default = teach. (signal #7)
2. **Confidence slider**: "How sure are you?" 1–5 emoji scale (signal #1).
3. **Thinking path chips**: "How did you think this through?" — Picture · Words · Logic · Story · Doing (signal #3).
4. **Explain-it-back textarea** (only on Define / Recall / Reflection / Assess stages): "Say it back in your own words" with `SpeechToTextButton` (signal #2).

Visible only after the student submits the stage's main answer. Completing it (or skipping after 6s) commits the signal row.

Sub-components:
- `ModeToggle.tsx`
- `ConfidenceSlider.tsx`
- `ThinkingPathChips.tsx`
- `ExplainItBack.tsx`
- `ErrorTypePicker.tsx` — shown only when the TJ Engine returns `completion_state !== 'complete'` (signal #4): "What happened?" → Misread · Forgot · Guessed · Wrong layer · Partly right.
- `SecondChanceBanner.tsx` — shown when `attempt_count >= 2`: tracks whether the retry beat the first attempt (signal #5).

Tone follows Guided Coaching Voice; styling matches `TJFeedbackPanel`.

### 5. Micro-decision tracker (signal #6)

Add a tiny event recorder used by the orb dialog:
- `recordMicroDecision('hint_opened' | 'tts_replayed' | 'scrolled_past' | 'skip_clicked' | 'reread' | 'image_zoomed', { stageId })`

Wire into existing buttons in `LearningOrbDialog.tsx` and `LearningOrbStepContent.tsx` (Speak/Replay, Reinforcement open, hint reveals, skip-next). Pure passthrough — no UI change.

### 6. Conditional routing (rule-based, no AI)

`src/lib/behavior-intake/router.ts` exports `recommendNextRoute(snapshot)`:

- `cognitive_load === 'high'` AND `confidence <= 2` → suggest **TJ Reset Café**.
- `error_type === 'wrong_layer'` → suggest **Strengthen This Layer** (existing dialog).
- `second_chance_used && !improved` → suggest **Review Concept** (jump back to Visualize).
- `mode === 'teach'` AND `integrity >= 80` → suggest **Switch to Test Mode**.
- otherwise → **Continue**.

Wire output into the existing `TJFeedbackPanel`'s "recommended next action" buttons so they reflect both the TJ Engine decision AND the behavior snapshot (engine wins on safety; behavior router refines).

### 7. Connection points to existing systems

- **TJ Engine**: `useTJEngine.submitStage` keeps signature unchanged. After it resolves, the orb calls `useBehaviorIntake.commit({ stageOutcome })`. Engine and intake stay decoupled.
- **DNA Code**: no schema change to `profiles`. Add a thin reader `getBehaviorAggregateForDNA(userId)` returning `{ avgConfidence, dominantThinkingPath, dominantBreakdown, prefersTeachMode }` so future DNA recalibration can read it. Not wired in this pass.
- **Brain Strengths**: untouched.
- **Future engine hook**: `loadRecentSignals` is the single read API the future backend engine will consume.

### 8. Files added / edited

**New**
- `supabase/migrations/<ts>_learner_behavior_signals.sql` (table + RLS + index)
- `src/lib/behavior-intake/{types,derive,rules,store,router,index}.ts`
- `src/hooks/useBehaviorIntake.ts`
- `src/components/behavior-intake/BehaviorIntakeStrip.tsx`
- `src/components/behavior-intake/ModeToggle.tsx`
- `src/components/behavior-intake/ConfidenceSlider.tsx`
- `src/components/behavior-intake/ThinkingPathChips.tsx`
- `src/components/behavior-intake/ExplainItBack.tsx`
- `src/components/behavior-intake/ErrorTypePicker.tsx`
- `src/components/behavior-intake/SecondChanceBanner.tsx`
- `mem://features/learner-behavior-intake` (+ index.md entry)

**Edited**
- `src/components/LearningOrbDialog.tsx` — mount `BehaviorIntakeStrip`, wire `recordMicroDecision` into existing buttons, call `commit` after engine submission, pass router suggestion into `TJFeedbackPanel`.
- `src/components/TJFeedbackPanel.tsx` — accept optional `behaviorSuggestion` prop and render its action label/route.

### Out of scope (this pass)
- No AI calls.
- No DNA Code mutation.
- No new dashboards (data is captured and queryable; visualization comes later).
- No changes to `tj_rules` or `tj_term_stages`.
