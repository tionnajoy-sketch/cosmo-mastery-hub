/* ───────────────────────────────────────────────────────────────────
 * TJ Anderson Layer Method™: Core Cross Agent™
 * Brain Strengths model (the new "10th framework" DNA brain)
 *
 * DNA = the brain. 9 cognitive muscles trained by the 9 layers,
 * plus 3 affective signals (engagement / retention / confidence).
 * The legacy 4-char [L][E][R][C] code is now DERIVED from this
 * richer source of truth, so nothing in the rest of the app breaks.
 * ─────────────────────────────────────────────────────────────────── */

export type BrainKey =
  | "visual"
  | "language"
  | "analysis"
  | "pattern"
  | "abstraction"
  | "intake"
  | "reflection"
  | "application"
  | "recall";

export type SignalKey = "engagement" | "retention" | "confidence" | "accuracy";

export type StrengthKey = BrainKey | SignalKey;

export type BrainStrengths = Record<StrengthKey, number>;

export const BRAIN_KEYS: BrainKey[] = [
  "visual",
  "language",
  "analysis",
  "pattern",
  "abstraction",
  "intake",
  "reflection",
  "application",
  "recall",
];

export const SIGNAL_KEYS: SignalKey[] = ["engagement", "retention", "confidence", "accuracy"];

export const ALL_STRENGTH_KEYS: StrengthKey[] = [...BRAIN_KEYS, ...SIGNAL_KEYS];

export const DEFAULT_BRAIN_STRENGTHS: BrainStrengths = {
  visual: 50,
  language: 50,
  analysis: 50,
  pattern: 50,
  abstraction: 50,
  intake: 50,
  reflection: 50,
  application: 50,
  recall: 50,
  engagement: 50,
  retention: 50,
  confidence: 50,
  accuracy: 50,
};

/** Layer (step key) → which brain muscle it trains */
export const LAYER_TO_BRAIN: Record<string, BrainKey> = {
  visual: "visual",
  definition: "language",
  scripture: "language",
  breakdown: "analysis",
  recognize: "pattern",
  metaphor: "abstraction",
  information: "intake",
  reflection: "reflection",
  application: "application",
  quiz: "recall",
  recall_reconstruction: "recall",
};

export const BRAIN_LABEL: Record<StrengthKey, string> = {
  visual: "Visual",
  language: "Language",
  analysis: "Analysis",
  pattern: "Pattern",
  abstraction: "Abstraction",
  intake: "Intake",
  reflection: "Reflection",
  application: "Application",
  recall: "Recall",
  engagement: "Engagement",
  retention: "Retention",
  confidence: "Confidence",
  accuracy: "Accuracy",
};

/* ─── Static per-layer DNA updates (matches the spec) ─── */

export interface LayerUpdateSpec {
  brain: BrainKey;        // which muscle gets the bump
  brainDelta: number;     // how much
  signalDelta?: Partial<Record<SignalKey, number>>;
}

export const LAYER_UPDATES: Record<string, LayerUpdateSpec> = {
  visual:        { brain: "visual",      brainDelta: 3, signalDelta: { engagement: 1 } },
  definition:    { brain: "language",    brainDelta: 3, signalDelta: { retention: 2 } },
  scripture:     { brain: "language",    brainDelta: 3, signalDelta: { retention: 2 } },
  breakdown:     { brain: "analysis",    brainDelta: 3, signalDelta: { retention: 1 } },
  recognize:     { brain: "pattern",     brainDelta: 3, signalDelta: { engagement: 1 } },
  metaphor:      { brain: "abstraction", brainDelta: 3, signalDelta: { retention: 2 } },
  information:   { brain: "intake",      brainDelta: 3, signalDelta: { retention: 1 } },
  reflection:    { brain: "reflection",  brainDelta: 5, signalDelta: { confidence: 3 } },
  application:   { brain: "application", brainDelta: 4, signalDelta: { confidence: 2 } },
  // Assess (correct/wrong handled separately via applyAssessUpdate)
};

/* ─── Helpers ─── */

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

export function ensureBrainStrengths(input: any): BrainStrengths {
  if (!input || typeof input !== "object") return { ...DEFAULT_BRAIN_STRENGTHS };
  const out: BrainStrengths = { ...DEFAULT_BRAIN_STRENGTHS };
  for (const k of ALL_STRENGTH_KEYS) {
    const v = input[k];
    if (typeof v === "number" && !isNaN(v)) out[k] = clamp(v);
  }
  return out;
}

export function applyDelta(
  s: BrainStrengths,
  patch: Partial<Record<StrengthKey, number>>,
): BrainStrengths {
  const next = { ...s };
  for (const k of ALL_STRENGTH_KEYS) {
    const d = patch[k];
    if (typeof d === "number" && d !== 0) next[k] = clamp(next[k] + d);
  }
  return next;
}

/** Apply the static spec for completing one of the 9 layers. */
export function applyLayerCompletion(s: BrainStrengths, layerKey: string): BrainStrengths {
  const spec = LAYER_UPDATES[layerKey];
  if (!spec) return s;
  const patch: Partial<Record<StrengthKey, number>> = { [spec.brain]: spec.brainDelta };
  if (spec.signalDelta) {
    for (const [k, v] of Object.entries(spec.signalDelta)) {
      patch[k as SignalKey] = v;
    }
  }
  return applyDelta(s, patch);
}

/** Assess step. Correct → +4 recall +2 confidence. Wrong → +1 recall (no punishment). */
export function applyAssessUpdate(s: BrainStrengths, correct: boolean): BrainStrengths {
  if (correct) return applyDelta(s, { recall: 4, confidence: 2, engagement: 1 });
  return applyDelta(s, { recall: 1, engagement: 1 });
}

/** Recall Reconstruction (the new 10th step). 80–100→+5, 50–79→+3, <50→+1 recall. */
export function applyRecallReconstruction(
  s: BrainStrengths,
  scorePct: number,
): BrainStrengths {
  let recall = 1;
  if (scorePct >= 80) recall = 5;
  else if (scorePct >= 50) recall = 3;
  const retention = scorePct >= 50 ? 3 : 0;
  return applyDelta(s, {
    recall,
    confidence: 2,
    retention,
    engagement: 2,
  });
}

/* ─── Brain Balance Index ─── */

export function brainAverage(s: BrainStrengths): number {
  const sum = BRAIN_KEYS.reduce((acc, k) => acc + s[k], 0);
  return Math.round(sum / BRAIN_KEYS.length);
}

/** Imbalance penalty: stddev across the 9 brain strengths.
 *  High variance = unbalanced brain. Penalty is up to ~15 points. */
export function brainImbalancePenalty(s: BrainStrengths): number {
  const avg = brainAverage(s);
  const variance =
    BRAIN_KEYS.reduce((acc, k) => acc + (s[k] - avg) ** 2, 0) / BRAIN_KEYS.length;
  const stddev = Math.sqrt(variance);
  // Cap penalty at 15 so a wildly uneven brain still scores meaningfully.
  return Math.min(15, Math.round(stddev * 0.5));
}

export function brainBalanceScore(s: BrainStrengths): number {
  return Math.max(0, brainAverage(s) - brainImbalancePenalty(s));
}

export function findStrongestBrain(s: BrainStrengths): BrainKey {
  return BRAIN_KEYS.reduce(
    (best, k) => (s[k] > s[best] ? k : best),
    BRAIN_KEYS[0],
  );
}

export function findWeakestBrain(s: BrainStrengths): BrainKey {
  return BRAIN_KEYS.reduce(
    (worst, k) => (s[k] < s[worst] ? k : worst),
    BRAIN_KEYS[0],
  );
}

/* ─── Derive the legacy 4-char [L][E][R][C] DNA code from strengths ─── */

const BRAIN_TO_LAYER_LETTER: Record<BrainKey, string> = {
  visual: "V",
  language: "D",
  analysis: "B",
  pattern: "N",
  abstraction: "M",
  intake: "I",
  reflection: "R",
  application: "A",
  recall: "K",
};

/** Map 0-100 → A..Z (uppercase). 50 → ~M. */
function pctToUpperChar(pct: number): string {
  const v = clamp(pct);
  const idx = Math.min(25, Math.max(0, Math.round((v / 100) * 25)));
  return String.fromCharCode(65 + idx);
}

/** Map 0-100 → a..z (lowercase). */
function pctToLowerChar(pct: number): string {
  const v = clamp(pct);
  const idx = Math.min(25, Math.max(0, Math.round((v / 100) * 25)));
  return String.fromCharCode(97 + idx);
}

/** Map 0-100 → engagement digit 0-9 */
function pctToEngagementDigit(pct: number): number {
  const v = clamp(pct);
  return Math.min(9, Math.max(0, Math.round((v / 100) * 9)));
}

/** Derive the 4-character TJ DNA code from the new brain strengths. */
export function deriveDNACode(s: BrainStrengths): {
  code: string;
  layerLetter: string;
  engagementDigit: number;
  retentionChar: string;
  confidenceChar: string;
} {
  const dominant = findStrongestBrain(s);
  const layerLetter = BRAIN_TO_LAYER_LETTER[dominant];
  const engagementDigit = pctToEngagementDigit(s.engagement);
  const retentionChar = pctToUpperChar(s.retention);
  const confidenceChar = pctToLowerChar(s.confidence);
  return {
    code: `${layerLetter}${engagementDigit}${retentionChar}${confidenceChar}`,
    layerLetter,
    engagementDigit,
    retentionChar,
    confidenceChar,
  };
}

/* ─── Helpful summaries for UI ─── */

export interface BrainDelta {
  key: StrengthKey;
  before: number;
  after: number;
  delta: number;
}

export function diffStrengths(before: BrainStrengths, after: BrainStrengths): BrainDelta[] {
  const out: BrainDelta[] = [];
  for (const k of ALL_STRENGTH_KEYS) {
    const d = after[k] - before[k];
    if (d !== 0) out.push({ key: k, before: before[k], after: after[k], delta: d });
  }
  return out;
}
