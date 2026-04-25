/* Learner Behavior Intake — Types
 *
 * Modular, rule-based layer that captures deeper learning behavior on every
 * stage submission. Sits beside (not inside) the TJ Engine. No AI calls.
 */

export type BehaviorMode = "teach" | "test";

export type ThinkingPath =
  | "visual"
  | "verbal"
  | "logical"
  | "story"
  | "kinesthetic";

export type ErrorType =
  | "none"
  | "misread"
  | "forgot"
  | "guessed"
  | "wrong_layer"
  | "partial";

export type CognitiveLoad = "low" | "medium" | "high";

export type MicroDecisionAction =
  | "hint_opened"
  | "tts_replayed"
  | "scrolled_past"
  | "skip_clicked"
  | "reread"
  | "image_zoomed"
  | "voice_input_used"
  | "reinforcement_opened";

export interface MicroDecision {
  action: MicroDecisionAction;
  ts: number;
}

/** In-memory draft held by the React hook for the active stage. */
export interface IntakeDraft {
  termId: string;
  stageId: string;
  startedAt: number;
  attemptNumber: number;
  mode: BehaviorMode;
  confidenceRating: number | null;
  thinkingPath: ThinkingPath | null;
  explainBackText: string;
  errorType: ErrorType;
  secondChanceUsed: boolean;
  secondChanceImproved: boolean;
  microDecisions: MicroDecision[];
  hintCount: number;
}

/** Final, derived snapshot persisted to learner_behavior_signals. */
export interface IntakeSnapshot {
  user_id: string;
  term_id: string;
  stage_id: string;
  attempt_number: number;
  mode: BehaviorMode;
  confidence_rating: number | null;
  explain_back_text: string;
  explain_back_word_count: number;
  thinking_path: ThinkingPath | null;
  error_type: ErrorType;
  second_chance_used: boolean;
  second_chance_improved: boolean;
  micro_decisions: MicroDecision[];
  layer_completion_integrity: number;
  breakdown_point: string | null;
  cognitive_load: CognitiveLoad;
  time_on_stage_ms: number;
}

/** Outcome of the TJ Engine for the same submission — read-only input
 *  the intake layer uses to derive integrity / breakdown / load. */
export interface StageOutcome {
  completionState: string; // 'complete' | 'incomplete' | 'needs_reinforcement' | ...
  attemptCount: number;
  accuracyScore: number;
  detectedStage?: string | null;
}

export interface BehaviorAggregate {
  avgConfidence: number;
  dominantThinkingPath: ThinkingPath | null;
  dominantBreakdown: string | null;
  prefersTeachMode: boolean;
  sampleSize: number;
}
