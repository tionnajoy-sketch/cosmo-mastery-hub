import { useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/* ─── DNA Code Interpretation ─── */

export interface DNAProfile {
  layerStrength: string; // D, V, M, I, R, A, K
  engagement: number;    // 0-9
  retention: "low" | "developing" | "strong";
  confidence: "low" | "developing" | "high";
  raw: string;
}

export interface AdaptationRules {
  /** Reordered step keys — strongest layer first */
  stepOrder: string[];
  /** Encouragement messages to inject */
  encouragement: string[];
  /** Content depth: "brief" | "standard" | "deep" */
  contentDepth: "brief" | "standard" | "deep";
  /** Difficulty level for quizzes/apply */
  difficulty: "guided" | "standard" | "challenge";
  /** Whether to add memory cues */
  addMemoryCues: boolean;
  /** Whether to break content into smaller steps */
  microSteps: boolean;
  /** Caption modifier for the TJ voice */
  toneModifier: "supportive" | "neutral" | "challenging";
}

const DEFAULT_STEPS = ["breakdown", "definition", "visual", "metaphor", "information", "reflection", "application", "quiz"];

const LAYER_TO_STEP: Record<string, string> = {
  D: "definition",
  V: "visual",
  M: "metaphor",
  I: "information",
  R: "reflection",
  A: "application",
  K: "quiz",
};

function parseRetention(char: string | null): DNAProfile["retention"] {
  if (!char) return "developing";
  const code = char.toUpperCase().charCodeAt(0);
  if (code <= 72) return "low";       // A-H
  if (code <= 81) return "developing"; // I-Q
  return "strong";                     // R-Z
}

function parseConfidence(char: string | null): DNAProfile["confidence"] {
  if (!char) return "developing";
  const code = char.toLowerCase().charCodeAt(0);
  if (code <= 104) return "low";        // a-h
  if (code <= 113) return "developing"; // i-q
  return "high";                        // r-z
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

export function buildAdaptationRules(dna: DNAProfile | null): AdaptationRules {
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

  // 1. Reorder steps — put strongest layer earlier
  const preferredStep = LAYER_TO_STEP[dna.layerStrength] || "definition";
  const stepOrder = [
    "breakdown", // always first
    preferredStep,
    ...DEFAULT_STEPS.filter(s => s !== "breakdown" && s !== preferredStep),
  ];

  // 2. Confidence adaptations
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

  // 3. Retention adaptations
  let addMemoryCues = false;
  let contentDepth: AdaptationRules["contentDepth"] = "standard";

  if (dna.retention === "low") {
    addMemoryCues = true;
    contentDepth = "brief"; // shorter but more repetitive
    if (!encouragement.length) {
      encouragement.push("Let's review the key points one more time to lock them in.");
    }
  } else if (dna.retention === "strong") {
    contentDepth = "deep";
  }

  // 4. Engagement adaptations
  if (dna.engagement <= 3) {
    contentDepth = "brief";
    microSteps = true;
  } else if (dna.engagement >= 7) {
    if (contentDepth !== "brief") contentDepth = "deep";
  }

  return { stepOrder, encouragement, contentDepth, difficulty, addMemoryCues, microSteps, toneModifier };
}

/* ─── DNA Auto-Updater ─── */

interface InteractionData {
  quizCorrect?: boolean;
  layerCompleted?: string;
  timeSpentSeconds?: number;
  reflectionLength?: number;
}

export const useDNAAdaptation = () => {
  const { user, profile, refreshProfile } = useAuth();

  const dna = useMemo(() => parseDNACode(profile?.tj_dna_code || null), [profile?.tj_dna_code]);
  const rules = useMemo(() => buildAdaptationRules(dna), [dna]);

  const updateDNA = useCallback(async (interaction: InteractionData) => {
    if (!user || !profile) return;

    // Get current metrics
    let engagement = profile.dna_engagement ?? 5;
    let retentionChar = profile.dna_retention || "M";
    let confidenceChar = profile.dna_confidence || "m";
    let layerStrength = profile.dna_layer_strength || "D";

    // Adjust engagement (0-9) based on time and completion
    if (interaction.timeSpentSeconds !== undefined) {
      if (interaction.timeSpentSeconds > 60) engagement = Math.min(9, engagement + 1);
      else if (interaction.timeSpentSeconds < 10) engagement = Math.max(0, engagement - 1);
    }

    // Adjust retention based on quiz results
    if (interaction.quizCorrect !== undefined) {
      const retCode = retentionChar.toUpperCase().charCodeAt(0);
      if (interaction.quizCorrect) {
        const newCode = Math.min(90, retCode + 1); // move toward Z
        retentionChar = String.fromCharCode(newCode);
      } else {
        const newCode = Math.max(65, retCode - 1); // move toward A
        retentionChar = String.fromCharCode(newCode);
      }
    }

    // Adjust confidence based on reflection depth and quiz success
    if (interaction.reflectionLength !== undefined && interaction.reflectionLength > 50) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      const newCode = Math.min(122, confCode + 1); // move toward z
      confidenceChar = String.fromCharCode(newCode);
    }
    if (interaction.quizCorrect === true) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      const newCode = Math.min(122, confCode + 1);
      confidenceChar = String.fromCharCode(newCode);
    } else if (interaction.quizCorrect === false) {
      const confCode = confidenceChar.toLowerCase().charCodeAt(0);
      const newCode = Math.max(97, confCode - 1);
      confidenceChar = String.fromCharCode(newCode);
    }

    const newCode = `${layerStrength}${engagement}${retentionChar}${confidenceChar}`;
    
    if (newCode !== profile.tj_dna_code) {
      await supabase.from("profiles").update({
        tj_dna_code: newCode,
        dna_engagement: engagement,
        dna_retention: retentionChar,
        dna_confidence: confidenceChar,
        dna_layer_strength: layerStrength,
      }).eq("id", user.id);
      
      await refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  /** Get an encouragement message based on current DNA */
  const getEncouragement = useCallback((): string | null => {
    if (!rules.encouragement.length) return null;
    return rules.encouragement[Math.floor(Math.random() * rules.encouragement.length)];
  }, [rules.encouragement]);

  /** Get step caption modifier based on DNA */
  const getAdaptedCaption = useCallback((originalCaption: string, stepKey: string): string => {
    if (!dna) return originalCaption;

    if (rules.toneModifier === "supportive") {
      const prefixes: Record<string, string> = {
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

    if (rules.toneModifier === "challenging") {
      const prefixes: Record<string, string> = {
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
  }, [dna, rules.toneModifier]);

  return {
    dna,
    rules,
    updateDNA,
    getEncouragement,
    getAdaptedCaption,
  };
};
