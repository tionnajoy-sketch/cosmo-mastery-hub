/* ───────────────────────────────────────────────────────────────────
 * DNA Action Logger
 *
 * Writes one row to public.dna_action_log per learner action.
 * One row = one full before/after DNA snapshot + the action that
 * caused it. Sits alongside dna_progress_events (per-field deltas).
 *
 * Used by the adaptive engine for test visibility and the admin
 * debug RPC. Pure persistence — no UI, no side effects beyond the
 * DB write.
 * ─────────────────────────────────────────────────────────────────── */

import { supabase } from "@/integrations/supabase/client";
import { getLessonContext } from "./currentLessonContext";
import type { BrainStrengths, StrengthKey } from "./brainStrengths";

import { deriveActionType, type DnaActionType } from "./adaptiveRules";

export { deriveActionType };
export type { DnaActionType };

export interface LogActionInput {
  userId: string;
  layer: string;
  action: DnaActionType;
  dnaBefore: BrainStrengths;
  dnaAfter: BrainStrengths;
  delta?: Partial<Record<StrengthKey, number>>;
  reasons?: string[];
  correct?: boolean | null;
  reattempt?: boolean;
  timeSpentMs?: number;
  reinforcementTriggered?: boolean;
  accuracyScore?: number;
  /** Optional overrides — defaults pulled from getLessonContext(). */
  termId?: string | null;
  moduleId?: string | null;
  lessonLabel?: string | null;
}

/** Write a single dna_action_log row. Swallows errors (logging must never break learning flow). */
export async function logDnaAction(input: LogActionInput): Promise<void> {
  const ctx = getLessonContext();
  const row = {
    user_id: input.userId,
    term_id: input.termId ?? ctx.term_id ?? null,
    module_id: input.moduleId ?? ctx.module_id ?? null,
    lesson_label: input.lessonLabel ?? ctx.term_title ?? "",
    layer: input.layer ?? "",
    action: input.action,
    correct: input.correct ?? null,
    reattempt: !!input.reattempt,
    time_spent_ms: Math.max(0, Math.floor(input.timeSpentMs ?? 0)),
    reinforcement_triggered: !!input.reinforcementTriggered,
    accuracy_score: Math.max(0, Math.floor(input.accuracyScore ?? 0)),
    dna_before: input.dnaBefore,
    dna_after: input.dnaAfter,
    delta: input.delta ?? {},
    reasons: input.reasons ?? [],
  };
  try {
    await (supabase.from("dna_action_log") as any).insert(row);
  } catch (err) {
    // Logging is best-effort — never fail the learning flow on a log write.
    if (typeof console !== "undefined") {
      console.warn("[dna_action_log] insert failed", err);
    }
  }
}

/**
 * Decide the canonical action type from the adaptive context.
 * Used so callers don't have to think about the taxonomy.
 */
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
  const threshold = args.highTimeThresholdMs ?? 60_000;
  if (typeof args.timeSpentMs === "number" && args.timeSpentMs >= threshold) return "time";
  return "complete";
}
