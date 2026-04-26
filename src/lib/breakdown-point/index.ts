import { supabase } from "@/integrations/supabase/client";

export type BreakdownPoint =
  | "definition"
  | "guided_explanation"
  | "visual"
  | "metaphor"
  | "question_wording"
  | "answer_choices"
  | "unknown";

export const BREAKDOWN_LABEL: Record<BreakdownPoint, string> = {
  definition: "The definition",
  guided_explanation: "The guided explanation",
  visual: "The visual",
  metaphor: "The metaphor",
  question_wording: "The question wording",
  answer_choices: "The answer choices",
  unknown: "I do not know yet",
};

export const BREAKDOWN_OPTIONS: BreakdownPoint[] = [
  "definition",
  "guided_explanation",
  "visual",
  "metaphor",
  "question_wording",
  "answer_choices",
  "unknown",
];

/** What route action a breakdown point triggers (consumed by the host UI). */
export type BreakdownRouteAction =
  | { kind: "step"; stepKey: string }                    // navigate to a flow step
  | { kind: "question_strategy" }                        // show question-reading strategy card
  | { kind: "comparison_card" }                          // show comparison card
  | { kind: "guided_reset" };                            // offer guided reset

export function resolveBreakdownRoute(point: BreakdownPoint): BreakdownRouteAction {
  switch (point) {
    case "definition":
      return { kind: "step", stepKey: "definition" };
    case "guided_explanation":
      return { kind: "step", stepKey: "information" };
    case "visual":
      return { kind: "step", stepKey: "visual" };
    case "metaphor":
      return { kind: "step", stepKey: "metaphor" };
    case "question_wording":
      return { kind: "question_strategy" };
    case "answer_choices":
      return { kind: "comparison_card" };
    case "unknown":
    default:
      return { kind: "guided_reset" };
  }
}

/** Trigger threshold: prompt fires once incorrect attempts on a term reach this number. */
export const REPEATED_STRUGGLE_THRESHOLD = 2;

interface RecordArgs {
  userId: string;
  termId: string | null;
  moduleId?: string | null;
  point: BreakdownPoint;
  incorrectAttempts: number;
  routedTo: string;
}

export async function recordBreakdownPoint({
  userId,
  termId,
  moduleId,
  point,
  incorrectAttempts,
  routedTo,
}: RecordArgs): Promise<void> {
  await supabase.from("breakdown_point_picks").insert({
    user_id: userId,
    term_id: termId,
    module_id: moduleId ?? null,
    breakdown_point: point,
    incorrect_attempts_at_pick: incorrectAttempts,
    routed_to: routedTo,
  });
}

export interface BreakdownPattern {
  /** Breakdown point picked the most across recent terms. */
  dominant: BreakdownPoint | null;
  /** How many times the dominant pick has occurred. */
  count: number;
  /** Total picks examined. */
  total: number;
}

/**
 * Loads the recent breakdown_point picks for a user (across all terms) and
 * returns the dominant point if any pick occurred 2+ times.
 */
export async function loadBreakdownPattern(
  userId: string,
  limit = 20
): Promise<BreakdownPattern> {
  const { data } = await supabase
    .from("breakdown_point_picks")
    .select("breakdown_point")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const tally = new Map<BreakdownPoint, number>();
  (data ?? []).forEach((row: { breakdown_point: string }) => {
    const p = row.breakdown_point as BreakdownPoint;
    tally.set(p, (tally.get(p) ?? 0) + 1);
  });

  let dominant: BreakdownPoint | null = null;
  let count = 0;
  tally.forEach((c, p) => {
    if (c > count) { dominant = p; count = c; }
  });

  return {
    dominant: count >= 2 ? dominant : null,
    count,
    total: data?.length ?? 0,
  };
}
