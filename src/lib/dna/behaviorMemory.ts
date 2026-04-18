/* ─── DNA V2 Behavior Memory ─── */

import type { BehaviorHistory, InteractionData } from "./types";
import { EMPTY_BEHAVIOR_HISTORY } from "./types";

const MAX_HISTORY = 10;
const MAX_LAYER_EVALS = 3;

export function ensureHistory(h: BehaviorHistory | null | undefined): BehaviorHistory {
  if (!h || typeof h !== "object") return { ...EMPTY_BEHAVIOR_HISTORY };
  return {
    recentQuizzes: Array.isArray(h.recentQuizzes) ? h.recentQuizzes : [],
    recentTimes: Array.isArray(h.recentTimes) ? h.recentTimes : [],
    recentReflections: Array.isArray(h.recentReflections) ? h.recentReflections : [],
    recentLayerEvals: Array.isArray(h.recentLayerEvals) ? h.recentLayerEvals : [],
  };
}

function pushTrim<T>(arr: T[], val: T, max = MAX_HISTORY): T[] {
  return [...arr, val].slice(-max);
}

export function appendInteraction(
  history: BehaviorHistory,
  interaction: InteractionData
): BehaviorHistory {
  const next = ensureHistory(history);
  if (interaction.quizCorrect !== undefined) {
    next.recentQuizzes = pushTrim(next.recentQuizzes, interaction.quizCorrect);
  }
  if (interaction.timeSpentSeconds !== undefined) {
    next.recentTimes = pushTrim(next.recentTimes, interaction.timeSpentSeconds);
  }
  if (interaction.reflectionLength !== undefined) {
    next.recentReflections = pushTrim(next.recentReflections, interaction.reflectionLength);
  }
  return next;
}

export function appendLayerEval(history: BehaviorHistory, candidateLetter: string): BehaviorHistory {
  const next = ensureHistory(history);
  next.recentLayerEvals = pushTrim(next.recentLayerEvals, candidateLetter, MAX_LAYER_EVALS);
  return next;
}

export function isHistoryEmpty(h: BehaviorHistory | null | undefined): boolean {
  const safe = ensureHistory(h);
  return (
    safe.recentQuizzes.length === 0 &&
    safe.recentTimes.length === 0 &&
    safe.recentReflections.length === 0 &&
    safe.recentLayerEvals.length === 0
  );
}
