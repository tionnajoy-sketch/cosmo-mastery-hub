/* Learner Behavior Intake — Rule thresholds (no AI). */

export const BEHAVIOR_RULES = {
  cognitiveLoad: {
    highTimeMs: 180_000, // > 3 min on a single stage
    highHints: 3,
    highRetries: 2,
    lowTimeMs: 25_000, // < 25s usually means quick/low-load (or skipped)
  },
  explainBack: {
    minWords: 6, // counted as "answered"
  },
  integrity: {
    // weights for derived layer_completion_integrity (0–100)
    confidence: 20,
    explainBack: 25,
    thinkingPath: 15,
    submitted: 40,
  },
  routing: {
    lowConfidence: 2, // <= 2 is low
    highIntegrity: 80, // promote to test mode
  },
} as const;
