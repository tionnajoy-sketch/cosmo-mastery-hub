// Learning Rhythm System — rule-based, no AI.
// Regulates how fast or slow a learner is moving through content
// using existing behavior signals (cognitive load, confidence, wrong attempts,
// fast clicking, long pauses, café/reset events).

import { supabase } from "@/integrations/supabase/client";
import type { CognitiveLoad } from "@/lib/cognitive-load";

export type LearningRhythmState =
  | "flow"
  | "steady"
  | "strained"
  | "overwhelmed"
  | "recovering";

export interface LearningRhythmSignals {
  cognitiveLoad: CognitiveLoad;
  /** 1-5 confidence rating from the learner. Use null if unknown. */
  confidence: number | null;
  wrongAttempts: number;
  fastClickingPattern: boolean;
  longPausePattern: boolean;
  /** True if the learner just finished/dismissed a TJ Café break or a reset. */
  cameFromReset: boolean;
}

export interface LearningRhythmReading {
  state: LearningRhythmState;
  reasons: string[];
}

/**
 * Order of evaluation matters — apply the highest-priority rule first.
 *  1. recovering   (came from café/reset)
 *  2. overwhelmed  (3+ wrongs OR fast clicking OR long pause)
 *  3. strained     (2 wrongs OR high hesitation)
 *  4. steady       (cognitive load moderate)
 *  5. flow         (cognitive load low + confidence 3-5)
 *  6. fallback     (steady — calm baseline)
 */
export function computeLearningRhythm(
  signals: LearningRhythmSignals,
): LearningRhythmReading {
  const reasons: string[] = [];

  if (signals.cameFromReset) {
    return { state: "recovering", reasons: ["just finished a reset / café"] };
  }

  if (
    signals.wrongAttempts >= 3 ||
    signals.fastClickingPattern ||
    signals.longPausePattern
  ) {
    if (signals.wrongAttempts >= 3) reasons.push("3+ wrong attempts");
    if (signals.fastClickingPattern) reasons.push("fast clicking");
    if (signals.longPausePattern) reasons.push("long pause");
    return { state: "overwhelmed", reasons };
  }

  if (signals.wrongAttempts === 2) {
    return { state: "strained", reasons: ["2 wrong attempts"] };
  }

  if (signals.cognitiveLoad === "moderate") {
    return { state: "steady", reasons: ["moderate cognitive load"] };
  }

  if (
    signals.cognitiveLoad === "low" &&
    signals.confidence !== null &&
    signals.confidence >= 3 &&
    signals.confidence <= 5
  ) {
    return { state: "flow", reasons: ["low load · confidence 3-5"] };
  }

  return { state: "steady", reasons: ["calm baseline"] };
}

export interface PersistRhythmInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  reading: LearningRhythmReading;
  signals: LearningRhythmSignals;
}

export async function persistLearningRhythm(input: PersistRhythmInput) {
  try {
    await (supabase as any).from("learning_rhythm_states").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      learning_rhythm_state: input.reading.state,
      cognitive_load: input.signals.cognitiveLoad,
      confidence: input.signals.confidence,
      wrong_attempts: input.signals.wrongAttempts,
      fast_clicking_pattern: input.signals.fastClickingPattern,
      long_pause_pattern: input.signals.longPausePattern,
      reasons: input.reading.reasons,
    });
  } catch {
    /* swallow — telemetry is best-effort */
  }
}

export async function loadLatestRhythm(
  userId: string,
): Promise<LearningRhythmState | null> {
  try {
    const { data } = await (supabase as any)
      .from("learning_rhythm_states")
      .select("learning_rhythm_state")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.learning_rhythm_state as LearningRhythmState) ?? null;
  } catch {
    return null;
  }
}

// ---- Subtle UI palette (paired with semantic tokens) ----
export const RHYTHM_COPY: Record<LearningRhythmState, { label: string; hint: string }> = {
  flow:        { label: "Flow",        hint: "You're moving smoothly." },
  steady:      { label: "Steady",      hint: "Holding a calm pace." },
  strained:    { label: "Strained",    hint: "Slow down — this one needs care." },
  overwhelmed: { label: "Overwhelmed", hint: "A short reset may help." },
  recovering:  { label: "Recovering",  hint: "Coming back from a reset." },
};

// Broadcast helper so any surface (header, dashboard) can react instantly.
export const RHYTHM_EVENT = "tj-learning-rhythm-changed";

export function emitRhythmChange(state: LearningRhythmState) {
  try {
    window.dispatchEvent(new CustomEvent(RHYTHM_EVENT, { detail: { state } }));
  } catch {
    /* SSR / test contexts */
  }
}
