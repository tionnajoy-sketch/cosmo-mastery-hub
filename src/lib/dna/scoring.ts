/* ─── DNA V2 Scoring (pure functions) ─── */

import type { ContentDepth, Trend } from "./types";

/** Maps A–Z to 1–10 scale. A=1, Z=10. */
export function mapRetentionToScore(char: string | null | undefined): number {
  if (!char) return 5;
  const code = char.toUpperCase().charCodeAt(0);
  const clamped = Math.max(65, Math.min(90, code));
  return Math.round(((clamped - 65) / 25) * 9 + 1);
}

/** Maps a–z to 1–10 scale. a=1, z=10. */
export function mapConfidenceToScore(char: string | null | undefined): number {
  if (!char) return 5;
  const code = char.toLowerCase().charCodeAt(0);
  const clamped = Math.max(97, Math.min(122, code));
  return Math.round(((clamped - 97) / 25) * 9 + 1);
}

/** Engagement is already 0–9, no remap needed. */
export function clampEngagement(e: number | null | undefined): number {
  if (e === null || e === undefined || isNaN(e)) return 5;
  return Math.min(9, Math.max(0, Math.round(e)));
}

/** Weighted blend: E*0.4 + R*0.35 + C*0.25 → roughly 0.4–9.5 range. */
export function computeFinalDepthScore(
  engagement: number,
  retentionScore: number,
  confidenceScore: number
): number {
  return engagement * 0.4 + retentionScore * 0.35 + confidenceScore * 0.25;
}

export function depthFromScore(score: number): ContentDepth {
  if (score > 7) return "deep";
  if (score >= 4) return "standard";
  return "brief";
}

/** Trend: compare mean of last 3 vs prior 3 entries. */
export function computeTrend(series: number[]): Trend {
  if (!series || series.length < 4) return "stable";
  const recent = series.slice(-3);
  const prior = series.slice(-6, -3);
  if (prior.length === 0) return "stable";
  const meanRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const meanPrior = prior.reduce((a, b) => a + b, 0) / prior.length;
  const delta = meanRecent - meanPrior;
  const threshold = Math.max(0.5, Math.abs(meanPrior) * 0.05);
  if (delta > threshold) return "increasing";
  if (delta < -threshold) return "decreasing";
  return "stable";
}

/** Trend from boolean series (quiz correctness): treat true=1, false=0. */
export function computeBooleanTrend(series: boolean[]): Trend {
  return computeTrend((series || []).map((b) => (b ? 1 : 0)));
}
