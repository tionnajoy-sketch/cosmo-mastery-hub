/* ─── DNA V2 Dynamic Layer Strength ─── */

import type { LayerScores, LayerKey } from "./types";

const LAYER_TO_LETTER: Record<LayerKey, string> = {
  definition: "D",
  visual: "V",
  metaphor: "M",
  information: "I",
  reflection: "R",
  application: "A",
  quiz: "K",
  breakdown: "B",
  recognize: "N",
  scripture: "S",
};

const LETTER_TO_LAYER: Record<string, LayerKey> = Object.entries(LAYER_TO_LETTER)
  .reduce((acc, [k, v]) => ({ ...acc, [v]: k as LayerKey }), {});

export function letterForLayer(layer: string): string {
  return LAYER_TO_LETTER[layer as LayerKey] || "D";
}

export function layerForLetter(letter: string): LayerKey {
  return LETTER_TO_LAYER[letter.toUpperCase()] || "definition";
}

export function totalInteractions(scores: LayerScores): number {
  return Object.values(scores).reduce((sum, v) => sum + Math.abs(v || 0), 0);
}

export function findDominantLayer(scores: LayerScores): { layer: LayerKey; score: number } | null {
  const entries = Object.entries(scores) as [LayerKey, number][];
  if (entries.length === 0) return null;
  let best: [LayerKey, number] | null = null;
  for (const [k, v] of entries) {
    if (best === null || v > best[1]) best = [k, v];
  }
  if (!best) return null;
  return { layer: best[0], score: best[1] };
}

export function findWeakestLayer(scores: LayerScores): LayerKey | null {
  const entries = Object.entries(scores) as [LayerKey, number][];
  if (entries.length === 0) return null;
  let worst: [LayerKey, number] | null = null;
  for (const [k, v] of entries) {
    if (worst === null || v < worst[1]) worst = [k, v];
  }
  return worst ? worst[0] : null;
}

export interface LayerEvalResult {
  newLayerLetter: string;
  shouldUpdate: boolean;
  reason: string;
  candidate: string | null; // letter
}

/**
 * Evaluate whether dominant layer should change.
 * Stability gates:
 *  1. Min 5 total interactions before considering a switch
 *  2. Candidate must exceed current by max(20%, +3) absolute
 *  3. Same candidate must win 3 consecutive evaluations
 */
export function evaluateDominantLayer(
  scores: LayerScores,
  currentLetter: string,
  recentLayerEvals: string[]
): LayerEvalResult {
  const total = totalInteractions(scores);
  if (total < 5) {
    return {
      newLayerLetter: currentLetter,
      shouldUpdate: false,
      reason: `insufficient interactions (${total} < 5)`,
      candidate: null,
    };
  }

  const dominant = findDominantLayer(scores);
  if (!dominant) {
    return {
      newLayerLetter: currentLetter,
      shouldUpdate: false,
      reason: "no layer scores available",
      candidate: null,
    };
  }

  const candidateLetter = letterForLayer(dominant.layer);
  if (candidateLetter === currentLetter) {
    return {
      newLayerLetter: currentLetter,
      shouldUpdate: false,
      reason: `candidate (${candidateLetter}) matches current`,
      candidate: candidateLetter,
    };
  }

  const currentLayer = layerForLetter(currentLetter);
  const currentScore = scores[currentLayer] || 0;
  const margin = dominant.score - currentScore;
  const requiredMargin = Math.max(3, Math.abs(currentScore) * 0.2);

  if (margin < requiredMargin) {
    return {
      newLayerLetter: currentLetter,
      shouldUpdate: false,
      reason: `margin ${margin.toFixed(1)} < required ${requiredMargin.toFixed(1)}`,
      candidate: candidateLetter,
    };
  }

  // Consistency gate: last 3 evals must all be candidateLetter (including this one)
  const evalsWithCurrent = [...recentLayerEvals.slice(-2), candidateLetter];
  const consistent = evalsWithCurrent.length === 3 && evalsWithCurrent.every((e) => e === candidateLetter);

  if (!consistent) {
    return {
      newLayerLetter: currentLetter,
      shouldUpdate: false,
      reason: `awaiting consistency (${evalsWithCurrent.join(",")})`,
      candidate: candidateLetter,
    };
  }

  return {
    newLayerLetter: candidateLetter,
    shouldUpdate: true,
    reason: `consistent lead 3 evals, margin +${margin.toFixed(1)}`,
    candidate: candidateLetter,
  };
}

export function applyLayerScoreDelta(
  scores: LayerScores,
  layer: string,
  delta: number
): LayerScores {
  const key = layer as LayerKey;
  return { ...scores, [key]: (scores[key] || 0) + delta };
}
