/* useBehaviorIntake — React bridge for the Learner Behavior Intake Layer.
 *
 * Manages a per-stage draft, accepts UI updates, and commits a normalized
 * snapshot to learner_behavior_signals after the TJ Engine resolves.
 * Decoupled from the engine — never blocks the learning flow.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  deriveBreakdownPoint,
  deriveCognitiveLoad,
  deriveLayerIntegrity,
  recommendNextRoute,
  saveSignal,
  wordCount,
  type BehaviorMode,
  type BehaviorSuggestion,
  type ErrorType,
  type IntakeDraft,
  type IntakeSnapshot,
  type MicroDecisionAction,
  type StageOutcome,
  type ThinkingPath,
} from "@/lib/behavior-intake";
import { recordThinkingSelection } from "@/lib/thinking-pattern";

interface UseBehaviorIntakeArgs {
  termId: string | null | undefined;
  stageId: string | null | undefined;
  attemptNumber?: number;
}

const emptyDraft = (termId: string, stageId: string, attempt: number): IntakeDraft => ({
  termId,
  stageId,
  startedAt: Date.now(),
  attemptNumber: attempt,
  mode: "teach",
  confidenceRating: null,
  thinkingPath: null,
  explainBackText: "",
  errorType: "none",
  secondChanceUsed: false,
  secondChanceImproved: false,
  microDecisions: [],
  hintCount: 0,
});

export function useBehaviorIntake({ termId, stageId, attemptNumber = 1 }: UseBehaviorIntakeArgs) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [lastSuggestion, setLastSuggestion] = useState<BehaviorSuggestion | null>(null);
  const committedKeyRef = useRef<string>("");

  // Reset whenever the (term, stage, attempt) changes.
  useEffect(() => {
    if (!termId || !stageId) {
      setDraft(null);
      return;
    }
    setDraft(emptyDraft(termId, stageId, attemptNumber));
    setLastSuggestion(null);
    committedKeyRef.current = "";
  }, [termId, stageId, attemptNumber]);

  const setMode = useCallback((mode: BehaviorMode) => {
    setDraft((d) => (d ? { ...d, mode } : d));
  }, []);

  const setConfidence = useCallback((n: number) => {
    setDraft((d) => (d ? { ...d, confidenceRating: n } : d));
  }, []);

  const setThinkingPath = useCallback((p: ThinkingPath) => {
    setDraft((d) => (d ? { ...d, thinkingPath: p } : d));
  }, []);

  const setExplainBack = useCallback((t: string) => {
    setDraft((d) => (d ? { ...d, explainBackText: t } : d));
  }, []);

  const markErrorType = useCallback((t: ErrorType) => {
    setDraft((d) => (d ? { ...d, errorType: t } : d));
  }, []);

  const markSecondChance = useCallback((used: boolean, improved: boolean) => {
    setDraft((d) => (d ? { ...d, secondChanceUsed: used, secondChanceImproved: improved } : d));
  }, []);

  const recordMicroDecision = useCallback((action: MicroDecisionAction) => {
    setDraft((d) => {
      if (!d) return d;
      const next = {
        ...d,
        microDecisions: [...d.microDecisions, { action, ts: Date.now() }],
      };
      if (action === "hint_opened" || action === "reinforcement_opened") next.hintCount += 1;
      return next;
    });
  }, []);

  const commit = useCallback(
    async (outcome: StageOutcome): Promise<BehaviorSuggestion | null> => {
      if (!user || !termId || !stageId || !draft) return null;
      const key = `${termId}:${stageId}:${outcome.attemptCount}`;
      if (committedKeyRef.current === key) return lastSuggestion;
      committedKeyRef.current = key;

      const submitted = outcome.completionState !== "locked";
      const integrity = deriveLayerIntegrity(draft, submitted);
      const load = deriveCognitiveLoad({
        timeMs: Date.now() - draft.startedAt,
        hintCount: draft.hintCount,
        retries: Math.max(0, outcome.attemptCount - 1),
        errorType: draft.errorType,
      });
      const breakdown = deriveBreakdownPoint({
        stageId,
        errorType: draft.errorType,
        outcome,
      });

      const snap: IntakeSnapshot = {
        user_id: user.id,
        term_id: termId,
        stage_id: stageId,
        attempt_number: outcome.attemptCount,
        mode: draft.mode,
        confidence_rating: draft.confidenceRating,
        explain_back_text: draft.explainBackText,
        explain_back_word_count: wordCount(draft.explainBackText),
        thinking_path: draft.thinkingPath,
        error_type: draft.errorType,
        second_chance_used: draft.secondChanceUsed,
        second_chance_improved: draft.secondChanceImproved,
        micro_decisions: draft.microDecisions,
        layer_completion_integrity: integrity,
        breakdown_point: breakdown,
        cognitive_load: load,
        time_on_stage_ms: Date.now() - draft.startedAt,
      };

      await saveSignal(snap);

      // Track thinking pattern (rule-based, no AI). Only when learner actually
      // picked how they processed it AND the engine produced a pass/fail signal.
      if (draft.thinkingPath) {
        const isCorrect =
          outcome.completionState === "complete"
            ? true
            : outcome.completionState === "locked"
              ? null
              : outcome.accuracyScore >= 70;
        void recordThinkingSelection({
          userId: user.id,
          thinkingPath: draft.thinkingPath,
          isCorrect,
          termId,
          attemptNumber: outcome.attemptCount,
          surface: stageId,
        });
      }

      const suggestion = recommendNextRoute(snap);
      setLastSuggestion(suggestion);
      return suggestion;
    },
    [user, termId, stageId, draft, lastSuggestion],
  );

  const ready = useMemo(() => !!draft, [draft]);

  return {
    draft,
    ready,
    lastSuggestion,
    setMode,
    setConfidence,
    setThinkingPath,
    setExplainBack,
    markErrorType,
    markSecondChance,
    recordMicroDecision,
    commit,
  };
}

export type UseBehaviorIntakeResult = ReturnType<typeof useBehaviorIntake>;
