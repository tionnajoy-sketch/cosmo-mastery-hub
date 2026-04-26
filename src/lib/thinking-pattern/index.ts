/* Thinking Pattern Tracker — Rule-based, no AI.
 *
 * Records each ThinkingPath selection (Picture/Words/Logic/Story/Doing) with
 * whether it led to a correct answer, and maintains a per-user aggregate
 * profile: most_used, most_successful, least_effective.
 *
 * Downstream: read getThinkingProfile() to suggest layers / paths.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ThinkingPath } from "@/lib/behavior-intake";

export type { ThinkingPath };

export const THINKING_PATHS: ThinkingPath[] = [
  "visual",
  "verbal",
  "logical",
  "story",
  "kinesthetic",
];

export const THINKING_LABELS: Record<ThinkingPath, string> = {
  visual: "Picture",
  verbal: "Words",
  logical: "Logic",
  story: "Story",
  kinesthetic: "Doing",
};

export interface ThinkingProfile {
  totalSelections: number;
  counts: Partial<Record<ThinkingPath, number>>;
  correctCounts: Partial<Record<ThinkingPath, number>>;
  mostUsed: ThinkingPath | null;
  mostSuccessful: ThinkingPath | null;
  leastEffective: ThinkingPath | null;
}

const EMPTY_PROFILE: ThinkingProfile = {
  totalSelections: 0,
  counts: {},
  correctCounts: {},
  mostUsed: null,
  mostSuccessful: null,
  leastEffective: null,
};

interface RecordArgs {
  userId: string;
  thinkingPath: ThinkingPath;
  isCorrect: boolean | null;
  termId?: string | null;
  moduleId?: string | null;
  attemptNumber?: number;
  surface?: string;
}

/** Append a single thinking-path selection event. */
export async function recordThinkingSelection(args: RecordArgs): Promise<void> {
  const { error } = await supabase.from("thinking_pattern_events" as never).insert({
    user_id: args.userId,
    term_id: args.termId ?? null,
    module_id: args.moduleId ?? null,
    thinking_path: args.thinkingPath,
    is_correct: args.isCorrect,
    attempt_number: args.attemptNumber ?? 1,
    surface: args.surface ?? "",
  } as never);
  if (error) {
    console.warn("[thinking-pattern] recordThinkingSelection failed", error);
    return;
  }
  // Fire-and-forget profile recompute.
  void recomputeProfile(args.userId);
}

function pickBy(
  paths: ThinkingPath[],
  scoreOf: (p: ThinkingPath) => number,
  preferHigh = true,
): ThinkingPath | null {
  let best: ThinkingPath | null = null;
  let bestScore = preferHigh ? -Infinity : Infinity;
  for (const p of paths) {
    const s = scoreOf(p);
    if (!Number.isFinite(s)) continue;
    if (preferHigh ? s > bestScore : s < bestScore) {
      best = p;
      bestScore = s;
    }
  }
  return best;
}

/** Recompute and persist the aggregate profile from event rows. */
export async function recomputeProfile(userId: string): Promise<ThinkingProfile> {
  const { data, error } = await supabase
    .from("thinking_pattern_events" as never)
    .select("thinking_path,is_correct")
    .eq("user_id", userId)
    .limit(2000);

  if (error) {
    console.warn("[thinking-pattern] recomputeProfile read failed", error);
    return EMPTY_PROFILE;
  }
  const rows = (data ?? []) as Array<{ thinking_path: ThinkingPath; is_correct: boolean | null }>;

  const counts: Partial<Record<ThinkingPath, number>> = {};
  const correctCounts: Partial<Record<ThinkingPath, number>> = {};
  for (const r of rows) {
    counts[r.thinking_path] = (counts[r.thinking_path] ?? 0) + 1;
    if (r.is_correct === true) {
      correctCounts[r.thinking_path] = (correctCounts[r.thinking_path] ?? 0) + 1;
    }
  }

  const usedPaths = THINKING_PATHS.filter((p) => (counts[p] ?? 0) > 0);
  const mostUsed = pickBy(usedPaths, (p) => counts[p] ?? 0, true);

  // Success rate: require ≥3 samples to qualify; otherwise fall back to raw rate.
  const MIN_SAMPLE = 3;
  const qualifying = usedPaths.filter((p) => (counts[p] ?? 0) >= MIN_SAMPLE);
  const successPool = qualifying.length > 0 ? qualifying : usedPaths;
  const rate = (p: ThinkingPath) => (correctCounts[p] ?? 0) / (counts[p] || 1);

  const mostSuccessful = pickBy(successPool, rate, true);
  const leastEffective =
    successPool.length >= 2 ? pickBy(successPool, rate, false) : null;

  const profile: ThinkingProfile = {
    totalSelections: rows.length,
    counts,
    correctCounts,
    mostUsed,
    mostSuccessful,
    leastEffective,
  };

  const { error: upsertErr } = await (supabase.from("thinking_pattern_profile" as never) as any)
    .upsert(
      {
        user_id: userId,
        total_selections: profile.totalSelections,
        counts: profile.counts as never,
        correct_counts: profile.correctCounts as never,
        most_used: profile.mostUsed,
        most_successful: profile.mostSuccessful,
        least_effective: profile.leastEffective,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (upsertErr) {
    console.warn("[thinking-pattern] profile upsert failed", upsertErr);
  }
  return profile;
}

/** Read the cached profile row. Recomputes if missing. */
export async function getThinkingProfile(userId: string): Promise<ThinkingProfile> {
  const { data, error } = await supabase
    .from("thinking_pattern_profile" as never)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[thinking-pattern] getThinkingProfile failed", error);
    return EMPTY_PROFILE;
  }
  if (!data) return recomputeProfile(userId);
  const row = data as any;
  return {
    totalSelections: row.total_selections ?? 0,
    counts: (row.counts ?? {}) as Partial<Record<ThinkingPath, number>>,
    correctCounts: (row.correct_counts ?? {}) as Partial<Record<ThinkingPath, number>>,
    mostUsed: row.most_used ?? null,
    mostSuccessful: row.most_successful ?? null,
    leastEffective: row.least_effective ?? null,
  };
}

/** Rule-based recommendation derived from the profile. */
export interface ThinkingRecommendation {
  preferredPath: ThinkingPath | null;
  avoidPath: ThinkingPath | null;
  suggestLayer: "visual" | "metaphor" | "breakdown" | "story" | "practice" | null;
  message: string;
}

const PATH_TO_LAYER: Record<ThinkingPath, ThinkingRecommendation["suggestLayer"]> = {
  visual: "visual",
  verbal: "breakdown",
  logical: "breakdown",
  story: "metaphor",
  kinesthetic: "practice",
};

export function recommendFromProfile(profile: ThinkingProfile): ThinkingRecommendation {
  const preferred = profile.mostSuccessful ?? profile.mostUsed;
  const avoid = profile.leastEffective;
  const suggestLayer = preferred ? PATH_TO_LAYER[preferred] : null;

  let message = "Keep exploring how you think — we’ll learn alongside you.";
  if (preferred) {
    message = `You learn best with ${THINKING_LABELS[preferred]}. We’ll lead with that.`;
    if (avoid && avoid !== preferred) {
      message += ` ${THINKING_LABELS[avoid]} has been trickier — we’ll use it less.`;
    }
  }
  return { preferredPath: preferred, avoidPath: avoid, suggestLayer, message };
}
