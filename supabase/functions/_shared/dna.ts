// Shared DNA parsing + adaptation context builder for edge functions.
// Mirrors src/lib/dna/* to keep client and server in sync.

export type Trend = "increasing" | "stable" | "decreasing";

export interface AdaptationPayload {
  dnaCode?: string;
  // Optional V2 enrichment from client:
  learnerType?: string;
  dominantLayer?: string;
  weakestLayer?: string;
  engagementLevel?: number;
  retentionLevel?: "low" | "developing" | "strong";
  confidenceLevel?: "low" | "developing" | "high";
  trendSignals?: { engagement?: Trend; retention?: Trend; confidence?: Trend };
  recoveryMode?: boolean;
  finalDepthScore?: number;
}

export interface AdaptationInstructions {
  depthInstruction: string;
  toneInstruction: string;
  layerInstruction: string;
  trendInstruction: string;
  recoveryInstruction: string;
  fallback: "v1" | "v2";
}

function bucketRetention(c: string | undefined) {
  if (!c) return "developing" as const;
  const code = c.toUpperCase().charCodeAt(0);
  if (code <= 72) return "low" as const;
  if (code <= 81) return "developing" as const;
  return "strong" as const;
}

function bucketConfidence(c: string | undefined) {
  if (!c) return "developing" as const;
  const code = c.toLowerCase().charCodeAt(0);
  if (code <= 104) return "low" as const;
  if (code <= 113) return "developing" as const;
  return "high" as const;
}

const LAYER_INSTRUCTIONS: Record<string, string> = {
  V: "Use vivid spatial language and describe imagery the student can picture in their mind.",
  D: "Lead with crisp, plain-language definitions before any other framing.",
  M: "Anchor the lesson in a memorable analogy or metaphor from everyday life.",
  I: "Provide deep informational context and connect to related concepts.",
  R: "Invite reflection — ask the student to relate this to their own experience.",
  A: "Prioritize real-world cosmetology / professional application scenarios.",
  K: "Frame ideas as quiz-style checks to reinforce recall.",
  B: "Break terms apart etymologically — roots, prefixes, suffixes.",
  N: "Use recognition cues — match concepts to images or familiar patterns.",
  S: "Ground the explanation in scriptural or foundational reference texts when relevant.",
};

export function buildAdaptationInstructions(payload: AdaptationPayload): AdaptationInstructions {
  const { dnaCode, trendSignals = {}, recoveryMode } = payload;

  // Resolve raw signals: prefer client-supplied V2 fields; else parse dnaCode (V1).
  const engagement =
    typeof payload.engagementLevel === "number"
      ? payload.engagementLevel
      : dnaCode && dnaCode.length >= 2
        ? parseInt(dnaCode[1]) || 5
        : 5;

  const retention =
    payload.retentionLevel || bucketRetention(dnaCode?.[2]);
  const confidence =
    payload.confidenceLevel || bucketConfidence(dnaCode?.[3]);

  const fallback: "v1" | "v2" =
    payload.dominantLayer || payload.weakestLayer || payload.recoveryMode !== undefined
      ? "v2"
      : "v1";

  // Depth — use weighted score if provided
  let depthInstruction = "Use a standard explanation depth.";
  if (typeof payload.finalDepthScore === "number") {
    if (payload.finalDepthScore > 7)
      depthInstruction = "Provide DEEP, detailed explanations. Include connections to related concepts. Go beyond surface level.";
    else if (payload.finalDepthScore < 4)
      depthInstruction = "Keep explanations SHORT and SIMPLE. Use bullet points. Repeat key ideas. Add memory cues like mnemonics.";
  } else {
    if (retention === "low" || engagement <= 3)
      depthInstruction = "Keep explanations SHORT and SIMPLE. Use bullet points. Repeat key ideas. Add memory cues like mnemonics.";
    else if (retention === "strong" && engagement >= 7)
      depthInstruction = "Provide DEEP, detailed explanations. Include connections to related concepts. Go beyond surface level.";
  }

  // Tone — confidence + trend
  let toneInstruction = "Use a warm, supportive, confident tone.";
  if (confidence === "low") {
    toneInstruction = "Be EXTRA supportive and encouraging. Use phrases like 'You've got this' and 'One step at a time'. Break complex ideas into tiny pieces.";
  } else if (confidence === "high") {
    toneInstruction = "Be direct and challenging. Push the student to think deeper. Skip hand-holding.";
  }

  // Layer-specific instruction
  const layerLetter = (payload.dominantLayer || dnaCode?.[0] || "D").toUpperCase();
  const layerInstruction = LAYER_INSTRUCTIONS[layerLetter] || "";

  // Trend nudges
  const trendBits: string[] = [];
  if (trendSignals.confidence === "increasing") trendBits.push("Student's confidence is rising — push slightly harder.");
  if (trendSignals.confidence === "decreasing") trendBits.push("Student's confidence is dipping — be especially reassuring.");
  if (trendSignals.engagement === "decreasing") trendBits.push("Engagement is dropping — keep this VERY short and high-impact.");
  if (trendSignals.retention === "decreasing") trendBits.push("Retention is slipping — repeat key ideas and add memory cues.");
  const trendInstruction = trendBits.join(" ");

  // Recovery mode override
  let recoveryInstruction = "";
  if (recoveryMode) {
    recoveryInstruction =
      "RECOVERY MODE: This student is struggling. Override all other instructions. Be exceptionally gentle, slow, and supportive. Use the smallest possible steps. Repeat reassurance often. Avoid any challenging or fast-paced language.";
  }

  return {
    depthInstruction,
    toneInstruction,
    layerInstruction,
    trendInstruction,
    recoveryInstruction,
    fallback,
  };
}

export function composeSystemDirectives(i: AdaptationInstructions): string {
  return [
    i.depthInstruction,
    i.toneInstruction,
    i.layerInstruction,
    i.trendInstruction,
    i.recoveryInstruction,
  ]
    .filter(Boolean)
    .join("\n");
}
