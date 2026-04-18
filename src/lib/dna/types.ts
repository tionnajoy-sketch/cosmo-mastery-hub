/* ─── DNA V2 Types ─── */

export type LayerKey =
  | "visual"
  | "definition"
  | "metaphor"
  | "information"
  | "reflection"
  | "application"
  | "quiz"
  | "breakdown"
  | "recognize"
  | "scripture";

export type Trend = "increasing" | "stable" | "decreasing";

export type ContentDepth = "brief" | "standard" | "deep";
export type Difficulty = "guided" | "standard" | "challenge";
export type ToneModifier = "supportive" | "neutral" | "challenging";

export interface DNAProfileV1 {
  layerStrength: string;
  engagement: number;
  retention: "low" | "developing" | "strong";
  confidence: "low" | "developing" | "high";
  raw: string;
}

export type LayerScores = Partial<Record<LayerKey, number>>;

export interface BehaviorHistory {
  recentQuizzes: boolean[];          // last 10
  recentTimes: number[];             // last 10 (seconds)
  recentReflections: number[];       // last 10 (char length)
  recentLayerEvals: string[];        // last 3 evaluated dominant-layer candidates
}

export const EMPTY_BEHAVIOR_HISTORY: BehaviorHistory = {
  recentQuizzes: [],
  recentTimes: [],
  recentReflections: [],
  recentLayerEvals: [],
};

export interface DNAProfileV2 extends DNAProfileV1 {
  engagementTrend: Trend;
  retentionTrend: Trend;
  confidenceTrend: Trend;
  recoveryMode: boolean;
  layerScores: LayerScores;
  weakestLayer: string;
  finalDepthScore: number;
  engagementScore: number;   // normalized 0-9
  retentionScore: number;    // normalized 1-10
  confidenceScore: number;   // normalized 1-10
}

export interface AdaptationRules {
  stepOrder: string[];
  encouragement: string[];
  contentDepth: ContentDepth;
  difficulty: Difficulty;
  addMemoryCues: boolean;
  microSteps: boolean;
  toneModifier: ToneModifier;
}

export interface AdaptationContext extends AdaptationRules {
  recoveryMode: boolean;
  trendSignals: {
    engagement: Trend;
    retention: Trend;
    confidence: Trend;
  };
  dominantLayer: string;
  weakestLayer: string;
  finalDepthScore: number;
  fallbackToV1: boolean;
}

export interface DecisionEntry {
  field: string;
  value: string | number | boolean;
  reason: string;
}

export interface AdaptationDecisionLog {
  timestamp: number;
  decisions: DecisionEntry[];
}

export interface InteractionData {
  quizCorrect?: boolean;
  layerCompleted?: string;
  timeSpentSeconds?: number;
  reflectionLength?: number;
}
