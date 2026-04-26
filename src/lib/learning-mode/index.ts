import type { LearningMode } from "@/hooks/useLearningMode";

/**
 * Step keys (matching STEPS in LearningOrbDialog) belonging to each mode.
 *
 * Teach Mode = instruction layers
 *   Definition, Guided Lesson (information), Visual Map (visual),
 *   Metaphor, Identity Layer (definition scaffolds identity),
 *   Explain-It-Back (lives inside definition layer surface),
 *   Reflection, Memory Anchor (lives inside metaphor surface),
 *   plus Break It Down for word-level decoding context.
 *
 * Test Mode = practice + assessment layers
 *   Practice Question (recognize), State Board Question (application),
 *   Mastery Check (quiz). Confidence Rating, Error Type Tracking,
 *   and Second Chance fire automatically inside these stages.
 */
export const TEACH_MODE_STEPS = new Set<string>([
  "visual",
  "definition",
  "scripture",
  "breakdown",
  "metaphor",
  "information",
  "reflection",
]);

export const TEST_MODE_STEPS = new Set<string>([
  "recall_reconstruction",
  "recognize",
  "application",
  "quiz",
]);

export function filterStepsByMode<T extends { key: string }>(
  steps: T[],
  mode: LearningMode
): T[] {
  const allowed = mode === "teach" ? TEACH_MODE_STEPS : TEST_MODE_STEPS;
  const filtered = steps.filter((s) => allowed.has(s.key));
  // Safety net: never return empty (fall back to original list)
  return filtered.length > 0 ? filtered : steps;
}
