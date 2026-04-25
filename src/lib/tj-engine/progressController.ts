/* TJ Engine — Progress Controller
 *
 * Decides what happens after a submission:
 *   - stay
 *   - review
 *   - practice
 *   - strengthen layer (reinforcement)
 *   - advance (unlock next stage)
 *   - complete term
 *
 * Never auto-advances on incorrect answers.
 */

import { findReinforcement, findUnlock } from "./ruleRepository";
import type { TJRuleSet } from "./ruleRepository";
import type {
  CompletionState,
  InterpretedSubmission,
  ProgressDecision,
  StageId,
} from "./types";

const ORDER: StageId[] = [
  "visualize",
  "define",
  "breakdown",
  "recall_reconstruction",
  "recognize",
  "metaphor",
  "information",
  "reflection",
  "application",
  "assess",
];

export function nextStage(stage: StageId): StageId | undefined {
  const i = ORDER.indexOf(stage);
  if (i < 0 || i >= ORDER.length - 1) return undefined;
  return ORDER[i + 1];
}

export interface DecideArgs {
  stage: StageId;
  interpretation: InterpretedSubmission;
  attemptCount: number;
  accuracyScore: number;
}

export function decideProgress(
  rules: TJRuleSet,
  args: DecideArgs,
): ProgressDecision {
  const { stage, interpretation, attemptCount, accuracyScore } = args;

  // Assess stage: never advance on wrong.
  if (stage === "assess") {
    if (accuracyScore >= 100) {
      return {
        next_action: "complete_term",
        reason: "Assess passed at full accuracy — term mastered.",
        trigger_reinforcement: false,
        completion_state: "complete",
      };
    }
    const reinforce = findReinforcement(rules, stage);
    return {
      next_action: "strengthen_layer",
      reason: "Assess answered incorrectly. Reinforcing recall pathway.",
      trigger_reinforcement: true,
      reinforcement: reinforce,
      completion_state: "needs_reinforcement",
    };
  }

  // Recall reconstruction has accuracy gating.
  if (stage === "recall_reconstruction") {
    if (accuracyScore >= 50) {
      return {
        next_action: "advance",
        reason: "Recall above threshold.",
        trigger_reinforcement: false,
        unlock_next_stage: nextStage(stage),
        completion_state: "complete",
      };
    }
    return {
      next_action: "strengthen_layer",
      reason: "Recall under 50%. Looping back before moving on.",
      trigger_reinforcement: true,
      reinforcement: findReinforcement(rules, stage),
      completion_state: "needs_reinforcement",
    };
  }

  // Default behavior for typed-text stages.
  if (interpretation.is_complete) {
    return {
      next_action: "advance",
      reason: "Stage complete — required signals present.",
      trigger_reinforcement: false,
      unlock_next_stage: nextStage(stage),
      completion_state: "complete",
    };
  }

  // Incomplete: maybe trigger reinforcement after enough attempts.
  const reinforce = findReinforcement(rules, stage);
  if (reinforce && attemptCount >= reinforce.trigger_after_attempts) {
    return {
      next_action: "strengthen_layer",
      reason: `Repeated attempts (${attemptCount}) without completing this layer.`,
      trigger_reinforcement: true,
      reinforcement: reinforce,
      completion_state: "needs_reinforcement",
    };
  }

  return {
    next_action: "stay",
    reason: "Layer not yet complete. Stay and refine the response.",
    trigger_reinforcement: false,
    completion_state: "incomplete",
  };
}

/** Compute which stages should currently be unlocked given a completion map. */
export function computeUnlockedStages(
  rules: TJRuleSet,
  completionByStage: Partial<Record<StageId, CompletionState>>,
): StageId[] {
  const unlocked: StageId[] = [];
  for (const stage of ORDER) {
    const rule = findUnlock(rules, stage);
    if (!rule) continue;
    const allMet = rule.requires_completed.every(
      (req) => completionByStage[req] === "complete",
    );
    if (allMet) unlocked.push(stage);
  }
  return unlocked;
}
