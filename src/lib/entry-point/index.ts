import { supabase } from "@/integrations/supabase/client";

export type ThinkingPath =
  | "visual"
  | "real_life"
  | "breakdown"
  | "try_first"
  | "metaphor"
  | "reflect_first";

export interface EntryOption {
  key: ThinkingPath;
  label: string;
  description: string;
  /** Step `key` in the LearningOrbDialog STEPS array. */
  routeTo: string;
}

export const ENTRY_OPTIONS: EntryOption[] = [
  { key: "visual",        label: "Show me visually",        description: "Start with the picture",      routeTo: "visual" },
  { key: "real_life",     label: "Give me a real-life example", description: "A scenario you'd see at work", routeTo: "information" },
  { key: "breakdown",     label: "Break it down simply",    description: "Word parts and meaning",       routeTo: "breakdown" },
  { key: "try_first",     label: "Let me try first",        description: "Jump into a practice question", routeTo: "quiz" },
  { key: "metaphor",      label: "Give me the metaphor",    description: "An analogy that makes it stick", routeTo: "metaphor" },
  { key: "reflect_first", label: "Let me reflect first",    description: "Think before you study",       routeTo: "reflection" },
];

export const PATH_LABELS: Record<ThinkingPath, string> = ENTRY_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.key]: o.label }),
  {} as Record<ThinkingPath, string>
);

export interface DominantEntry {
  dominantPath: ThinkingPath | null;
  totals: Partial<Record<ThinkingPath, number>>;
  totalChoices: number;
}

export async function fetchDominantEntryPoint(userId: string): Promise<DominantEntry> {
  const { data, error } = await supabase
    .from("term_entry_choices")
    .select("preferred_thinking_path")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return { dominantPath: null, totals: {}, totalChoices: 0 };
  }

  const totals: Partial<Record<ThinkingPath, number>> = {};
  for (const row of data) {
    const k = row.preferred_thinking_path as ThinkingPath;
    totals[k] = (totals[k] ?? 0) + 1;
  }

  let dominantPath: ThinkingPath | null = null;
  let max = 0;
  for (const [k, v] of Object.entries(totals)) {
    if ((v ?? 0) > max) {
      max = v ?? 0;
      dominantPath = k as ThinkingPath;
    }
  }

  return { dominantPath, totals, totalChoices: data.length };
}

export async function recordEntryChoice(args: {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  path: ThinkingPath;
  routedTo: string;
}) {
  const { error } = await supabase.from("term_entry_choices").insert({
    user_id: args.userId,
    term_id: args.termId ?? null,
    module_id: args.moduleId ?? null,
    preferred_thinking_path: args.path,
    routed_to_step: args.routedTo,
  });
  return { saved: !error };
}
