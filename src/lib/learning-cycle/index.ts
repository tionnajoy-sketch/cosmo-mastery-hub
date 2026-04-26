// Learning Cycle Loop — rule-based, no AI.
// Replaces a strict linear progression with a cycle:
//   Learn → Try → Struggle → Reset → Re-enter → Mastery
//
// Pure functions + a tiny persistence helper. The rules are evaluated
// inside LearningOrbDialog using existing signals so we don't need to
// add new event listeners or refactor the flow.

import { supabase } from "@/integrations/supabase/client";

export type CycleStage =
  | "learn"
  | "try"
  | "struggle"
  | "reset"
  | "reenter"
  | "mastery";

// Step keys that count as "reading content".
// Anything not in this set and not a quiz/application step is also treated as Learn.
const READ_STEP_KEYS = new Set<string>([
  "visual",
  "definition",
  "breakdown",
  "scripture",
  "recognize",
  "metaphor",
  "information",
  "reflection",
  "recall_reconstruction",
]);

// Step keys that count as "answering questions".
const TRY_STEP_KEYS = new Set<string>(["quiz", "application"]);

export interface CycleSignals {
  /** Current orb step key (e.g. "visual", "quiz", "application"). */
  stepKey: string;
  /** Total wrong attempts on the current term. */
  wrongAttempts: number;
  /** True the moment a correct answer is registered. */
  isCorrect: boolean | null;
  /** True the first frame after a reset/café event closes. */
  cameFromReset: boolean;
  /** True if learner just answered (selected/submitted) a question. */
  justAnswered: boolean;
  /** True if mastery conditions just became satisfied. */
  masteryReached: boolean;
}

export interface CycleDecision {
  /** Stage to transition to, or null to stay in the current stage. */
  next: CycleStage | null;
  reasons: string[];
}

/**
 * Priority order — only one stage fires per evaluation:
 *  1. mastery   (mastery conditions met)
 *  2. reset     (just came from café/reset)
 *  3. reenter   (was in reset and now answering again)
 *  4. struggle  (2+ wrong attempts)
 *  5. try       (on a try-step OR just answered)
 *  6. learn     (on a read-step)
 *
 * We also "stay" if the rule would re-emit the current stage, so the
 * caller doesn't spam the database with duplicate transitions.
 */
export function evaluateCycleStage(
  current: CycleStage | null,
  signals: CycleSignals,
): CycleDecision {
  const reasons: string[] = [];

  if (signals.masteryReached) {
    return current === "mastery"
      ? { next: null, reasons: [] }
      : { next: "mastery", reasons: ["mastery conditions met"] };
  }

  if (signals.cameFromReset) {
    if (current === "reset") return { next: null, reasons: [] };
    return { next: "reset", reasons: ["entered TJ Café / reset"] };
  }

  if (current === "reset" && signals.justAnswered) {
    return { next: "reenter", reasons: ["answered again after reset"] };
  }

  if (signals.wrongAttempts >= 2) {
    return current === "struggle"
      ? { next: null, reasons: [] }
      : { next: "struggle", reasons: [`${signals.wrongAttempts} wrong attempts`] };
  }

  if (TRY_STEP_KEYS.has(signals.stepKey) || signals.justAnswered) {
    if (signals.justAnswered) reasons.push("answered a question");
    else reasons.push(`on ${signals.stepKey} step`);
    return current === "try"
      ? { next: null, reasons: [] }
      : { next: "try", reasons };
  }

  if (READ_STEP_KEYS.has(signals.stepKey)) {
    return current === "learn"
      ? { next: null, reasons: [] }
      : { next: "learn", reasons: [`reading ${signals.stepKey}`] };
  }

  return { next: null, reasons: [] };
}

export interface PersistCycleInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  stage: CycleStage;
  previousStage: CycleStage | null;
  stepKey: string;
  wrongAttempts: number;
  isCorrect: boolean | null;
  reasons: string[];
}

export async function persistCycleStage(input: PersistCycleInput): Promise<void> {
  try {
    await (supabase as any).from("learning_cycle_stages").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      cycle_stage: input.stage,
      previous_stage: input.previousStage,
      step_key: input.stepKey ?? "",
      wrong_attempts: input.wrongAttempts,
      is_correct: input.isCorrect,
      reasons: input.reasons,
    });
  } catch {
    /* swallow — telemetry is best-effort */
  }
}

export async function loadLatestCycleStage(
  userId: string,
): Promise<CycleStage | null> {
  try {
    const { data } = await (supabase as any)
      .from("learning_cycle_stages")
      .select("cycle_stage")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.cycle_stage as CycleStage) ?? null;
  } catch {
    return null;
  }
}

export const CYCLE_COPY: Record<CycleStage, { label: string; hint: string }> = {
  learn:    { label: "Learn",    hint: "Reading and absorbing." },
  try:      { label: "Try",      hint: "Putting it into practice." },
  struggle: { label: "Struggle", hint: "Stuck — a slower path may help." },
  reset:    { label: "Reset",    hint: "Stepping back to recover." },
  reenter:  { label: "Re-enter", hint: "Coming back in — fresh attempt." },
  mastery:  { label: "Mastery",  hint: "You've got this one." },
};

// Broadcast helper so any surface (header, dashboard) can react instantly.
export const CYCLE_EVENT = "tj-learning-cycle-changed";

export function emitCycleChange(stage: CycleStage) {
  try {
    window.dispatchEvent(new CustomEvent(CYCLE_EVENT, { detail: { stage } }));
  } catch {
    /* SSR / test contexts */
  }
}
