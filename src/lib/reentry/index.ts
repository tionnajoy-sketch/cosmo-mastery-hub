// Re-Entry Intelligence — rule-based, no AI.
// When a learner returns from TJ Café or Recovery Mode, we DO NOT drop them
// back into the same exact state. We ask how they want to re-enter and route
// them to the matching layer. If they answer correctly afterwards we mark
// recovery_success = true on the most recent re-entry row.

import { supabase } from "@/integrations/supabase/client";

export type ReentryTrigger = "tj_cafe" | "recovery_exit" | "manual";

export type ReentryChoice =
  | "start_simpler"
  | "show_visually"
  | "give_metaphor"
  | "try_again"
  | "step_by_step";

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

export interface ReentryOption {
  choice: ReentryChoice;
  label: string;
  description: string;
  routeStep: OrbStepKey;
}

export const REENTRY_PROMPT = "How do you want to re-enter this concept?";

export const REENTRY_OPTIONS: ReentryOption[] = [
  { choice: "start_simpler",  label: "Start simpler",                 description: "Lower the difficulty and ease in.", routeStep: "definition" },
  { choice: "show_visually",  label: "Show me visually",              description: "Begin with the picture.",           routeStep: "visual" },
  { choice: "give_metaphor",  label: "Give me the metaphor",          description: "Anchor it to something familiar.",  routeStep: "metaphor" },
  { choice: "try_again",      label: "Try again",                     description: "Jump back into the question.",       routeStep: "quiz" },
  { choice: "step_by_step",   label: "Walk me through it step-by-step", description: "Slow guided lesson.",              routeStep: "information" },
];

export interface LogReentryInput {
  userId: string;
  termId?: string | null;
  moduleId?: string | null;
  sessionId?: string;
  trigger: ReentryTrigger;
  choice: ReentryChoice;
  routedTo: OrbStepKey;
  reasons?: string[];
}

export async function logReentryChoice(input: LogReentryInput): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("reentry_choices")
      .insert({
        user_id: input.userId,
        term_id: input.termId ?? null,
        module_id: input.moduleId ?? null,
        session_id: input.sessionId ?? "",
        trigger_source: input.trigger,
        reentry_choice: input.choice,
        routed_to: input.routedTo,
        reasons: input.reasons ?? [],
      })
      .select("id")
      .single();
    if (error) return null;
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

// Flip the most recent re-entry row to recovery_success = true.
export async function markReentrySuccess(rowId: string): Promise<void> {
  if (!rowId) return;
  try {
    await (supabase as any)
      .from("reentry_choices")
      .update({ recovery_success: true, resolved_at: new Date().toISOString() })
      .eq("id", rowId);
  } catch {
    /* best-effort */
  }
}

// Cross-component event so any surface can react.
export const REENTRY_EVENT = "tj-reentry-prompt";

export interface ReentryEventDetail {
  trigger: ReentryTrigger;
}

export function emitReentryPrompt(detail: ReentryEventDetail) {
  try {
    window.dispatchEvent(new CustomEvent(REENTRY_EVENT, { detail }));
  } catch { /* SSR / test */ }
}
