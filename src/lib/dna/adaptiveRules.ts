/* ───────────────────────────────────────────────────────────────────
 * Adaptive DNA Rules — Layer Method™ Adaptive Engine
 *
 * Deterministic, rule-based deltas applied on top of the existing
 * tj-engine static stage deltas. No randomness, no AI guessing.
 *
 * Spec:
 *   Correct answer        → retention +5, confidence +3, accuracy +5
 *   Incorrect answer      → confidence -3, accuracy -4 (triggers reinforcement)
 *   Reattempt + correct   → retention +7, confidence +5, accuracy +6
 *   Skipped reflection    → engagement -2
 *   High time on stage    → engagement +4
 *
 * High-time threshold: time spent above HIGH_TIME_MS_THRESHOLD on a
 * single stage is read as deep engagement, not strain. Rhythm/strain
 * is handled separately by the existing learning-rhythm system.
 * ─────────────────────────────────────────────────────────────────── */

import type { StrengthKey } from "./brainStrengths";

export const HIGH_TIME_MS_THRESHOLD = 60_000; // 60s on a single stage

export interface AdaptiveContext {
  /** Did the learner answer correctly? Omit if the stage isn't gradable. */
  correct?: boolean;
  /** True if this submission is a 2nd+ attempt at the same stage. */
  reattempt?: boolean;
  /** Total ms the learner spent on this stage before submitting. */
  timeSpentMs?: number;
  /** True if the learner skipped the reflection step on this term. */
  skippedReflection?: boolean;
}

export interface AdaptiveDeltaResult {
  /** Strength deltas to apply via applyDelta / applyManualDelta. */
  patch: Partial<Record<StrengthKey, number>>;
  /** True if reinforcement mode should be triggered for this stage. */
  triggerReinforcement: boolean;
  /** Human-readable reason list (useful for logging / UI breadcrumbs). */
  reasons: string[];
}

const EMPTY_RESULT = (): AdaptiveDeltaResult => ({
  patch: {},
  triggerReinforcement: false,
  reasons: [],
});

/** Merge a partial patch into the accumulating delta map. */
function bump(
  target: Partial<Record<StrengthKey, number>>,
  key: StrengthKey,
  amount: number,
): void {
  if (!amount) return;
  target[key] = (target[key] ?? 0) + amount;
}

/**
 * Compute the adaptive delta for a single submission.
 * Pure function — no DB writes, no side effects.
 */
export function computeAdaptiveDelta(ctx: AdaptiveContext): AdaptiveDeltaResult {
  const result = EMPTY_RESULT();

  // 1. Correct vs incorrect answers.
  if (ctx.correct === true) {
    if (ctx.reattempt) {
      // Reattempt + correct → biggest reward (recovery is hard, reward it).
      bump(result.patch, "retention", 7);
      bump(result.patch, "confidence", 5);
      bump(result.patch, "accuracy", 6);
      result.reasons.push("reattempt_correct");
    } else {
      bump(result.patch, "retention", 5);
      bump(result.patch, "confidence", 3);
      bump(result.patch, "accuracy", 5);
      result.reasons.push("first_try_correct");
    }
  } else if (ctx.correct === false) {
    bump(result.patch, "confidence", -3);
    bump(result.patch, "accuracy", -4);
    result.triggerReinforcement = true;
    result.reasons.push("incorrect_answer");
  }

  // 2. Skipped reflection penalty.
  if (ctx.skippedReflection) {
    bump(result.patch, "engagement", -2);
    result.reasons.push("skipped_reflection");
  }

  // 3. High time on stage = deep engagement.
  if (typeof ctx.timeSpentMs === "number" && ctx.timeSpentMs >= HIGH_TIME_MS_THRESHOLD) {
    bump(result.patch, "engagement", 4);
    result.reasons.push("high_time_on_stage");
  }

  return result;
}

/**
 * Term-end accuracy gate. The learner can advance past the final
 * Assess stage only when accuracy ≥ 70 OR they completed a
 * reinforcement cycle.
 */
export const TERM_END_ACCURACY_THRESHOLD = 70;

export interface TermEndGateInput {
  accuracy: number;
  reinforcementCompleted: boolean;
}

export function canAdvanceTermEnd(input: TermEndGateInput): boolean {
  if (input.accuracy >= TERM_END_ACCURACY_THRESHOLD) return true;
  if (input.reinforcementCompleted) return true;
  return false;
}

/* ─── Action taxonomy ─── */

export type DnaActionType =
  | "correct"
  | "incorrect"
  | "retry"
  | "skip"
  | "complete"
  | "reinforcement"
  | "time";

/** Decide the canonical action type from the adaptive context. Pure. */
export function deriveActionType(args: {
  correct?: boolean;
  reattempt?: boolean;
  skippedReflection?: boolean;
  timeSpentMs?: number;
  highTimeThresholdMs?: number;
}): DnaActionType {
  if (args.correct === true && args.reattempt) return "retry";
  if (args.correct === true) return "correct";
  if (args.correct === false) return "incorrect";
  if (args.skippedReflection) return "skip";
  const threshold = args.highTimeThresholdMs ?? HIGH_TIME_MS_THRESHOLD;
  if (typeof args.timeSpentMs === "number" && args.timeSpentMs >= threshold) return "time";
  return "complete";
}
