// Recovery Mode — rule-based, no AI.
// Activates when learning_rhythm_state is "overwhelmed" or cycle_stage is "reset".
// While active:
//  - UI surface is reduced (fewer side actions, calmer copy)
//  - Quizzes are temporarily delayed
//  - Visual / Metaphor / Guided Lesson are prioritized as the entry layers
// Exits when the learner answers correctly.

import { supabase } from "@/integrations/supabase/client";

export type RecoveryTrigger =
  | "rhythm_overwhelmed"
  | "cycle_reset"
  | "manual";

export type RecoveryExitReason =
  | "correct_answer"
  | "manual";

export const RECOVERY_MESSAGE =
  "You are not behind. You are in a recovery phase. Let’s rebuild this step by step.";

// Layer keys (orb step keys) prioritized while in Recovery Mode.
export const RECOVERY_PRIORITY_LAYERS = ["visual", "metaphor", "information"] as const;

export interface RecoveryEntryInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  trigger: RecoveryTrigger;
  reasons?: string[];
}

export interface RecoveryExitInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  reason: RecoveryExitReason;
  reasons?: string[];
}

export async function logRecoveryEntry(input: RecoveryEntryInput): Promise<void> {
  try {
    await (supabase as any).from("recovery_mode_events").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      action: "entered",
      trigger_source: input.trigger,
      exit_reason: null,
      reasons: input.reasons ?? [],
    });
  } catch { /* best-effort telemetry */ }
}

export async function logRecoveryExit(input: RecoveryExitInput): Promise<void> {
  try {
    await (supabase as any).from("recovery_mode_events").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      action: "exited",
      trigger_source: null,
      exit_reason: input.reason,
      reasons: input.reasons ?? [],
    });
  } catch { /* best-effort telemetry */ }
}

// Cross-component event so any surface (orb, header, banners) can react.
export const RECOVERY_EVENT = "tj-recovery-mode-changed";

export interface RecoveryEventDetail {
  active: boolean;
  trigger?: RecoveryTrigger;
  exitReason?: RecoveryExitReason;
}

export function emitRecoveryChange(detail: RecoveryEventDetail) {
  try {
    window.dispatchEvent(new CustomEvent(RECOVERY_EVENT, { detail }));
  } catch { /* SSR / test contexts */ }
}
