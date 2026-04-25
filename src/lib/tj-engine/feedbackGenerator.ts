/* TJ Engine — Feedback Generator
 *
 * Produces feedback in the strict TJ format:
 *   1. What you understood
 *   2. What is incomplete
 *   3. What layer is missing
 *   4. Why this step matters
 *   5. What to do next
 *
 * Calm, editorial, empowering. Never punishing. Never raw AI.
 */

import { findFeedback } from "./ruleRepository";
import type { TJRuleSet } from "./ruleRepository";
import type {
  InterpretedSubmission,
  StageId,
  TJFeedback,
} from "./types";

const FALLBACK: TJFeedback = {
  what_you_understood: "You showed up and made an attempt — that counts.",
  what_is_incomplete: "We need a little more to lock this layer in.",
  what_layer_is_missing: "Let's reinforce this step before moving on.",
  why_this_step_matters: "Every layer is a pathway your brain is building.",
  what_to_do_next: "Try again with the cue I'll give you.",
};

export function generateFeedback(
  rules: TJRuleSet,
  stage: StageId,
  interpretation: InterpretedSubmission,
): TJFeedback {
  const tpl = findFeedback(rules, stage);
  if (!tpl) return FALLBACK;

  // If complete, soften "incomplete" + "missing" copy with an affirmation.
  if (interpretation.is_complete) {
    return {
      what_you_understood: tpl.what_you_understood,
      what_is_incomplete: "Nothing missing here — you delivered.",
      what_layer_is_missing: "All layer signals present.",
      why_this_step_matters: tpl.why_this_step_matters,
      what_to_do_next: "Move forward to the next layer.",
    };
  }

  return {
    what_you_understood: tpl.what_you_understood,
    what_is_incomplete: tpl.what_is_incomplete,
    what_layer_is_missing: tpl.what_layer_is_missing,
    why_this_step_matters: tpl.why_this_step_matters,
    what_to_do_next: tpl.what_to_do_next,
  };
}

/** Render feedback as TJ-formatted markdown for inline display. */
export function renderFeedbackMarkdown(fb: TJFeedback): string {
  return [
    `**What you understood**\n${fb.what_you_understood}`,
    `**What is incomplete**\n${fb.what_is_incomplete}`,
    `**What layer is missing**\n${fb.what_layer_is_missing}`,
    `**Why this step matters**\n${fb.why_this_step_matters}`,
    `**What to do next**\n${fb.what_to_do_next}`,
  ].join("\n\n");
}
