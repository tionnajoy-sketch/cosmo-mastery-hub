import { supabase } from "@/integrations/supabase/client";
import type { ErrorType } from "@/lib/error-type";

export type SecondChanceBehavior =
  | "try_again"
  | "break_it_down"
  | "show_visual"
  | "show_metaphor"
  | "show_answer";

export type RecoveryPattern =
  | "self-corrected"
  | "support-seeking"
  | "answer-dependent"
  | null;

export interface SecondChanceOption {
  key: SecondChanceBehavior;
  label: string;
  /** Step key in the LearningOrbDialog flow to jump to. Null = stay & reveal. */
  jumpTo: "quiz" | "breakdown" | "visual" | "metaphor" | null;
  /** Recovery pattern this choice eventually maps to (try_again resolves later). */
  recoveryPattern: RecoveryPattern;
}

export const SECOND_CHANCE_OPTIONS: SecondChanceOption[] = [
  { key: "try_again",     label: "Try again",            jumpTo: "quiz",      recoveryPattern: null /* set on retry */ },
  { key: "break_it_down", label: "Break it down",        jumpTo: "breakdown", recoveryPattern: "support-seeking" },
  { key: "show_visual",   label: "Show me visually",     jumpTo: "visual",    recoveryPattern: "support-seeking" },
  { key: "show_metaphor", label: "Give me the metaphor", jumpTo: "metaphor",  recoveryPattern: "support-seeking" },
  { key: "show_answer",   label: "Show the answer",      jumpTo: null,        recoveryPattern: "answer-dependent" },
];

export interface RecordArgs {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  questionRef?: string;
  errorType?: ErrorType | null;
  behavior: SecondChanceBehavior;
  recoveryPattern: RecoveryPattern;
  retryCorrect?: boolean | null;
}

/** Insert a second-chance pick. Returns the inserted row id (or null). */
export async function recordSecondChancePick(args: RecordArgs): Promise<{ id: string | null }> {
  const { data, error } = await supabase
    .from("second_chance_picks")
    .insert({
      user_id: args.userId,
      term_id: args.termId ?? null,
      module_id: args.moduleId ?? null,
      block_number: args.blockNumber ?? null,
      question_ref: args.questionRef ?? "",
      error_type: args.errorType ?? null,
      second_chance_behavior: args.behavior,
      recovery_pattern: args.recoveryPattern,
      retry_correct: args.retryCorrect ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) return { id: null };
  return { id: data?.id ?? null };
}

/** When a "try_again" retry resolves, update the row with the outcome and pattern. */
export async function resolveTryAgainOutcome(rowId: string, retryCorrect: boolean) {
  const recovery: RecoveryPattern = retryCorrect ? "self-corrected" : "answer-dependent";
  await supabase
    .from("second_chance_picks")
    .update({ retry_correct: retryCorrect, recovery_pattern: recovery })
    .eq("id", rowId);
}
