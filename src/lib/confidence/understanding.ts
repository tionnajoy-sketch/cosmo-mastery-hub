// Confidence rating → understanding_status classifier.
// Pure logic; no Supabase imports so it can be unit-tested.

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export type UnderstandingStatus =
  | "strong_understanding"
  | "fragile_understanding"
  | "strong_misconception"
  | "recognized_uncertainty"
  | "building_understanding"
  | "developing_misconception";

export const CONFIDENCE_OPTIONS: Array<{
  value: ConfidenceRating;
  label: string;
  emoji: string;
}> = [
  { value: 1, label: "I guessed", emoji: "🎲" },
  { value: 2, label: "Not sure", emoji: "🤔" },
  { value: 3, label: "Somewhat sure", emoji: "🙂" },
  { value: 4, label: "Confident", emoji: "💪" },
  { value: 5, label: "I could teach this", emoji: "🎓" },
];

/**
 * Map (correctness, confidence) → understanding_status.
 *
 * Core rules requested by product:
 *   correct + (1|2)  → fragile_understanding
 *   wrong   + (4|5)  → strong_misconception
 *   correct + (4|5)  → strong_understanding
 *   wrong   + (1|2)  → recognized_uncertainty
 *
 * Confidence 3 (Somewhat sure) is the "in between" zone, mapped to:
 *   correct + 3 → building_understanding
 *   wrong   + 3 → developing_misconception
 */
export function classifyUnderstanding(
  isCorrect: boolean,
  confidence: ConfidenceRating
): UnderstandingStatus {
  if (isCorrect) {
    if (confidence <= 2) return "fragile_understanding";
    if (confidence >= 4) return "strong_understanding";
    return "building_understanding";
  }
  // wrong
  if (confidence >= 4) return "strong_misconception";
  if (confidence <= 2) return "recognized_uncertainty";
  return "developing_misconception";
}

export const UNDERSTANDING_LABEL: Record<UnderstandingStatus, string> = {
  strong_understanding: "Strong Understanding",
  fragile_understanding: "Fragile Understanding",
  strong_misconception: "Strong Misconception",
  recognized_uncertainty: "Recognized Uncertainty",
  building_understanding: "Building Understanding",
  developing_misconception: "Developing Misconception",
};

export const UNDERSTANDING_DESCRIPTION: Record<UnderstandingStatus, string> = {
  strong_understanding:
    "You answered correctly with high confidence. Keep practicing to lock it in.",
  fragile_understanding:
    "You got it right, but felt unsure. Revisit this concept to make it solid.",
  strong_misconception:
    "You felt sure, but the answer was off. This is a high-priority concept to relearn.",
  recognized_uncertainty:
    "You missed it, but you knew you were unsure. Honest self-awareness — let's strengthen the layer.",
  building_understanding:
    "You're getting it. A little more practice will move you to confident understanding.",
  developing_misconception:
    "You answered incorrectly with mixed confidence. Reteach the core idea before moving on.",
};

// Tailwind-ish HSL color tokens (used inline in components)
export const UNDERSTANDING_COLOR: Record<
  UnderstandingStatus,
  { bg: string; border: string; text: string; chip: string }
> = {
  strong_understanding: {
    bg: "hsl(145 50% 96%)",
    border: "hsl(145 45% 70%)",
    text: "hsl(145 55% 28%)",
    chip: "hsl(145 55% 38%)",
  },
  fragile_understanding: {
    bg: "hsl(42 70% 96%)",
    border: "hsl(42 60% 75%)",
    text: "hsl(35 55% 30%)",
    chip: "hsl(35 70% 45%)",
  },
  strong_misconception: {
    bg: "hsl(0 70% 97%)",
    border: "hsl(0 65% 78%)",
    text: "hsl(0 55% 32%)",
    chip: "hsl(0 65% 48%)",
  },
  recognized_uncertainty: {
    bg: "hsl(220 50% 97%)",
    border: "hsl(220 45% 78%)",
    text: "hsl(220 45% 30%)",
    chip: "hsl(220 55% 50%)",
  },
  building_understanding: {
    bg: "hsl(175 45% 96%)",
    border: "hsl(175 45% 72%)",
    text: "hsl(175 45% 26%)",
    chip: "hsl(175 50% 38%)",
  },
  developing_misconception: {
    bg: "hsl(20 60% 96%)",
    border: "hsl(20 55% 76%)",
    text: "hsl(20 55% 30%)",
    chip: "hsl(20 65% 48%)",
  },
};
