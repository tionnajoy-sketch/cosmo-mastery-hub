// Session Balance Tracker — rule-based, no AI.
// Aggregates the learner's time across four buckets:
//   - learning  (term/lesson reading + applied study)
//   - support   (visual / metaphor / breakdown / guided lesson / explain-it-back)
//   - quiz      (assessment & state-board questions)
//   - cafe      (TJ Café reset)
// When learning time crosses 45–60 min, the provider raises a prompt with
// 3 actions. Two ignores in a row auto-suggest TJ Café.

import { supabase } from "@/integrations/supabase/client";

export type ActiveSurface =
  | "learning"
  | "support"
  | "quiz"
  | "cafe"
  | "idle";

export interface TimeBuckets {
  learning_ms: number;
  support_ms: number;
  quiz_ms: number;
  cafe_ms: number;
}

export const EMPTY_BUCKETS: TimeBuckets = {
  learning_ms: 0,
  support_ms: 0,
  quiz_ms: 0,
  cafe_ms: 0,
};

// 45 min — first soft prompt. 60 min — re-prompt threshold ceiling.
export const SESSION_BALANCE_THRESHOLD_MS = 45 * 60 * 1000;
export const SESSION_BALANCE_REPROMPT_MS  = 15 * 60 * 1000;

export type SessionBalanceChoice =
  | "continue"
  | "take_reset"
  | "switch_style"
  | "ignored"
  | "auto_cafe";

export type SessionBalanceFlag =
  | "over_threshold"
  | "ignored_once"
  | "ignored_twice"
  | "auto_cafe_suggested"
  | "chose_continue"
  | "chose_reset"
  | "chose_switch_style";

export interface PersistBalanceInput {
  userId: string;
  sessionId: string;
  eventType: string;
  flag: SessionBalanceFlag | "";
  buckets: TimeBuckets;
  ignoreCount: number;
  reasons?: string[];
}

export async function persistSessionBalance(input: PersistBalanceInput): Promise<void> {
  try {
    const total =
      input.buckets.learning_ms +
      input.buckets.support_ms +
      input.buckets.quiz_ms +
      input.buckets.cafe_ms;
    await (supabase as any).from("session_balance_events").insert({
      user_id: input.userId,
      session_id: input.sessionId,
      event_type: input.eventType,
      session_balance_flag: input.flag,
      learning_ms: input.buckets.learning_ms,
      support_ms: input.buckets.support_ms,
      quiz_ms: input.buckets.quiz_ms,
      cafe_ms: input.buckets.cafe_ms,
      total_active_ms: total,
      ignore_count: input.ignoreCount,
      reasons: input.reasons ?? [],
    });
  } catch {
    /* best-effort telemetry */
  }
}

export function formatBucketMinutes(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1 min";
  if (m === 1) return "1 min";
  return `${m} min`;
}

// Map an orb step key → balance bucket. Quiz is its own bucket; "support"
// captures the layers learners use when struggling/learning visually.
const SUPPORT_KEYS = new Set([
  "visual",
  "metaphor",
  "breakdown",
  "information",
  "explain_it_back",
  "recognize",
]);

export function bucketForStepKey(key: string | null | undefined): ActiveSurface {
  if (!key) return "learning";
  if (key === "quiz") return "quiz";
  if (SUPPORT_KEYS.has(key)) return "support";
  return "learning";
}
