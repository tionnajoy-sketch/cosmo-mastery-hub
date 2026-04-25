/* TJ Engine — Stage Progress persistence
 *
 * Loads/saves per-(user, term, stage) progress rows in tj_term_stages.
 * The Engine reads this state to decide unlocks and reinforcement.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  CompletionState,
  EngineEvaluation,
  StageId,
  TJFeedback,
} from "./types";

export interface TermStageRow {
  id?: string;
  user_id: string;
  term_id: string;
  stage_id: StageId;
  completion_state: CompletionState;
  attempt_count: number;
  accuracy_score: number;
  last_submission: string;
  detected_stage: string | null;
  missing_layer: string | null;
  recommended_next_action: string;
  last_feedback: TJFeedback | Record<string, never>;
  reinforcement_triggered: boolean;
}

export async function loadTermStages(
  userId: string,
  termId: string,
): Promise<TermStageRow[]> {
  const { data } = await (supabase.from("tj_term_stages") as any)
    .select("*")
    .eq("user_id", userId)
    .eq("term_id", termId);
  return (data ?? []) as TermStageRow[];
}

export async function upsertStageEvaluation(args: {
  userId: string;
  termId: string;
  stage: StageId;
  rawText: string;
  accuracyScore?: number;
  evaluation: EngineEvaluation;
  prevAttemptCount: number;
}): Promise<void> {
  const { userId, termId, stage, rawText, accuracyScore = 0, evaluation, prevAttemptCount } = args;

  const row: Partial<TermStageRow> = {
    user_id: userId,
    term_id: termId,
    stage_id: stage,
    completion_state: evaluation.decision.completion_state,
    attempt_count: prevAttemptCount + 1,
    accuracy_score: accuracyScore,
    last_submission: rawText.slice(0, 4000),
    detected_stage: evaluation.interpretation.detected_stage,
    missing_layer: evaluation.interpretation.missing_signals[0] ?? null,
    recommended_next_action: evaluation.decision.next_action,
    last_feedback: evaluation.feedback,
    reinforcement_triggered: evaluation.decision.trigger_reinforcement,
  };

  await (supabase.from("tj_term_stages") as any).upsert(row, {
    onConflict: "user_id,term_id,stage_id",
  });
}
