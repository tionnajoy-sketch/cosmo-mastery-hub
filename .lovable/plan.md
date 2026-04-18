

User wants the Learning DNA page and the Learn & Practice (GameGridPage) to be connected with live, real-time data flow. Currently:
- `LearningDNAPage` reads `user_learning_metrics` once on mount via `useLearningMetrics()`
- `GameGridPage` updates metrics as the student completes layers/quizzes/activities, but DNA page doesn't refresh automatically
- DNA fields on `profiles` (`dna_engagement`, `dna_retention`, `dna_confidence`, `layer_scores`, `behavior_history`) are recalibrated by `useDNAAdaptation.updateDNA()` but the DNA page doesn't subscribe to those changes either

Goal: make the DNA Hub a live mirror of the student's behavior in Learn & Practice — when they answer a quiz, finish a layer, or complete an activity, the DNA bars, layer strengths, and recommendations update without a manual refresh.

## Plan

### 1. Real-time subscriptions on the Learning DNA page
Add Supabase Realtime listeners in `LearningDNAPage.tsx` (and inside `useLearningMetrics`) for the current user:
- `user_learning_metrics` rows (INSERT/UPDATE) → re-run `fetchMetrics()`
- `profiles` row (UPDATE) → re-run `refreshProfile()` from `useAuth` so DNA code, layer strength, engagement, retention, confidence values refresh live
- `quiz_results` and `wrong_answers` (INSERT) → trigger a metrics refresh so any quiz taken anywhere shows immediately

Enable realtime on these tables in a migration:
```
ALTER PUBLICATION supabase_realtime ADD TABLE user_learning_metrics, profiles, quiz_results, wrong_answers;
ALTER TABLE user_learning_metrics REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
```

### 2. Make GameGridPage write everywhere DNA reads
Audit the spots where Learn & Practice activity happens and ensure each one updates BOTH:
- `user_learning_metrics` (already wired via `updateTermMetrics` in some flows) — add to any place still missing it
- `profiles.dna_*` + `behavior_history` + `layer_scores` via `useDNAAdaptation.updateDNA(interaction)`

Specifically wire `updateDNA()` calls into:
- `QuizPage` answer-submit (pass `quizCorrect`)
- `ActivityPage` completion (pass `timeSpentSeconds`, optional reflection length)
- `LearningOrchestrator` / `LearningOrbDialog` step completion (pass `quizCorrect` / `reflectionLength` / `timeSpentSeconds`)

This guarantees every win/loss in Learn & Practice flows back to the DNA engine.

### 3. Live DNA snapshot card on GameGridPage
Add a compact "Your Learning DNA — live" strip at the top of `GameGridPage` showing:
- Current 4-character DNA code with color
- Three thin bars: Engagement, Retention, Confidence
- Tiny "updates as you learn" label, plus a link to the full DNA Hub

This card subscribes to the same realtime channels so the student literally sees the bars move after a quiz.

### 4. DNA Hub live indicators
On `LearningDNAPage`, add subtle UI cues that confirm liveness:
- A pulsing green dot + "Live — updates in real time" badge near the DNA code
- When a realtime event fires, briefly highlight the changed metric (e.g., engagement bar flashes) so the student feels the connection
- Add a "Recent activity" mini-feed (last 3 events: "Quiz passed in Anatomy Block 2 → Confidence +", "Activity completed → Engagement +") sourced from the latest `user_learning_metrics` and `quiz_results` rows

### 5. Files to change
- `supabase/migrations/<new>.sql` — enable realtime on the four tables, set REPLICA IDENTITY FULL
- `src/hooks/useLearningMetrics.ts` — add realtime subscription that re-runs `fetchMetrics`
- `src/hooks/useAuth.tsx` — add realtime subscription on the user's profile row → call `refreshProfile()`
- `src/pages/LearningDNAPage.tsx` — live badge, change-flash animation, recent-activity mini-feed
- `src/pages/GameGridPage.tsx` — live DNA snapshot strip at top
- `src/pages/QuizPage.tsx` — call `updateDNA({ quizCorrect })` on every answer
- `src/pages/ActivityPage.tsx` — call `updateDNA({ timeSpentSeconds })` on completion
- `src/components/LearningOrbDialog.tsx` (or `LearningOrchestrator`) — call `updateDNA()` per step

### Notes
- No schema changes beyond the realtime publication migration
- Existing RLS policies already restrict each user to their own rows, so realtime payloads are private by default
- Zero impact on V1 fallback path — all updates are additive

