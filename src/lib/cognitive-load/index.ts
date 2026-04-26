// Rule-based Cognitive Load Indicator.
// Computes a low / moderate / high level from simple signals already
// captured elsewhere (term_struggle, micro_decision_flags, in-memory timers).

import { supabase } from "@/integrations/supabase/client";

export type CognitiveLoad = "low" | "moderate" | "high";

export interface CognitiveLoadSignals {
  /** ms spent in the current term dialog */
  timeOnTermMs: number;
  /** ms spent on the current quiz question (if any) */
  timeOnQuestionMs: number;
  /** total wrong attempts on this term */
  wrongAttempts: number;
  /** micro-decision flag — many fast clicks in a row */
  fastClickingPattern: boolean;
  /** micro-decision flag — long unexplained pause */
  longPausePattern: boolean;
  /** number of layers / sections the learner skipped */
  skippedSections: number;
}

export interface CognitiveLoadReading {
  level: CognitiveLoad;
  reasons: string[];
}

// Heuristic thresholds — intentionally simple and tunable.
const LONG_PAUSE_MS = 45_000;
const VERY_LONG_PAUSE_MS = 90_000;

export function computeCognitiveLoad(signals: CognitiveLoadSignals): CognitiveLoadReading {
  const reasons: string[] = [];

  const longPause =
    signals.longPausePattern ||
    signals.timeOnQuestionMs >= LONG_PAUSE_MS ||
    signals.timeOnTermMs >= VERY_LONG_PAUSE_MS;

  // ---- HIGH ----
  if (signals.wrongAttempts >= 3) reasons.push("3+ wrong attempts");
  if (signals.fastClickingPattern) reasons.push("fast clicking");
  if (signals.skippedSections >= 3) reasons.push("repeated skipping");
  if (
    (signals.timeOnQuestionMs >= VERY_LONG_PAUSE_MS) ||
    (longPause && signals.wrongAttempts >= 2)
  ) {
    reasons.push("long hesitation");
  }

  if (
    signals.wrongAttempts >= 3 ||
    signals.fastClickingPattern ||
    signals.skippedSections >= 3 ||
    signals.timeOnQuestionMs >= VERY_LONG_PAUSE_MS
  ) {
    return { level: "high", reasons };
  }

  // ---- MODERATE ----
  const moderateReasons: string[] = [];
  if (signals.wrongAttempts >= 1 && signals.wrongAttempts <= 2) {
    moderateReasons.push(`${signals.wrongAttempts} wrong attempt${signals.wrongAttempts > 1 ? "s" : ""}`);
  }
  if (longPause) moderateReasons.push("long pause");
  if (signals.skippedSections >= 1) moderateReasons.push("skipped a section");

  if (moderateReasons.length > 0) {
    return { level: "moderate", reasons: moderateReasons };
  }

  // ---- LOW ----
  return { level: "low", reasons: ["normal pace"] };
}

export const COGNITIVE_LOAD_PROMPT: Record<Exclude<CognitiveLoad, "low">, string> = {
  moderate: "This concept may need another layer. Choose how you want support.",
  high: "This may be a good moment to reset before continuing.",
};

export type CognitiveLoadAction =
  | "continue"
  | "show_visual"
  | "show_metaphor"
  | "tj_cafe"
  | "simpler_question";

export const COGNITIVE_LOAD_ACTIONS: { id: CognitiveLoadAction; label: string }[] = [
  { id: "continue", label: "Continue" },
  { id: "show_visual", label: "Show me visually" },
  { id: "show_metaphor", label: "Give me the metaphor" },
  { id: "tj_cafe", label: "Take me to TJ Café" },
  { id: "simpler_question", label: "Try a simpler question" },
];

export interface PersistArgs {
  userId: string;
  termId: string | null;
  moduleId: string | null;
  sessionId: string;
  reading: CognitiveLoadReading;
  signals: CognitiveLoadSignals;
  promptAction?: CognitiveLoadAction | null;
}

export async function persistCognitiveLoad(args: PersistArgs): Promise<void> {
  const { userId, termId, moduleId, sessionId, reading, signals, promptAction } = args;
  try {
    await (supabase as any).from("cognitive_load_snapshots").insert({
      user_id: userId,
      term_id: termId,
      module_id: moduleId,
      session_id: sessionId,
      cognitive_load: reading.level,
      time_on_term_ms: Math.round(signals.timeOnTermMs),
      time_on_question_ms: Math.round(signals.timeOnQuestionMs),
      wrong_attempts: signals.wrongAttempts,
      fast_clicking_pattern: signals.fastClickingPattern,
      long_pause_pattern: signals.longPausePattern,
      skipped_sections: signals.skippedSections,
      reasons: reading.reasons,
      prompt_action: promptAction ?? null,
    });
  } catch (err) {
    console.error("[cognitive-load] persist failed", err);
  }
}

/** Generate a per-tab session id used to scope readings. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "tj.cognitiveLoad.sessionId";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}
