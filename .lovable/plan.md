

## V2 DNA Upgrade — Final Plan (with refinements)

### Architecture: Modular Service Layer

Create a single source of truth that abstracts storage, so JSONB today → dedicated tables later requires zero business-logic rewrites.

**New files:**
- `src/lib/dna/types.ts` — `DNAProfileV2`, `LayerScores`, `BehaviorHistory`, `AdaptationContext`, `AdaptationDecisionLog`
- `src/lib/dna/scoring.ts` — pure functions: `computeFinalDepthScore`, `mapRetentionToScore`, `mapConfidenceToScore`, `computeTrend`
- `src/lib/dna/layerStrength.ts` — `evaluateDominantLayer` with stability rules
- `src/lib/dna/recoveryMode.ts` — multi-signal `shouldEnterRecoveryMode`
- `src/lib/dna/behaviorMemory.ts` — append/truncate helpers, trend extraction
- `src/lib/dna/adaptationEngine.ts` — orchestrator: takes profile + history → returns `AdaptationContext` + decision log
- `src/lib/dna/storage.ts` — read/write abstraction (today: profiles JSONB; swappable later)
- `src/lib/dna/logger.ts` — internal `console.debug` decision trail keyed by reason

**Modified:**
- `src/hooks/useDNAAdaptation.ts` — becomes thin wrapper that calls the engine; preserves V1 return shape, adds V2 fields
- `src/components/LearningOrbDialog.tsx` — passes richer interaction payload to `updateDNA`
- `src/components/LearningOrchestrator.tsx` — surfaces V2 context (recoveryMode, trends)
- `src/pages/LearningDNAPage.tsx` — display trend arrows + recoveryMode indicator
- `supabase/functions/_shared/dna.ts` — mirrors client engine (single source for prompt context)
- `supabase/functions/tj-learning-studio/index.ts`, `dynamic-learning/index.ts` — accept richer payload

### Phase 1 — Weighted Decision Model

In `scoring.ts`:
```text
mapRetentionToScore(char A–Z) → 1–10
mapConfidenceToScore(char a–z) → 1–10
computeFinalDepthScore(E,R,C) = E*0.4 + R*0.35 + C*0.25
contentDepth: >7 deep, 4–7 standard, <4 brief
```

V1 bucket strings (`low/developing/strong`) still computed for UI compatibility.

### Phase 2 — Dynamic Layer Strength (Stability Rules)

Schema: `profiles.layer_scores jsonb default '{}'`

In `layerStrength.ts` — `evaluateDominantLayer(scores, currentL, evalHistory)`:
1. **Minimum interactions gate**: total interactions across all layers ≥ 5, else return currentL
2. **Margin gate**: candidate dominant layer must exceed currentL score by ≥ 20% (or absolute +3, whichever larger)
3. **Consistency gate**: track last 3 evaluations in `evalHistory`; only update L if same candidate wins 3× consecutively
4. Returns `{ newL, shouldUpdate, reason }`

`updateDNA` scoring:
- `quizCorrect=true` → `+2` to layer
- `timeSpentSeconds > 30` → `+1`
- `quizCorrect=false` → `-1`
- `timeSpentSeconds < 10` → `-1`

### Phase 3 — Pattern Memory + Smart Recovery Mode

Schema: `profiles.behavior_history jsonb default '{"recentQuizzes":[],"recentTimes":[],"recentReflections":[],"recentLayerEvals":[]}'`

Each array truncated to last 10.

In `recoveryMode.ts` — multi-signal trigger (any 2+ true):
- `failStreak >= 3` (last 3 quiz results)
- `confidenceLevel === "low"` OR `confidenceTrend === "decreasing"`
- `retentionLevel === "low"` OR `retentionTrend === "decreasing"`
- `engagementTrend === "decreasing"`

Recovery mode forces: `difficulty="guided"`, `contentDepth="brief"`, `microSteps=true`, `toneModifier="supportive"`, `addMemoryCues=true`.

### Phase 4 — Extended DNAProfile

```text
DNAProfileV2 extends DNAProfile {
  engagementTrend, retentionTrend, confidenceTrend: "increasing"|"stable"|"decreasing"
  recoveryMode: boolean
  layerScores: Record<layerKey, number>
  weakestLayer: string
  finalDepthScore: number
}
```

Trend = sign of mean delta across last 3 entries vs prior 3. Defaults to "stable" with insufficient data.

### Phase 5 — Enhanced Edge Function Prompts

Client passes:
```text
{ learnerType, dominantLayer, weakestLayer, engagementLevel,
  retentionLevel, confidenceLevel, trendSignals, recoveryMode, finalDepthScore }
```

`_shared/dna.ts` server-side builder produces matching `AdaptationContext`. Prompt logic:
- `recoveryMode=true` → overrides all to gentle/repetitive/micro
- Layer-specific instruction mapping (Applied → real-world, Visual → spatial language, etc.)
- Trend-aware nudges ("confidence rising — push slightly harder")

### Phase 6 — V1 Fallback Guarantee

In `adaptationEngine.ts`:
```text
if (!layerScores || !behaviorHistory || isEmpty) {
  return buildV1AdaptationRules(dna)  // exact V1 logic preserved
}
```

Edge functions: if V2 payload fields missing, fall back to current V1 prompt builder.

Existing `buildAdaptationRules()` export retained as `buildV1AdaptationRules()` — never modified, never removed.

### Phase 7 — Decision Logging (Explainability)

`AdaptationDecisionLog` shape:
```text
{
  timestamp, decisions: [
    { field: "contentDepth", value: "deep", reason: "finalDepthScore=7.8 > 7" },
    { field: "recoveryMode", value: true, reason: "failStreak=3 + confidenceTrend=decreasing" },
    { field: "dominantLayer", value: "V", reason: "consistent lead 3 evals, +24% margin" },
    { field: "fallback", value: "v1", reason: "behaviorHistory empty" }
  ]
}
```

Logged via `console.debug("[DNA]", log)` — never user-facing. Returned alongside rules for future devtools panel.

### Phase 8 — Cleanup

- Shared parser `_shared/dna.ts` — single source for client + server
- Layer keys `B/N/S` now actively assignable via dynamic scoring
- LERC code format unchanged, all UI surfaces unchanged

### Database Migration

```sql
ALTER TABLE profiles
  ADD COLUMN layer_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN behavior_history jsonb NOT NULL DEFAULT
    '{"recentQuizzes":[],"recentTimes":[],"recentReflections":[],"recentLayerEvals":[]}'::jsonb;
```

### Backward Compatibility Checklist
- LERC code format preserved
- `parseDNACode`, `buildAdaptationRules` exports retained as V1 functions
- New V2 wrapper returns superset of V1 fields
- Edge functions accept old + new payloads
- Empty JSONB → automatic V1 fallback path
- No UI changes required for V1-only users

