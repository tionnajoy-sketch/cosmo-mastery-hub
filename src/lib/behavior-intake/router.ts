/* Learner Behavior Intake — Conditional Router (rule-based).
 *
 * Maps a freshly committed snapshot to a recommended next route.
 * The TJ Engine still owns the safety decision; this refines the label.
 */

import { BEHAVIOR_RULES } from "./rules";
import type { IntakeSnapshot } from "./types";

export type BehaviorRoute =
  | "review_concept"
  | "strengthen_layer"
  | "practice_again"
  | "switch_to_test_mode"
  | "tj_reset_cafe"
  | "continue";

export interface BehaviorSuggestion {
  route: BehaviorRoute;
  label: string;
  reason: string;
}

export function recommendNextRoute(snap: IntakeSnapshot): BehaviorSuggestion {
  const r = BEHAVIOR_RULES.routing;

  if (
    snap.cognitive_load === "high" &&
    (snap.confidence_rating ?? 5) <= r.lowConfidence
  ) {
    return {
      route: "tj_reset_cafe",
      label: "Take a TJ Reset Café break",
      reason: "High cognitive load + low confidence detected.",
    };
  }

  if (snap.error_type === "wrong_layer") {
    return {
      route: "strengthen_layer",
      label: "Strengthen This Layer",
      reason: "You answered from a different layer than the one being asked.",
    };
  }

  if (snap.second_chance_used && !snap.second_chance_improved) {
    return {
      route: "review_concept",
      label: "Review Concept",
      reason: "Second attempt didn't improve — let's revisit the basics.",
    };
  }

  if (snap.error_type === "forgot" || snap.error_type === "guessed") {
    return {
      route: "practice_again",
      label: "Practice Again",
      reason: "More repetition will lock this in.",
    };
  }

  if (
    snap.mode === "teach" &&
    snap.layer_completion_integrity >= r.highIntegrity &&
    (snap.confidence_rating ?? 0) >= 4
  ) {
    return {
      route: "switch_to_test_mode",
      label: "Switch to Test Mode",
      reason: "You're ready to challenge yourself.",
    };
  }

  return {
    route: "continue",
    label: "Continue",
    reason: "All signals look healthy.",
  };
}
