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

export interface UseTJEngineResult {
  loading: boolean;
  stages: TermStageRow[];
  unlocked: StageId[];
  completionByStage: Partial<Record<StageId, CompletionState>>;
  lastEvaluation: EngineEvaluation | null;
  submitStage: (args: {
    stage: StageId;
    rawText: string;
    accuracyScore?: number;
  }) => Promise<EngineEvaluation | null>;
  refresh: () => Promise<void>;
}

export function useTJEngine(termId: string | null | undefined): UseTJEngineResult {
  const { user } = useAuth();
  const { applyManualDelta } = useBrainStrengths();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<TermStageRow[]>([]);
  const [unlocked, setUnlocked] = useState<StageId[]>([]);
  const [completionByStage, setCompletionByStage] = useState<
    Partial<Record<StageId, CompletionState>>
  >({});
  const [lastEvaluation, setLastEvaluation] = useState<EngineEvaluation | null>(null);

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
    async (args: { stage: StageId; rawText: string; accuracyScore?: number }) => {
      if (!user || !termId) return null;
      const prev = stages.find((s) => s.stage_id === args.stage);
      const prevAttemptCount = prev?.attempt_count ?? 0;

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

      // DNA brain-strength delta from the engine's verdict.
      const { brain_key, brain_delta, signal_delta } = evaluation.dna_update;
      if (brain_delta || Object.keys(signal_delta).length > 0) {
        await applyManualDelta({ [brain_key]: brain_delta, ...signal_delta });
      }

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
    submitStage,
    refresh,
  };
}
