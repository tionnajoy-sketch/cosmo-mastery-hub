// Learning Cycle Loop — rule-based, no AI.
// Replaces a strict linear progression with a cycle:
//   Learn → Try → Struggle → Reset → Re-enter → Mastery

import { supabase } from "@/integrations/supabase/client";

export type CycleStage =
  | "learn"
  | "try"
  | "struggle"
  | "reset"
  | "reenter"
  | "mastery";

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

const TRY_STEP_KEYS = new Set<string>(["quiz", "application"]);

export interface CycleSignals {
  stepKey: string;
  wrongAttempts: number;
  isCorrect: boolean | null;
  cameFromReset: boolean;
  justAnswered: boolean;
  masteryReached: boolean;
}

export interface CycleDecision {
  next: CycleStage | null;
  reasons: string[];
}

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
  } catch { /* best-effort telemetry */ }
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

export const CYCLE_EVENT = "tj-learning-cycle-changed";

export function emitCycleChange(stage: CycleStage) {
  try {
    window.dispatchEvent(new CustomEvent(CYCLE_EVENT, { detail: { stage } }));
  } catch { /* SSR / test contexts */ }
}
