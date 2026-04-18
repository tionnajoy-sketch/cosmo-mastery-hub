/* ─── DNA V2 Recovery Mode (multi-signal) ─── */

import type { BehaviorHistory, DNAProfileV1, Trend } from "./types";

export interface RecoveryEval {
  active: boolean;
  reasons: string[];
  signalCount: number;
}

export function computeFailStreak(quizzes: boolean[]): number {
  if (!quizzes || quizzes.length === 0) return 0;
  let streak = 0;
  for (let i = quizzes.length - 1; i >= 0; i--) {
    if (quizzes[i] === false) streak++;
    else break;
  }
  return streak;
}

export function computeSuccessStreak(quizzes: boolean[]): number {
  if (!quizzes || quizzes.length === 0) return 0;
  let streak = 0;
  for (let i = quizzes.length - 1; i >= 0; i--) {
    if (quizzes[i] === true) streak++;
    else break;
  }
  return streak;
}

/**
 * Smart recovery: requires AT LEAST 2 negative signals.
 * Single bad streak alone is insufficient.
 */
export function shouldEnterRecoveryMode(
  history: BehaviorHistory,
  v1: Pick<DNAProfileV1, "confidence" | "retention">,
  trends: { confidence: Trend; retention: Trend; engagement: Trend }
): RecoveryEval {
  const reasons: string[] = [];
  const failStreak = computeFailStreak(history.recentQuizzes || []);

  if (failStreak >= 3) reasons.push(`failStreak=${failStreak}`);
  if (v1.confidence === "low" || trends.confidence === "decreasing") {
    reasons.push(
      `confidence=${v1.confidence}/${trends.confidence}`
    );
  }
  if (v1.retention === "low" || trends.retention === "decreasing") {
    reasons.push(`retention=${v1.retention}/${trends.retention}`);
  }
  if (trends.engagement === "decreasing") {
    reasons.push("engagementTrend=decreasing");
  }

  const active = reasons.length >= 2;
  return { active, reasons, signalCount: reasons.length };
}
