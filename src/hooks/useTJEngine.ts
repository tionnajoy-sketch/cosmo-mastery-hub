/* useTJEngine — React hook bridging the TJ Engine to the UI.
 *
 * Run a student submission through the full Engine pipeline, persist
 * stage progress, and apply the resulting brain-strength deltas via
 * the existing useBrainStrengths hook (so DNA bubble + balance update
 * automatically).
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBrainStrengths } from "@/hooks/useBrainStrengths";
import {
  computeUnlockedStages,
  evaluateSubmission,
  loadRules,
  type CompletionState,
  type EngineEvaluation,
  type StageId,
} from "@/lib/tj-engine";
import {
  loadTermStages,
  upsertStageEvaluation,
  type TermStageRow,
} from "@/lib/tj-engine/stageProgress";
import {
  computeAdaptiveDelta,
  type AdaptiveContext,
  type AdaptiveDeltaResult,
} from "@/lib/dna/adaptiveRules";
import { applyDelta } from "@/lib/dna/brainStrengths";
import { deriveActionType, logDnaAction } from "@/lib/dna/actionLogger";

export interface UseTJEngineResult {
  loading: boolean;
  stages: TermStageRow[];
  unlocked: StageId[];
  completionByStage: Partial<Record<StageId, CompletionState>>;
  lastEvaluation: EngineEvaluation | null;
  lastAdaptive: AdaptiveDeltaResult | null;
  submitStage: (args: {
    stage: StageId;
    rawText: string;
    accuracyScore?: number;
    /** Adaptive context — drives the rule-based DNA deltas (correct, reattempt, time, skip). */
    adaptive?: AdaptiveContext;
  }) => Promise<EngineEvaluation | null>;
  refresh: () => Promise<void>;
}

export function useTJEngine(termId: string | null | undefined): UseTJEngineResult {
  const { user } = useAuth();
  const { applyManualDelta, strengths } = useBrainStrengths();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<TermStageRow[]>([]);
  const [unlocked, setUnlocked] = useState<StageId[]>([]);
  const [completionByStage, setCompletionByStage] = useState<
    Partial<Record<StageId, CompletionState>>
  >({});
  const [lastEvaluation, setLastEvaluation] = useState<EngineEvaluation | null>(null);
  const [lastAdaptive, setLastAdaptive] = useState<AdaptiveDeltaResult | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !termId) return;
    setLoading(true);
    try {
      const rows = await loadTermStages(user.id, termId);
      setStages(rows);
      const map: Partial<Record<StageId, CompletionState>> = {};
      for (const r of rows) map[r.stage_id] = r.completion_state;
      setCompletionByStage(map);
      const rules = await loadRules();
      setUnlocked(computeUnlockedStages(rules, map));
    } finally {
      setLoading(false);
    }
  }, [user, termId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitStage = useCallback(
    async (args: {
      stage: StageId;
      rawText: string;
      accuracyScore?: number;
      adaptive?: AdaptiveContext;
    }) => {
      if (!user || !termId) return null;
      const prev = stages.find((s) => s.stage_id === args.stage);
      const prevAttemptCount = prev?.attempt_count ?? 0;

      // If adaptive.reattempt isn't set, infer it from prior attempts.
      const adaptiveCtx: AdaptiveContext = {
        ...args.adaptive,
        reattempt:
          args.adaptive?.reattempt ?? (prevAttemptCount > 0 && args.adaptive?.correct === true),
      };

      const evaluation = await evaluateSubmission({
        stage: args.stage,
        rawText: args.rawText,
        attemptCount: prevAttemptCount + 1,
        accuracyScore: args.accuracyScore ?? 0,
      });

      await upsertStageEvaluation({
        userId: user.id,
        termId,
        stage: args.stage,
        rawText: args.rawText,
        accuracyScore: args.accuracyScore ?? 0,
        evaluation,
        prevAttemptCount,
      });

      // 1. Static engine delta (existing behavior).
      const { brain_key, brain_delta, signal_delta } = evaluation.dna_update;
      const enginePatch: Record<string, number> = {};
      if (brain_delta) enginePatch[brain_key] = brain_delta;
      for (const [k, v] of Object.entries(signal_delta)) {
        if (typeof v === "number" && v !== 0) {
          enginePatch[k] = (enginePatch[k] ?? 0) + v;
        }
      }

      // 2. Adaptive delta (the new rule-based layer).
      const adaptive = computeAdaptiveDelta(adaptiveCtx);
      const merged: Record<string, number> = { ...enginePatch };
      for (const [k, v] of Object.entries(adaptive.patch)) {
        if (typeof v === "number" && v !== 0) {
          merged[k] = (merged[k] ?? 0) + v;
        }
      }

      if (Object.keys(merged).length > 0) {
        await applyManualDelta(merged as any);
      }

      // Surface a reinforcement flag on the returned decision when adaptive
      // logic says so (so callers can open StrengthenLayerDialog without
      // waiting for the legacy attempt-count threshold).
      if (adaptive.triggerReinforcement && !evaluation.decision.trigger_reinforcement) {
        evaluation.decision.trigger_reinforcement = true;
        if (!evaluation.decision.reason) {
          evaluation.decision.reason = "Incorrect answer — reinforcement triggered.";
        }
      }

      setLastAdaptive(adaptive);
      setLastEvaluation(evaluation);
      await refresh();
      return evaluation;
    },
    [user, termId, stages, applyManualDelta, refresh],
  );

  return {
    loading,
    stages,
    unlocked,
    completionByStage,
    lastEvaluation,
    lastAdaptive,
    submitStage,
    refresh,
  };
}
