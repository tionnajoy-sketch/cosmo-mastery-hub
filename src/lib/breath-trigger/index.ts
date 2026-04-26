// Breath Trigger System — rule-based, no AI.
// Watches behavior signals already captured elsewhere and decides whether
// the learner needs a calm pause-or-redirect prompt.

import { supabase } from "@/integrations/supabase/client";
import type { CognitiveLoad } from "@/lib/cognitive-load";
import type { LearningRhythmState } from "@/lib/learning-rhythm";

export type BreathResponseChoice =
  | "continue"          // Continue anyway
  | "slow_down"         // Slow it down
  | "different_way"     // Show me a different way
  | "tj_cafe"           // Take me to TJ Café
  | "simpler_version"   // Try a simpler version
  | "dismissed";        // closed without choosing

export interface BreathSignals {
  rhythmState: LearningRhythmState | null;
  cognitiveLoad: CognitiveLoad | null;
  wrongAttempts: number;
  confidenceRating: number | null; // 1-5, null if not provided yet
  fastClickingPattern: boolean;
  longPausePattern: boolean;
  repeatedSkipping: boolean;       // 3+ skips this term
}

export interface BreathDecision {
  shouldTrigger: boolean;
  reasons: string[];
}

/**
 * Each rule is OR-combined. Any single fire triggers the breath prompt.
 * Reasons are collected so we can save them with the response.
 */
export function evaluateBreath(signals: BreathSignals): BreathDecision {
  const reasons: string[] = [];

  if (signals.rhythmState === "strained")    reasons.push("rhythm: strained");
  if (signals.rhythmState === "overwhelmed") reasons.push("rhythm: overwhelmed");
  if (signals.cognitiveLoad === "high")      reasons.push("cognitive load: high");
  if (signals.wrongAttempts >= 3)            reasons.push("3+ wrong attempts");
  if (signals.confidenceRating !== null && signals.confidenceRating >= 1 && signals.confidenceRating <= 2) {
    reasons.push(`low confidence (${signals.confidenceRating})`);
  }
  if (signals.repeatedSkipping)              reasons.push("repeated skipping");
  if (signals.fastClickingPattern)           reasons.push("fast clicking");
  if (signals.longPausePattern)              reasons.push("long pause");

  return { shouldTrigger: reasons.length > 0, reasons };
}

export interface PersistBreathInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  choice: BreathResponseChoice;
  reasons: string[];
  signals: BreathSignals;
}

export async function persistBreathEvent(input: PersistBreathInput) {
  try {
    await (supabase as any).from("breath_trigger_events").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      breath_response_choice: input.choice,
      trigger_reasons: input.reasons,
      learning_rhythm_state: input.signals.rhythmState,
      cognitive_load: input.signals.cognitiveLoad,
      confidence_rating: input.signals.confidenceRating,
      wrong_attempts: input.signals.wrongAttempts,
      fast_clicking_pattern: input.signals.fastClickingPattern,
      long_pause_pattern: input.signals.longPausePattern,
      repeated_skipping: input.signals.repeatedSkipping,
    });
  } catch {
    /* swallow — telemetry is best-effort */
  }
}

export const BREATH_MESSAGE =
  "Pause. Your brain may need a different pace right now.";

export const BREATH_OPTIONS: Array<{
  choice: Exclude<BreathResponseChoice, "dismissed">;
  label: string;
  description: string;
}> = [
  { choice: "continue",        label: "Continue anyway",       description: "Keep going where you are." },
  { choice: "slow_down",       label: "Slow it down",          description: "Stay here, take it slower." },
  { choice: "different_way",   label: "Show me a different way", description: "Switch to a visual or metaphor." },
  { choice: "tj_cafe",         label: "Take me to TJ Café",    description: "Step away for a short reset." },
  { choice: "simpler_version", label: "Try a simpler version", description: "Drop the difficulty for now." },
];
