import { supabase } from "@/integrations/supabase/client";

export type ErrorType =
  | "misread"
  | "confused_terms"
  | "didnt_understand"
  | "overthought"
  | "rushed"
  | "guessed"
  | "not_sure";

export type ErrorRoute =
  | "reading_strategy"
  | "comparison_card"
  | "breakdown"
  | "simple_explanation"
  | "slow_down_retry"
  | "memory_anchor"
  | "choice_offered";

export interface ErrorOption {
  key: ErrorType;
  label: string;
  route: ErrorRoute;
  routeLabel: string;
}

export const ERROR_OPTIONS: ErrorOption[] = [
  { key: "misread",          label: "I misread the question",          route: "reading_strategy",   routeLabel: "Question-Reading Strategy" },
  { key: "confused_terms",   label: "I confused two terms",            route: "comparison_card",    routeLabel: "Comparison Card" },
  { key: "didnt_understand", label: "I did not understand the concept", route: "breakdown",          routeLabel: "Breakdown Layer" },
  { key: "overthought",      label: "I overthought it",                route: "simple_explanation", routeLabel: "Simple Explanation" },
  { key: "rushed",           label: "I rushed",                        route: "slow_down_retry",    routeLabel: "Slow Down & Retry" },
  { key: "guessed",          label: "I guessed",                       route: "memory_anchor",      routeLabel: "Memory Anchor" },
  { key: "not_sure",         label: "I am not sure",                   route: "choice_offered",     routeLabel: "Pick a path: Visual, Metaphor, or Guided Lesson" },
];

export const ERROR_LABELS: Record<ErrorType, string> = ERROR_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.key]: o.label }),
  {} as Record<ErrorType, string>
);

export interface ErrorPattern {
  dominantType: ErrorType | null;
  totals: Partial<Record<ErrorType, number>>;
  recentRepeats: number; // how many of the last 5 picks match the dominant type
  totalPicks: number;
}

export async function fetchErrorPattern(userId: string): Promise<ErrorPattern> {
  const { data, error } = await supabase
    .from("error_type_picks")
    .select("error_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { dominantType: null, totals: {}, recentRepeats: 0, totalPicks: 0 };
  }

  const totals: Partial<Record<ErrorType, number>> = {};
  for (const row of data) {
    const k = row.error_type as ErrorType;
    totals[k] = (totals[k] ?? 0) + 1;
  }

  let dominantType: ErrorType | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(totals)) {
    if ((v ?? 0) > max) {
      max = v ?? 0;
      dominantType = k as ErrorType;
    }
  }

  const recent5 = data.slice(0, 5).map((r) => r.error_type as ErrorType);
  const recentRepeats = dominantType
    ? recent5.filter((t) => t === dominantType).length
    : 0;

  return { dominantType, totals, recentRepeats, totalPicks: data.length };
}

export async function recordErrorPick(args: {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  questionRef?: string;
  errorType: ErrorType;
  routedTo: ErrorRoute;
}) {
  const { error } = await supabase.from("error_type_picks").insert({
    user_id: args.userId,
    term_id: args.termId ?? null,
    module_id: args.moduleId ?? null,
    block_number: args.blockNumber ?? null,
    question_ref: args.questionRef ?? "",
    error_type: args.errorType,
    routed_to: args.routedTo,
  });
  return { saved: !error };
}
