/* ─── DNA V2 Adaptation Engine (Orchestrator) ─── */

import type {
  AdaptationContext,
  AdaptationDecisionLog,
  AdaptationRules,
  BehaviorHistory,
  DNAProfileV1,
  DNAProfileV2,
  LayerScores,
  Trend,
} from "./types";
import {
  clampEngagement,
  computeBooleanTrend,
  computeFinalDepthScore,
  computeTrend,
  depthFromScore,
  mapConfidenceToScore,
  mapRetentionToScore,
} from "./scoring";
import { findDominantLayer, findWeakestLayer, letterForLayer } from "./layerStrength";
import { shouldEnterRecoveryMode } from "./recoveryMode";
import { ensureHistory, isHistoryEmpty } from "./behaviorMemory";
import { createLog, emitLog, logDecision } from "./logger";

/* DEFAULT_STEPS — MUST mirror V1 in src/hooks/useDNAAdaptation.ts to preserve behavior */
const DEFAULT_STEPS = [
  "visual",
  "definition",
  "scripture",
  "breakdown",
  "recognize",
  "metaphor",
  "information",
  "reflection",
  "application",
  "quiz",
];

const LAYER_TO_STEP: Record<string, string> = {
  D: "definition",
  V: "visual",
  M: "metaphor",
  I: "information",
  R: "reflection",
  A: "application",
  K: "quiz",
  B: "breakdown",
  N: "recognize",
  S: "scripture",
};

function buildStepOrder(layerLetter: string): string[] {
  const preferred = LAYER_TO_STEP[layerLetter] || "definition";
  return [
    "breakdown",
    preferred,
    ...DEFAULT_STEPS.filter((s) => s !== "breakdown" && s !== preferred),
  ];
}

export function buildV2Profile(
  v1: DNAProfileV1,
  layerScores: LayerScores,
  history: BehaviorHistory
): DNAProfileV2 {
  const safeHistory = ensureHistory(history);
  const engagementScore = clampEngagement(v1.engagement);
  const retentionScore = mapRetentionToScore(v1.raw[2]);
  const confidenceScore = mapConfidenceToScore(v1.raw[3]);
  const finalDepthScore = computeFinalDepthScore(engagementScore, retentionScore, confidenceScore);

  const engagementTrend: Trend = computeTrend(safeHistory.recentTimes);
  const retentionTrend: Trend = computeBooleanTrend(safeHistory.recentQuizzes);
  const confidenceTrend: Trend = computeTrend(safeHistory.recentReflections);

  const dominant = findDominantLayer(layerScores);
  const weakest = findWeakestLayer(layerScores);

  const recoveryEval = shouldEnterRecoveryMode(
    safeHistory,
    { confidence: v1.confidence, retention: v1.retention },
    { confidence: confidenceTrend, retention: retentionTrend, engagement: engagementTrend }
  );

  return {
    ...v1,
    engagementTrend,
    retentionTrend,
    confidenceTrend,
    recoveryMode: recoveryEval.active,
    layerScores,
    weakestLayer: weakest || "",
    finalDepthScore,
    engagementScore,
    retentionScore,
    confidenceScore,
  };
}

/**
 * Builds adaptation context from V2 profile.
 * Caller is responsible for V1 fallback decision.
 */
export function buildV2AdaptationContext(
  v2: DNAProfileV2,
  history: BehaviorHistory
): { context: AdaptationContext; log: AdaptationDecisionLog } {
  const log = createLog();
  const safeHistory = ensureHistory(history);

  // Step order from current L
  const stepOrder = buildStepOrder(v2.layerStrength);
  logDecision(log, "stepOrder", stepOrder.join("→"), `lead with layer ${v2.layerStrength}`);

  // Weighted depth
  let contentDepth = depthFromScore(v2.finalDepthScore);
  logDecision(
    log,
    "contentDepth",
    contentDepth,
    `finalDepthScore=${v2.finalDepthScore.toFixed(2)} (E*0.4 + R*0.35 + C*0.25)`
  );

  // Confidence-driven difficulty + tone
  let difficulty: AdaptationRules["difficulty"] = "standard";
  let toneModifier: AdaptationRules["toneModifier"] = "neutral";
  let microSteps = false;
  let addMemoryCues = false;
  const encouragement: string[] = [];

  if (v2.confidence === "low") {
    difficulty = "guided";
    toneModifier = "supportive";
    microSteps = true;
    encouragement.push(
      "You're doing amazing — every step forward counts.",
      "Remember, understanding takes time. You've got this.",
      "I believe in you. Let's take this one step at a time."
    );
    logDecision(log, "difficulty", "guided", "confidence=low");
  } else if (v2.confidence === "high") {
    difficulty = "challenge";
    toneModifier = "challenging";
    logDecision(log, "difficulty", "challenge", "confidence=high");
  }

  if (v2.retention === "low") {
    addMemoryCues = true;
    if (encouragement.length === 0) {
      encouragement.push("Let's review the key points one more time to lock them in.");
    }
    logDecision(log, "addMemoryCues", true, "retention=low");
  }

  if (v2.engagement <= 3) {
    microSteps = true;
    logDecision(log, "microSteps", true, `engagement=${v2.engagement} <= 3`);
  }

  // Trend-aware nudges
  if (v2.confidenceTrend === "increasing" && difficulty === "standard") {
    difficulty = "challenge";
    logDecision(log, "difficulty", "challenge", "confidenceTrend=increasing");
  }
  if (v2.engagementTrend === "decreasing") {
    microSteps = true;
    logDecision(log, "microSteps", true, "engagementTrend=decreasing");
  }

  // Recovery mode: hard override
  if (v2.recoveryMode) {
    difficulty = "guided";
    contentDepth = "brief";
    microSteps = true;
    addMemoryCues = true;
    toneModifier = "supportive";
    if (encouragement.length === 0) {
      encouragement.push("Let's slow down together — you're not behind, you're building.");
    }
    const failStreak = (() => {
      let s = 0;
      for (let i = safeHistory.recentQuizzes.length - 1; i >= 0; i--) {
        if (safeHistory.recentQuizzes[i] === false) s++;
        else break;
      }
      return s;
    })();
    logDecision(
      log,
      "recoveryMode",
      true,
      `multi-signal trigger (failStreak=${failStreak}, conf=${v2.confidence}/${v2.confidenceTrend}, ret=${v2.retention}/${v2.retentionTrend})`
    );
  }

  const context: AdaptationContext = {
    stepOrder,
    encouragement,
    contentDepth,
    difficulty,
    addMemoryCues,
    microSteps,
    toneModifier,
    recoveryMode: v2.recoveryMode,
    trendSignals: {
      engagement: v2.engagementTrend,
      retention: v2.retentionTrend,
      confidence: v2.confidenceTrend,
    },
    dominantLayer: v2.layerStrength,
    weakestLayer: v2.weakestLayer,
    finalDepthScore: v2.finalDepthScore,
    fallbackToV1: false,
  };

  return { context, log };
}

/** Wraps a V1 ruleset into an AdaptationContext shape with neutral V2 fields. */
export function v1RulesAsContext(
  rules: AdaptationRules,
  v1: DNAProfileV1
): AdaptationContext {
  return {
    ...rules,
    recoveryMode: false,
    trendSignals: { engagement: "stable", retention: "stable", confidence: "stable" },
    dominantLayer: v1.layerStrength,
    weakestLayer: "",
    finalDepthScore: 0,
    fallbackToV1: true,
  };
}

/** Convenience: should we fall back to V1? */
export function shouldUseV1Fallback(
  layerScores: LayerScores | null | undefined,
  history: BehaviorHistory | null | undefined
): boolean {
  const noScores = !layerScores || Object.keys(layerScores).length === 0;
  const noHistory = isHistoryEmpty(history);
  return noScores && noHistory;
}

export { emitLog };
