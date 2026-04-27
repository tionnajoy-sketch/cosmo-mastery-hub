// @vitest-environment node
/* Adaptive DNA Rule Validation Tests
 *
 * Verifies the deterministic behavior of the rule engine before any
 * UI integration. Covers every spec rule:
 *   - Correct answer        → retention +5, confidence +3, accuracy +5
 *   - Reattempt + correct   → retention +7, confidence +5, accuracy +6
 *   - Incorrect answer      → confidence -3, accuracy -4 + reinforcement
 *   - Skipped reflection    → engagement -2
 *   - High time on stage    → engagement +4
 *   - Term-end accuracy gate → ≥70% OR completed reinforcement
 *   - applyDelta clamps to [0, 100]
 *   - Reinforcement rules per layer (Assess/Recall fire after 1 attempt,
 *     Reflection/Application after 2)
 */

import { describe, it, expect } from "vitest";
import {
  computeAdaptiveDelta,
  canAdvanceTermEnd,
  deriveActionType,
  HIGH_TIME_MS_THRESHOLD,
  TERM_END_ACCURACY_THRESHOLD,
} from "@/lib/dna/adaptiveRules";
import {
  applyDelta,
  DEFAULT_BRAIN_STRENGTHS,
  ensureBrainStrengths,
  SIGNAL_KEYS,
} from "@/lib/dna/brainStrengths";
import reinforcementRules from "@/lib/tj-engine/rules/reinforcement.json";

describe("adaptiveRules — correct answer rules", () => {
  it("first-try correct grants retention +5, confidence +3, accuracy +5", () => {
    const r = computeAdaptiveDelta({ correct: true, reattempt: false });
    expect(r.patch.retention).toBe(5);
    expect(r.patch.confidence).toBe(3);
    expect(r.patch.accuracy).toBe(5);
    expect(r.triggerReinforcement).toBe(false);
    expect(r.reasons).toContain("first_try_correct");
  });

  it("reattempt + correct grants retention +7, confidence +5, accuracy +6", () => {
    const r = computeAdaptiveDelta({ correct: true, reattempt: true });
    expect(r.patch.retention).toBe(7);
    expect(r.patch.confidence).toBe(5);
    expect(r.patch.accuracy).toBe(6);
    expect(r.triggerReinforcement).toBe(false);
    expect(r.reasons).toContain("reattempt_correct");
  });
});

describe("adaptiveRules — incorrect answer rules", () => {
  it("incorrect answer drops confidence -3 + accuracy -4 and triggers reinforcement", () => {
    const r = computeAdaptiveDelta({ correct: false });
    expect(r.patch.confidence).toBe(-3);
    expect(r.patch.accuracy).toBe(-4);
    expect(r.triggerReinforcement).toBe(true);
    expect(r.reasons).toContain("incorrect_answer");
  });

  it("incorrect answer never produces a positive retention bump", () => {
    const r = computeAdaptiveDelta({ correct: false });
    expect(r.patch.retention ?? 0).toBeLessThanOrEqual(0);
  });
});

describe("adaptiveRules — engagement rules", () => {
  it("skipping reflection drops engagement -2", () => {
    const r = computeAdaptiveDelta({ skippedReflection: true });
    expect(r.patch.engagement).toBe(-2);
    expect(r.reasons).toContain("skipped_reflection");
  });

  it("high time on stage grants engagement +4", () => {
    const r = computeAdaptiveDelta({ timeSpentMs: HIGH_TIME_MS_THRESHOLD });
    expect(r.patch.engagement).toBe(4);
    expect(r.reasons).toContain("high_time_on_stage");
  });

  it("low time on stage does not grant engagement", () => {
    const r = computeAdaptiveDelta({ timeSpentMs: 5_000 });
    expect(r.patch.engagement).toBeUndefined();
  });

  it("combines correct + high time + skipped reflection deterministically", () => {
    const r = computeAdaptiveDelta({
      correct: true,
      reattempt: false,
      timeSpentMs: HIGH_TIME_MS_THRESHOLD + 1,
      skippedReflection: true,
    });
    // engagement = -2 (skip) + 4 (high time) = +2
    expect(r.patch.engagement).toBe(2);
    expect(r.patch.retention).toBe(5);
    expect(r.patch.confidence).toBe(3);
    expect(r.patch.accuracy).toBe(5);
  });
});

describe("adaptiveRules — empty context", () => {
  it("returns empty patch when no adaptive context provided", () => {
    const r = computeAdaptiveDelta({});
    expect(r.patch).toEqual({});
    expect(r.triggerReinforcement).toBe(false);
    expect(r.reasons).toEqual([]);
  });

  it("is pure — repeated calls produce identical output", () => {
    const a = computeAdaptiveDelta({ correct: true, reattempt: true });
    const b = computeAdaptiveDelta({ correct: true, reattempt: true });
    expect(a).toEqual(b);
  });
});

describe("brainStrengths — applyDelta", () => {
  it("applies positive deltas correctly", () => {
    const next = applyDelta(DEFAULT_BRAIN_STRENGTHS, { confidence: 3, retention: 5 });
    expect(next.confidence).toBe(53);
    expect(next.retention).toBe(55);
  });

  it("clamps to a maximum of 100", () => {
    const next = applyDelta({ ...DEFAULT_BRAIN_STRENGTHS, confidence: 98 }, { confidence: 10 });
    expect(next.confidence).toBe(100);
  });

  it("clamps to a minimum of 0", () => {
    const next = applyDelta({ ...DEFAULT_BRAIN_STRENGTHS, confidence: 2 }, { confidence: -10 });
    expect(next.confidence).toBe(0);
  });

  it("does not mutate the input object", () => {
    const before = { ...DEFAULT_BRAIN_STRENGTHS };
    applyDelta(before, { confidence: 5 });
    expect(before.confidence).toBe(50);
  });

  it("includes accuracy in the signal keys", () => {
    expect(SIGNAL_KEYS).toContain("accuracy");
    expect(DEFAULT_BRAIN_STRENGTHS.accuracy).toBe(50);
  });

  it("ensureBrainStrengths fills missing accuracy with default 50", () => {
    const partial = { confidence: 70 } as any;
    const ensured = ensureBrainStrengths(partial);
    expect(ensured.accuracy).toBe(50);
    expect(ensured.confidence).toBe(70);
  });
});

describe("term-end accuracy gate", () => {
  it("threshold is 70%", () => {
    expect(TERM_END_ACCURACY_THRESHOLD).toBe(70);
  });

  it("advances at exactly 70% accuracy", () => {
    expect(canAdvanceTermEnd({ accuracy: 70, reinforcementCompleted: false })).toBe(true);
  });

  it("advances above 70% accuracy", () => {
    expect(canAdvanceTermEnd({ accuracy: 95, reinforcementCompleted: false })).toBe(true);
  });

  it("blocks below 70% accuracy when no reinforcement completed", () => {
    expect(canAdvanceTermEnd({ accuracy: 69, reinforcementCompleted: false })).toBe(false);
  });

  it("advances below 70% if reinforcement was completed", () => {
    expect(canAdvanceTermEnd({ accuracy: 40, reinforcementCompleted: true })).toBe(true);
  });
});

describe("deriveActionType taxonomy", () => {
  it("first-try correct → 'correct'", () => {
    expect(deriveActionType({ correct: true })).toBe("correct");
  });

  it("reattempt + correct → 'retry'", () => {
    expect(deriveActionType({ correct: true, reattempt: true })).toBe("retry");
  });

  it("incorrect → 'incorrect'", () => {
    expect(deriveActionType({ correct: false })).toBe("incorrect");
  });

  it("skipped reflection (no correctness) → 'skip'", () => {
    expect(deriveActionType({ skippedReflection: true })).toBe("skip");
  });

  it("high time without correctness → 'time'", () => {
    expect(deriveActionType({ timeSpentMs: 90_000 })).toBe("time");
  });

  it("no signals → 'complete'", () => {
    expect(deriveActionType({})).toBe("complete");
  });
});

describe("reinforcement rules — per-layer triggers", () => {
  const rules = (reinforcementRules as any).rules as Array<{
    stage: string;
    trigger_after_attempts: number;
    trigger_below_accuracy?: number;
  }>;

  const findRule = (stage: string) => rules.find((r) => r.stage === stage);

  it("Assess fires reinforcement after 1 attempt", () => {
    const r = findRule("assess");
    expect(r).toBeDefined();
    expect(r!.trigger_after_attempts).toBe(1);
  });

  it("Recall Reconstruction fires reinforcement after 1 attempt below 50% accuracy", () => {
    const r = findRule("recall_reconstruction");
    expect(r).toBeDefined();
    expect(r!.trigger_after_attempts).toBe(1);
    expect(r!.trigger_below_accuracy).toBe(50);
  });

  it("Reflection requires 2+ attempts before reinforcement", () => {
    const r = findRule("reflection");
    expect(r).toBeDefined();
    expect(r!.trigger_after_attempts).toBeGreaterThanOrEqual(2);
  });

  it("Application requires 2+ attempts before reinforcement", () => {
    const r = findRule("application");
    expect(r).toBeDefined();
    expect(r!.trigger_after_attempts).toBeGreaterThanOrEqual(2);
  });

  it("every reinforcement rule has a focus_shift, reteach_summary, memory_cue, micro_check", () => {
    for (const r of rules) {
      expect((r as any).focus_shift).toBeTruthy();
      expect((r as any).reteach_summary).toBeTruthy();
      expect((r as any).memory_cue).toBeTruthy();
      expect((r as any).micro_check).toBeTruthy();
    }
  });
});
