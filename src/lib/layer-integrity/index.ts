import { supabase } from "@/integrations/supabase/client";

/**
 * Layer Completion Integrity Check
 *
 * The 10 canonical layers tracked per term:
 *   1. Definition          (step.key === "definition")
 *   2. Guided Lesson       (step.key === "information")
 *   3. Visual Map          (step.key === "visual")
 *   4. Metaphor            (step.key === "metaphor")
 *   5. Identity Layer      (lives inside the Definition surface — counted with definition)
 *   6. Explain-It-Back     (recorded separately when the learner submits text)
 *   7. Reflection          (step.key === "reflection")
 *   8. Memory Anchor       (lives inside the Metaphor surface — counted with metaphor)
 *   9. Practice Question   (step.key === "recognize" OR "application")
 *  10. Mastery Check       (step.key === "quiz") — gate target, not a prerequisite
 *
 * Mastery Check is the gate target — it does NOT count toward the prerequisite
 * percentage. The prerequisite pool is the other 9 layers.
 */

export type IntegrityLayer =
  | "definition"
  | "guided_lesson"
  | "visual_map"
  | "metaphor"
  | "identity_layer"
  | "explain_it_back"
  | "reflection"
  | "memory_anchor"
  | "practice_question"
  | "mastery_check";

export const INTEGRITY_LAYERS: IntegrityLayer[] = [
  "definition",
  "guided_lesson",
  "visual_map",
  "metaphor",
  "identity_layer",
  "explain_it_back",
  "reflection",
  "memory_anchor",
  "practice_question",
  "mastery_check",
];

/** Layers that count toward the 70% threshold (excludes mastery_check itself). */
export const PREREQUISITE_LAYERS: IntegrityLayer[] = INTEGRITY_LAYERS.filter(
  (l) => l !== "mastery_check"
);

export const INTEGRITY_THRESHOLD = 0.7;

/**
 * Step-key → integrity layer mapping. A single completed step may satisfy
 * multiple integrity layers (e.g. completing "definition" satisfies both
 * Definition and Identity Layer per existing flow design).
 */
const STEP_KEY_TO_LAYERS: Record<string, IntegrityLayer[]> = {
  definition: ["definition", "identity_layer"],
  information: ["guided_lesson"],
  visual: ["visual_map"],
  metaphor: ["metaphor", "memory_anchor"],
  reflection: ["reflection"],
  recognize: ["practice_question"],
  application: ["practice_question"],
  quiz: ["mastery_check"],
};

/** Display label for a layer (used in UI). */
export const LAYER_LABEL: Record<IntegrityLayer, string> = {
  definition: "Definition",
  guided_lesson: "Guided Lesson",
  visual_map: "Visual Map",
  metaphor: "Metaphor",
  identity_layer: "Identity Layer",
  explain_it_back: "Explain-It-Back",
  reflection: "Reflection",
  memory_anchor: "Memory Anchor",
  practice_question: "Practice Question",
  mastery_check: "Mastery Check",
};

/**
 * Priority order for "show me the most important missing layer".
 * Definition + Guided Lesson are the strongest retention prerequisites.
 */
const LAYER_PRIORITY: IntegrityLayer[] = [
  "definition",
  "guided_lesson",
  "visual_map",
  "metaphor",
  "practice_question",
  "explain_it_back",
  "reflection",
  "identity_layer",
  "memory_anchor",
];

/** Best step.key to navigate to when surfacing a missing integrity layer. */
const LAYER_TO_STEP_KEY: Record<IntegrityLayer, string> = {
  definition: "definition",
  guided_lesson: "information",
  visual_map: "visual",
  metaphor: "metaphor",
  identity_layer: "definition",
  explain_it_back: "definition",
  reflection: "reflection",
  memory_anchor: "metaphor",
  practice_question: "recognize",
  mastery_check: "quiz",
};

interface ComputeArgs {
  /** Step.key values that the learner has completed in this session. */
  completedStepKeys: string[];
  /** Whether the learner submitted (or skipped past) the Explain-It-Back layer. */
  explainItBackCompleted?: boolean;
}

export interface IntegrityResult {
  completed: IntegrityLayer[];
  missing: IntegrityLayer[];
  /** 0–1 fraction of PREREQUISITE_LAYERS the learner has done. */
  ratio: number;
  /** 0–100 integer percentage. */
  pct: number;
  /** True when ratio >= INTEGRITY_THRESHOLD. */
  passes: boolean;
  /** Highest-priority missing layer, or null if none missing. */
  mostImportantMissing: IntegrityLayer | null;
}

export function computeIntegrity({
  completedStepKeys,
  explainItBackCompleted = false,
}: ComputeArgs): IntegrityResult {
  const completedSet = new Set<IntegrityLayer>();
  for (const key of completedStepKeys) {
    const layers = STEP_KEY_TO_LAYERS[key];
    if (layers) layers.forEach((l) => completedSet.add(l));
  }
  if (explainItBackCompleted) completedSet.add("explain_it_back");

  const completed = PREREQUISITE_LAYERS.filter((l) => completedSet.has(l));
  const missing = PREREQUISITE_LAYERS.filter((l) => !completedSet.has(l));
  const ratio = PREREQUISITE_LAYERS.length === 0 ? 1 : completed.length / PREREQUISITE_LAYERS.length;
  const pct = Math.round(ratio * 100);
  const mostImportantMissing =
    LAYER_PRIORITY.find((l) => missing.includes(l)) ?? null;

  return {
    completed,
    missing,
    ratio,
    pct,
    passes: ratio >= INTEGRITY_THRESHOLD,
    mostImportantMissing,
  };
}

/** Map an integrity layer back to the step.key the learner should navigate to. */
export function layerToStepKey(layer: IntegrityLayer): string {
  return LAYER_TO_STEP_KEY[layer];
}

export type IntegrityDecision =
  | "continue_anyway"
  | "go_to_missing"
  | "show_most_important";

interface RecordArgs {
  userId: string;
  termId: string | null;
  moduleId?: string | null;
  result: IntegrityResult;
  decision: IntegrityDecision;
}

export async function recordIntegrityCheck({
  userId,
  termId,
  moduleId,
  result,
  decision,
}: RecordArgs): Promise<void> {
  await supabase.from("layer_integrity_checks").insert({
    user_id: userId,
    term_id: termId,
    module_id: moduleId ?? null,
    completion_pct: result.pct,
    completed_layers: result.completed,
    missing_layers: result.missing,
    most_important_missing: result.mostImportantMissing,
    decision,
    integrity_override: decision === "continue_anyway",
    integrity_recovery: decision !== "continue_anyway",
  });
}
