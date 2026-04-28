/* TJ Learning Intelligence Engine — Public types */

export interface OverviewMetrics {
  studyStreak: number;          // consecutive days with activity
  termsCompleted: number;       // mastered or 8+ layers
  totalTerms: number;
  weakestTopic: string;         // section name
  strongestTopic: string;       // section name
  confidenceScore: number;      // 0-100
  retentionScore: number;       // 0-100
  passReadiness: number;        // 0-100 weighted
  todaysFocus: string;          // do-this-now headline
}

export type LayerKey =
  | "visualize" | "define" | "breakdown" | "recognize"
  | "metaphor" | "information" | "reflect" | "apply" | "assess";

export interface LayerBreakdown {
  layer: LayerKey;
  label: string;
  completionPct: number;   // 0-100
  performance: number;     // 0-100
  count: number;
}

export interface DnaProfileSummary {
  preferredLayer: string;
  strongestStyle: string;
  weakestStyle: string;
  confidenceState: "low" | "developing" | "high";
  retentionState: "low" | "developing" | "strong";
  recommendedNext: string;
}

export interface DoThisNowAction {
  headline: string;
  detail: string;
  cta: string;
  route?: string;
  termId?: string;
}

export interface IntelligenceSnapshot {
  overview: OverviewMetrics;
  breakdown: LayerBreakdown[];
  dna: DnaProfileSummary;
  action: DoThisNowAction;
  loading: boolean;
}
