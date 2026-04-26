/* Silent Micro-Decision Tracker
 *
 * Captures small, non-blocking learner behaviors across the term page,
 * persists raw events, and updates derived flags once thresholds are crossed.
 * Never punishes the learner — pure signal for the future DNA engine.
 */

import { supabase } from "@/integrations/supabase/client";

/** Derived behavior flags. One row per (user, term, flag) in micro_decision_flags. */
export type MicroFlag =
  | "clicked_show_answer_fast"
  | "skipped_reflection"
  | "skipped_identity_layer"
  | "skipped_memory_anchor"
  | "repeated_visual_selection"
  | "repeated_metaphor_selection"
  | "repeated_guided_lesson_selection"
  | "quiz_avoidance"
  | "fast_clicking_pattern"
  | "long_pause_pattern";

/** Raw event actions (richer than flags — many actions feed one flag). */
export type MicroAction =
  // reveal / shortcut
  | "show_answer_clicked"
  // skips
  | "reflection_skipped"
  | "identity_layer_skipped"
  | "memory_anchor_skipped"
  | "quiz_skipped"
  // entry-point picks (repeats roll up into flags)
  | "entry_visual_picked"
  | "entry_metaphor_picked"
  | "entry_guided_lesson_picked"
  // pacing
  | "fast_click"
  | "long_pause"
  // generic
  | "term_opened"
  | "step_advanced";

export interface RecordEventArgs {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  surface?: string;
  action: MicroAction;
  timeOnSurfaceMs?: number;
  metadata?: Record<string, unknown>;
}

/** Thresholds (kept in one place — easy for the engine to reuse). */
export const THRESHOLDS = {
  showAnswerFastMs: 10_000,        // < 10s after question render
  skipReflectionCount: 2,
  skipMemoryAnchorCount: 2,
  skipIdentityLayerCount: 2,
  repeatedEntryPickCount: 3,        // visual / metaphor / guided lesson
  quizAvoidanceCount: 2,
  fastClickWindowMs: 1_500,         // 3 clicks within this window
  fastClickCount: 3,
  longPauseMs: 90_000,              // 90s with no interaction on a step
} as const;

const ACTION_TO_FLAG: Partial<Record<MicroAction, { flag: MicroFlag; threshold: number }>> = {
  reflection_skipped:        { flag: "skipped_reflection",        threshold: THRESHOLDS.skipReflectionCount },
  identity_layer_skipped:    { flag: "skipped_identity_layer",    threshold: THRESHOLDS.skipIdentityLayerCount },
  memory_anchor_skipped:     { flag: "skipped_memory_anchor",     threshold: THRESHOLDS.skipMemoryAnchorCount },
  entry_visual_picked:       { flag: "repeated_visual_selection", threshold: THRESHOLDS.repeatedEntryPickCount },
  entry_metaphor_picked:     { flag: "repeated_metaphor_selection", threshold: THRESHOLDS.repeatedEntryPickCount },
  entry_guided_lesson_picked:{ flag: "repeated_guided_lesson_selection", threshold: THRESHOLDS.repeatedEntryPickCount },
  quiz_skipped:              { flag: "quiz_avoidance",            threshold: THRESHOLDS.quizAvoidanceCount },
};

/** Insert a raw event (fire-and-forget). */
export async function recordMicroEvent(args: RecordEventArgs): Promise<void> {
  try {
    await supabase.from("micro_decision_events").insert({
      user_id: args.userId,
      term_id: args.termId ?? null,
      module_id: args.moduleId ?? null,
      block_number: args.blockNumber ?? null,
      surface: args.surface ?? "",
      action: args.action,
      time_on_surface_ms: args.timeOnSurfaceMs ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (e) {
    // Soft-fail — silent tracking must never block the UI.
    console.warn("[micro-decisions] recordMicroEvent failed", e);
  }
}

/** Upsert a derived flag (per-user, per-term, per-flag). Increments occurrence_count. */
export async function setMicroFlag(args: {
  userId: string;
  termId?: string | null;
  flag: MicroFlag;
}): Promise<void> {
  try {
    // Try to read existing row.
    let q = supabase
      .from("micro_decision_flags")
      .select("id, occurrence_count")
      .eq("user_id", args.userId)
      .eq("flag", args.flag);
    q = args.termId ? q.eq("term_id", args.termId) : q.is("term_id", null);
    const { data: existing } = await q.maybeSingle();

    if (existing?.id) {
      await supabase
        .from("micro_decision_flags")
        .update({
          occurrence_count: (existing.occurrence_count ?? 0) + 1,
          triggered: true,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("micro_decision_flags").insert({
        user_id: args.userId,
        term_id: args.termId ?? null,
        flag: args.flag,
        triggered: true,
        occurrence_count: 1,
        last_triggered_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("[micro-decisions] setMicroFlag failed", e);
  }
}

/**
 * Record an event AND, if a threshold is crossed, write/refresh the derived flag.
 * Threshold detection counts recent matching events for this learner (not term-scoped
 * for repeat-entry / skip patterns — those are about the learner's overall behavior).
 */
export async function recordAndEvaluate(args: RecordEventArgs): Promise<MicroFlag | null> {
  await recordMicroEvent(args);

  const mapping = ACTION_TO_FLAG[args.action];
  if (!mapping) return null;

  // Count recent events of this action for this learner (last 50 days, capped 200).
  const { count } = await supabase
    .from("micro_decision_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", args.userId)
    .eq("action", args.action);

  const total = count ?? 0;
  if (total >= mapping.threshold) {
    await setMicroFlag({ userId: args.userId, termId: null, flag: mapping.flag });
    return mapping.flag;
  }
  return null;
}

/** Convenience — fired when learner reveals the answer; gated by elapsed time. */
export async function recordShowAnswer(args: {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  surface?: string;
  msSinceQuestionShown: number;
}): Promise<MicroFlag | null> {
  await recordMicroEvent({
    userId: args.userId,
    termId: args.termId,
    moduleId: args.moduleId,
    blockNumber: args.blockNumber,
    surface: args.surface ?? "quiz",
    action: "show_answer_clicked",
    timeOnSurfaceMs: args.msSinceQuestionShown,
    metadata: { ms: args.msSinceQuestionShown },
  });
  if (args.msSinceQuestionShown < THRESHOLDS.showAnswerFastMs) {
    await setMicroFlag({
      userId: args.userId,
      termId: args.termId ?? null,
      flag: "clicked_show_answer_fast",
    });
    return "clicked_show_answer_fast";
  }
  return null;
}

/** Read all flags for a learner — used by the future DNA engine. */
export async function loadMicroFlags(userId: string) {
  const { data, error } = await supabase
    .from("micro_decision_flags")
    .select("flag, term_id, occurrence_count, last_triggered_at")
    .eq("user_id", userId)
    .order("last_triggered_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}
