/* Learner Behavior Intake — Pure derivation helpers.
 *
 * Convert raw intake draft + TJ stage outcome into the normalized
 * fields persisted to learner_behavior_signals.
 */

import { BEHAVIOR_RULES } from "./rules";
import type {
  CognitiveLoad,
  ErrorType,
  IntakeDraft,
  StageOutcome,
} from "./types";

export function wordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function deriveCognitiveLoad(args: {
  timeMs: number;
  hintCount: number;
  retries: number;
  errorType: ErrorType;
}): CognitiveLoad {
  const { timeMs, hintCount, retries, errorType } = args;
  const r = BEHAVIOR_RULES.cognitiveLoad;

  let score = 0;
  if (timeMs > r.highTimeMs) score += 2;
  else if (timeMs < r.lowTimeMs) score -= 1;

  if (hintCount >= r.highHints) score += 2;
  else if (hintCount >= 1) score += 1;

  if (retries >= r.highRetries) score += 2;
  else if (retries >= 1) score += 1;

  if (errorType === "forgot" || errorType === "wrong_layer") score += 1;

  if (score >= 4) return "high";
  if (score <= 0) return "low";
  return "medium";
}

export function deriveLayerIntegrity(draft: IntakeDraft, submitted: boolean): number {
  const w = BEHAVIOR_RULES.integrity;
  let score = 0;
  if (submitted) score += w.submitted;
  if (draft.confidenceRating != null) score += w.confidence;
  if (wordCount(draft.explainBackText) >= BEHAVIOR_RULES.explainBack.minWords)
    score += w.explainBack;
  if (draft.thinkingPath) score += w.thinkingPath;
  return Math.min(100, score);
}

export function deriveBreakdownPoint(args: {
  stageId: string;
  errorType: ErrorType;
  outcome: StageOutcome;
}): string | null {
  const { stageId, errorType, outcome } = args;
  if (outcome.completionState === "complete" && errorType === "none") return null;
  if (errorType === "wrong_layer" && outcome.detectedStage) return outcome.detectedStage;
  return stageId;
}
