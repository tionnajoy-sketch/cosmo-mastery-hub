/* Learner Behavior Intake — Persistence layer.
 *
 * Single read/write API for `learner_behavior_signals`. The future
 * backend learning engine consumes `loadRecentSignals` + `loadProfileAggregate`.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  BehaviorAggregate,
  IntakeSnapshot,
  ThinkingPath,
} from "./types";

export async function saveSignal(snap: IntakeSnapshot): Promise<void> {
  const { error } = await supabase
    .from("learner_behavior_signals")
    .insert(snap as never);
  if (error) {
    // Soft-fail — never block the learning flow on intake persistence.
    console.warn("[behavior-intake] saveSignal failed", error);
  }
}

export async function loadRecentSignals(
  userId: string,
  termId: string | null,
  limit = 20,
) {
  let q = supabase
    .from("learner_behavior_signals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (termId) q = q.eq("term_id", termId);
  const { data, error } = await q;
  if (error) {
    console.warn("[behavior-intake] loadRecentSignals failed", error);
    return [];
  }
  return data ?? [];
}

export async function loadProfileAggregate(userId: string): Promise<BehaviorAggregate> {
  const rows = await loadRecentSignals(userId, null, 100);
  if (rows.length === 0) {
    return {
      avgConfidence: 0,
      dominantThinkingPath: null,
      dominantBreakdown: null,
      prefersTeachMode: true,
      sampleSize: 0,
    };
  }

  const confidences = rows
    .map((r: any) => r.confidence_rating)
    .filter((v: any): v is number => typeof v === "number");
  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  const tally = <T extends string>(key: string): T | null => {
    const counts = new Map<string, number>();
    for (const r of rows as any[]) {
      const v = r[key];
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestN = 0;
    for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
    return best as T | null;
  };

  const teachCount = (rows as any[]).filter((r) => r.mode === "teach").length;

  return {
    avgConfidence,
    dominantThinkingPath: tally<ThinkingPath>("thinking_path"),
    dominantBreakdown: tally<string>("breakdown_point"),
    prefersTeachMode: teachCount >= rows.length / 2,
    sampleSize: rows.length,
  };
}

/** Read-only adapter the future DNA recalibrator can consume. */
export async function getBehaviorAggregateForDNA(userId: string) {
  return loadProfileAggregate(userId);
}
