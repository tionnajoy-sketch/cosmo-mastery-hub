import { useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildV2AdaptationContext,
  buildV2Profile,
  emitLog,
  shouldUseV1Fallback,
  v1RulesAsContext,
} from "@/lib/dna/adaptationEngine";
import {
  appendInteraction,
  appendLayerEval,
  ensureHistory,
} from "@/lib/dna/behaviorMemory";
import { applyLayerScoreDelta, evaluateDominantLayer } from "@/lib/dna/layerStrength";
import { readDNAStateFromProfile, persistDNA } from "@/lib/dna/storage";
import type {
  AdaptationContext,
  AdaptationRules,
  DNAProfileV2,
  InteractionData,
  LayerScores,
} from "@/lib/dna/types";

/* ─── DNA Code Interpretation (V1 — preserved exactly) ─── */

export interface DNAProfile {
  layerStrength: string;
  engagement: number;
  retention: "low" | "developing" | "strong";
  confidence: "low" | "developing" | "high";
  raw: string;
}

export type { AdaptationRules };

const DEFAULT_STEPS = ["visual", "definition", "scripture", "breakdown", "recognize", "metaphor", "information", "reflection", "application", "quiz"];

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

function parseRetention(char: string | null): DNAProfile["retention"] {
  if (!char) return "developing";
  const code = char.toUpperCase().charCodeAt(0);
  if (code <= 72) return "low";
  if (code <= 81) return "developing";
  return "strong";
}

function parseConfidence(char: string | null): DNAProfile["confidence"] {
  if (!char) return "developing";
  const code = char.toLowerCase().charCodeAt(0);
  if (code <= 104) return "low";
  if (code <= 113) return "developing";
  return "high";
}

export function parseDNACode(code: string | null): DNAProfile | null {
  if (!code || code.length < 4) return null;
  return {
    layerStrength: code[0].toUpperCase(),
    engagement: Math.min(9, Math.max(0, parseInt(code[1]) || 5)),
    retention: parseRetention(code[2]),
    confidence: parseConfidence(code[3]),
    raw: code,
  };
}

/** V1 rules — UNTOUCHED. Used as fallback when V2 history is empty. */
export function buildV1AdaptationRules(dna: DNAProfile | null): AdaptationRules {
  if (!dna) {
    return {
      stepOrder: DEFAULT_STEPS,
      encouragement: [],
      contentDepth: "standard",
      difficulty: "standard",
      addMemoryCues: false,
      microSteps: false,
      toneModifier: "neutral",
    };
  }

  const preferredStep = LAYER_TO_STEP[dna.layerStrength] || "definition";
  const stepOrder = [
    "breakdown",
    preferredStep,
    ...DEFAULT_STEPS.filter(s => s !== "breakdown" && s !== preferredStep),
  ];

  const encouragement: string[] = [];
  let difficulty: AdaptationRules["difficulty"] = "standard";
  let microSteps = false;
  let toneModifier: AdaptationRules["toneModifier"] = "neutral";

  if (dna.confidence === "low") {
    encouragement.push(
      "You're doing amazing — every step forward counts.",
      "Remember, understanding takes time. You've got this.",
      "I believe in you. Let's take this one step at a time.",
    );
    difficulty = "guided";
    microSteps = true;
    toneModifier = "supportive";
  } else if (dna.confidence === "high") {
    difficulty = "challenge";
    toneModifier = "challenging";
  }

  let addMemoryCues = false;
  let contentDepth: AdaptationRules["contentDepth"] = "standard";

  if (dna.retention === "low") {
    addMemoryCues = true;
    contentDepth = "brief";
    if (!encouragement.length) {
      encouragement.push("Let's review the key points one more time to lock them in.");
    }
  } else if (dna.retention === "strong") {
    contentDepth = "deep";
  }

  if (dna.engagement <= 3) {
    contentDepth = "brief";
    microSteps = true;
  } else if (dna.engagement >= 7) {
    if (contentDepth !== "brief") contentDepth = "deep";
  }

  return { stepOrder, encouragement, contentDepth, difficulty, addMemoryCues, microSteps, toneModifier };
}

/** Backward-compat alias — existing imports keep working. */
export const buildAdaptationRules = buildV1AdaptationRules;

/* ─── Hook ─── */

export const useDNAAdaptation = () => {
  const { user, profile, refreshProfile } = useAuth();

  const dna = useMemo(() => parseDNACode(profile?.tj_dna_code || null), [profile?.tj_dna_code]);

  // V1 rules — preserved
  const rules: AdaptationRules = useMemo(() => buildV1AdaptationRules(dna), [dna]);

  // V2 state from profile
  const v2State = useMemo(() => readDNAStateFromProfile(profile), [profile]);

  const v2Profile: DNAProfileV2 | null = useMemo(() => {
    if (!dna) return null;
    return buildV2Profile(dna, v2State.layerScores, v2State.behaviorHistory);
  }, [dna, v2State]);

  // Adaptation context — V2 if data exists, else V1 fallback
  const context: AdaptationContext = useMemo(() => {
    if (!dna) return v1RulesAsContext(rules, { layerStrength: "D", engagement: 5, retention: "developing", confidence: "developing", raw: "" });
    if (shouldUseV1Fallback(v2State.layerScores, v2State.behaviorHistory) || !v2Profile) {
      const ctx = v1RulesAsContext(rules, dna);
      emitLog({ timestamp: Date.now(), decisions: [{ field: "fallback", value: "v1", reason: "behaviorHistory + layerScores empty" }] });
      return ctx;
    }
    const { context: ctx, log } = buildV2AdaptationContext(v2Profile, v2State.behaviorHistory);
    emitLog(log);
    return ctx;
  }, [dna, v2Profile, v2State, rules]);

  const updateDNA = useCallback(async (interaction: InteractionData) => {
    if (!user || !profile) return;

    let engagement = (profile as any).dna_engagement ?? 5;
    let retentionChar = (profile as any).dna_retention || "M";
    let confidenceChar = (profile as any).dna_confidence || "m";
    let layerStrength = (profile as any).dna_layer_strength || "D";

    /* ── V1 LERC drift (preserved) ── */
    if (interaction.timeSpentSeconds !== undefined) {
      if (interaction.timeSpentSeconds > 60) engagement = Math.min(9, engagement + 1);
      else if (interaction.timeSpentSeconds < 10) engagement = Math.max(0, engagement - 1);
    }

    if (interaction.quizCorrect !== undefined) {
      const retCode = retentionChar.toUpperCase().charCodeAt(0);
      if (interaction.quizCorrect) {
        retentionChar = String.fromCharCode(Math.min(90, retCode + 1));
      } else {
        retentionChar = String.fromCharCode(Math.max(65, retCode - 1));
      }
    }

    if (interaction.reflectionLength !== undefined && interaction.reflectionLength > 50) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      confidenceChar = String.fromCharCode(Math.min(122, confCode + 1));
    }
    if (interaction.quizCorrect === true) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      confidenceChar = String.fromCharCode(Math.min(122, confCode + 1));
    } else if (interaction.quizCorrect === false) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      confidenceChar = String.fromCharCode(Math.max(97, confCode - 1));
    }

    /* ── V2: layer scores + behavior history ── */
    let layerScores: LayerScores = { ...v2State.layerScores };
    let behaviorHistory = ensureHistory(v2State.behaviorHistory);

    behaviorHistory = appendInteraction(behaviorHistory, interaction);

    if (interaction.layerCompleted) {
      let delta = 0;
      if (interaction.quizCorrect === true) delta += 2;
      if (interaction.quizCorrect === false) delta -= 1;
      if (interaction.timeSpentSeconds !== undefined) {
        if (interaction.timeSpentSeconds > 30) delta += 1;
        if (interaction.timeSpentSeconds < 10) delta -= 1;
      }
      if (delta !== 0) {
        layerScores = applyLayerScoreDelta(layerScores, interaction.layerCompleted, delta);
      }
    }

    // Evaluate dominant layer with stability gates
    const evalRes = evaluateDominantLayer(layerScores, layerStrength, behaviorHistory.recentLayerEvals);
    if (evalRes.candidate) {
      behaviorHistory = appendLayerEval(behaviorHistory, evalRes.candidate);
    }
    if (evalRes.shouldUpdate) {
      layerStrength = evalRes.newLayerLetter;
      // eslint-disable-next-line no-console
      console.debug("[DNA] dominant layer updated:", evalRes.reason);
    } else if (evalRes.candidate && evalRes.candidate !== layerStrength) {
      // eslint-disable-next-line no-console
      console.debug("[DNA] dominant layer hold:", evalRes.reason);
    }

    const newCode = `${layerStrength}${engagement}${retentionChar}${confidenceChar}`;

    const codeChanged = newCode !== profile.tj_dna_code;
    const stateChanged = true; // history/scores typically change on any interaction

    if (codeChanged || stateChanged) {
      await persistDNA({
        userId: user.id,
        tj_dna_code: codeChanged ? newCode : undefined,
        dna_engagement: engagement,
        dna_retention: retentionChar,
        dna_confidence: confidenceChar,
        dna_layer_strength: layerStrength,
        layer_scores: layerScores,
        behavior_history: behaviorHistory,
      });
      await refreshProfile();
    }
  }, [user, profile, refreshProfile, v2State]);

  const getEncouragement = useCallback((): string | null => {
    const pool = context.encouragement.length ? context.encouragement : rules.encouragement;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [context.encouragement, rules.encouragement]);

  const getAdaptedCaption = useCallback((originalCaption: string, stepKey: string): string => {
    if (!dna) return originalCaption;
    const tone = context.toneModifier;

    if (tone === "supportive") {
      const prefixes: Record<string, string> = {
        breakdown: "Take your time with this — we'll go step by step…",
        definition: "Take your time with this — we'll go step by step…",
        visual: "Pictures help a lot — let's see it together…",
        metaphor: "I love this part — let me tell you a story…",
        information: "No rush — let me walk you through this gently…",
        reflection: "You're safe here. Share what comes to mind…",
        application: "Let's try this together. I'll guide you…",
        quiz: "You've prepared for this. Trust yourself…",
      };
      return prefixes[stepKey] || originalCaption;
    }

    if (tone === "challenging") {
      const prefixes: Record<string, string> = {
        breakdown: "You probably know this already — prove it.",
        definition: "You probably know this already — prove it.",
        visual: "Quick scan — what patterns do you see?",
        metaphor: "Think beyond the surface — what's the real connection?",
        information: "Deep dive time — push your understanding further.",
        reflection: "Go deeper. What does this really reveal about you?",
        application: "Here's a tough one — show me what you've got.",
        quiz: "No hints this time. You're ready for the real thing.",
      };
      return prefixes[stepKey] || originalCaption;
    }

    return originalCaption;
  }, [dna, context.toneModifier]);

  return {
    dna,
    rules,            // V1 (preserved)
    context,          // V2 enriched (or V1 fallback)
    v2Profile,        // V2 profile if available
    updateDNA,
    getEncouragement,
    getAdaptedCaption,
  };
};
