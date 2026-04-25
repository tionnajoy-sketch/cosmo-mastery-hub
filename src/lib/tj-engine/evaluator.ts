/* TJ Engine — Top-level Evaluator
 *
 * Single entry point: takes a student submission for a stage and runs
 * the entire pipeline (interpret → map → feedback → decide → DNA delta).
 * Returns one EngineEvaluation that callers persist + render.
 */

import { findDNA, loadRules } from "./ruleRepository";
import { interpretSubmission } from "./interpreter";
import { generateFeedback } from "./feedbackGenerator";
import { decideProgress } from "./progressController";
import type { EngineEvaluation, StageId } from "./types";

export interface EvaluateArgs {
  stage: StageId;
  rawText: string;
  attemptCount?: number;
  accuracyScore?: number;
}

export async function evaluateSubmission(
  args: EvaluateArgs,
): Promise<EngineEvaluation> {
  const rules = await loadRules();
  const { stage, rawText, attemptCount = 1, accuracyScore = 0 } = args;

  const interpretation = interpretSubmission(rules, rawText, stage);
  const feedback = generateFeedback(rules, stage, interpretation);
  const decision = decideProgress(rules, {
    stage,
    interpretation,
    attemptCount,
    accuracyScore,
  });

  const dnaRule = findDNA(rules, stage);
  const dna_update = dnaRule
    ? {
        brain_key: dnaRule.brain_key,
        brain_delta:
          decision.completion_state === "complete"
            ? dnaRule.brain_delta_complete
            : dnaRule.brain_delta_attempt,
        signal_delta: dnaRule.signal_delta ?? {},
      }
    : {
        brain_key: "language" as const,
        brain_delta: 0,
        signal_delta: {},
      };

  return {
    stage_id: stage,
    interpretation,
    feedback,
    decision,
    dna_update,
  };
}
