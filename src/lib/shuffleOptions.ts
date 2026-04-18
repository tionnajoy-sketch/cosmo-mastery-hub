/**
 * Deterministic option shuffler.
 * Given a stable seed (e.g., question id), returns a consistent shuffled order
 * across re-renders within a session — but truly randomized vs the source order
 * so the correct answer is not always at the same letter.
 */

export interface ShuffledOption {
  /** Display letter after shuffle (A/B/C/D) */
  letter: string;
  /** Original letter before shuffle */
  originalLetter: string;
  /** Option text */
  text: string;
  /** True if this is the correct answer */
  isCorrect: boolean;
}

export interface ShuffleResult {
  options: ShuffledOption[];
  /** New letter (A/B/C/D) where the correct answer now sits */
  correctLetter: string;
}

/* Tiny seeded PRNG (Mulberry32) */
const seededRandom = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const hashString = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
};

/**
 * Shuffle 4 options keyed by A/B/C/D.
 * @param raw      Map of original letter → text
 * @param correct  Original correct letter
 * @param seed     Stable string (e.g. question.id) to keep order consistent
 */
export const shuffleOptions = (
  raw: { A: string; B: string; C: string; D: string },
  correct: string,
  seed: string,
): ShuffleResult => {
  const original: Array<{ originalLetter: string; text: string; isCorrect: boolean }> = [
    { originalLetter: "A", text: raw.A, isCorrect: correct === "A" },
    { originalLetter: "B", text: raw.B, isCorrect: correct === "B" },
    { originalLetter: "C", text: raw.C, isCorrect: correct === "C" },
    { originalLetter: "D", text: raw.D, isCorrect: correct === "D" },
  ];

  const rand = seededRandom(hashString(seed || "fallback"));
  // Fisher-Yates with seeded PRNG
  for (let i = original.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [original[i], original[j]] = [original[j], original[i]];
  }

  const letters = ["A", "B", "C", "D"];
  const options: ShuffledOption[] = original.map((o, i) => ({
    letter: letters[i],
    originalLetter: o.originalLetter,
    text: o.text,
    isCorrect: o.isCorrect,
  }));

  const correctLetter = options.find((o) => o.isCorrect)?.letter || "A";
  return { options, correctLetter };
};
