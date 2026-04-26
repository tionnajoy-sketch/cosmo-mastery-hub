// Guided Pace Adjustment — rule-based, no AI.
// Routes the learner after a Breath prompt choice and persists every
// pace decision so DNA Code, Struggle Detection and Dashboard Intelligence
// can all read the same trail later.

import { supabase } from "@/integrations/supabase/client";

export type BreathChoice =
  | "continue"
  | "slow_down"
  | "different_way"
  | "tj_cafe"
  | "simpler_version";

export type PaceChoice =
  // Slow It Down step-by-step route
  | "route_breakdown"
  | "route_guided"
  | "route_visual"
  | "route_metaphor"
  | "route_practice"
  | "slow_down_complete"
  | "slow_down_exit"
  // Different Way picker
  | "different_way_visual"
  | "different_way_metaphor"
  | "different_way_guided"
  // Direct
  | "simpler_version"
  | "tj_cafe"
  | "continue_override";

// Step keys exposed by LearningOrbDialog
export type OrbStepKey =
  | "visual"
  | "definition"
  | "breakdown"
  | "recognize"
  | "metaphor"
  | "information"
  | "reflection"
  | "application"
  | "quiz";

export interface SlowDownStep {
  pace: PaceChoice;
  stepKey: OrbStepKey;
  label: string;
  description: string;
}

// "Slow it down" → Breakdown → Guided Lesson → Visual → Metaphor → Practice
export const SLOW_DOWN_ROUTE: SlowDownStep[] = [
  { pace: "route_breakdown", stepKey: "breakdown",   label: "Breakdown",     description: "Decode the term piece by piece." },
  { pace: "route_guided",    stepKey: "information", label: "Guided Lesson", description: "Walk through the lesson step by step." },
  { pace: "route_visual",    stepKey: "visual",      label: "Visual",        description: "See it before you do it." },
  { pace: "route_metaphor",  stepKey: "metaphor",    label: "Metaphor",      description: "Anchor it to something familiar." },
  { pace: "route_practice",  stepKey: "application", label: "Practice",      description: "Try it now that it's clearer." },
];

// "Show me a different way" → Visual / Metaphor / Guided Lesson
export const DIFFERENT_WAY_OPTIONS: Array<{
  pace: PaceChoice;
  stepKey: OrbStepKey;
  label: string;
  description: string;
}> = [
  { pace: "different_way_visual",   stepKey: "visual",      label: "Visual",        description: "See the concept first." },
  { pace: "different_way_metaphor", stepKey: "metaphor",    label: "Metaphor",      description: "Connect it to something familiar." },
  { pace: "different_way_guided",   stepKey: "information", label: "Guided Lesson", description: "Slow walk-through." },
];

export interface LogPaceInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  breathChoice: BreathChoice;
  paceChoice: PaceChoice;
  routeStep?: number;
  paceOverride?: boolean;
  reasons?: string[];
}

export async function logPaceAdjustment(input: LogPaceInput): Promise<void> {
  try {
    await (supabase as any).from("pace_adjustments").insert({
      user_id: input.userId,
      term_id: input.termId ?? null,
      module_id: input.moduleId ?? null,
      session_id: input.sessionId ?? "",
      breath_choice: input.breathChoice,
      pace_choice: input.paceChoice,
      route_step: input.routeStep ?? 0,
      pace_override: input.paceOverride ?? false,
      reasons: input.reasons ?? [],
    });
  } catch {
    /* swallow — telemetry is best-effort */
  }
}
