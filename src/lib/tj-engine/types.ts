/* ───────────────────────────────────────────────────────────────────
 * TJ Engine — Core Types
 *
 * The TJ Engine is a structured rules engine that governs the entire
 * learning experience. It enforces the TJ Anderson Layer Method™
 * across every term, response, upload, quiz, and reflection.
 *
 * AI assists. The Engine governs.
 * ─────────────────────────────────────────────────────────────────── */

import type { BrainKey, SignalKey, StrengthKey } from "@/lib/dna/brainStrengths";

/** All 10 stages enforced by the engine (9 layers + Recall Reconstruction). */
export type StageId =
  | "visualize"
  | "define"
  | "breakdown"
  | "recall_reconstruction"
  | "recognize"
  | "metaphor"
  | "information"
  | "reflection"
  | "application"
  | "assess";

export type CompletionState =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "incomplete"
  | "needs_reinforcement"
  | "complete";

export type ContentType =
  | "image"
  | "text"
  | "morphology"
  | "fill_blank"
  | "interactive"
  | "analogy"
  | "expanded_text"
  | "prompt"
  | "scenario"
  | "quiz";

export type StudentInputType =
  | "none"
  | "typed_text"
  | "voice"
  | "fill_blank"
  | "multiple_choice"
  | "selection"
  | "interactive";

export type NextActionType =
  | "advance"
  | "stay"
  | "review"
  | "practice"
  | "strengthen_layer"
  | "complete_term";

/** Structured content object every stage must conform to (per spec). */
export interface StageDefinition {
  stage_id: StageId;
  stage_name: string;
  title: string;
  purpose: string;
  content_type: ContentType;
  content_body: string;
  student_input_type: StudentInputType;
  feedback_logic: string;
  completion_state: CompletionState;
  unlock_requirement: string;
  dna_metric_updated: StrengthKey;
  brain_balance_metric_updated: BrainKey;
  next_action_logic: string;
}

export interface BreakItDownContent {
  prefix: string;
  root: string;
  suffix: string;
  literal_meaning: string;
  concept_meaning: string;
  related_word_family: string[];
  pronunciation?: string;
  memory_hook: string;
  practice_prompt: string;
}

/* ─── Rule Repository shape ─── */

export type RuleType =
  | "stage_mapping"
  | "feedback"
  | "completion"
  | "unlock"
  | "dna_update"
  | "brain_balance"
  | "reinforcement"
  | "stage_definition";

export interface StageMappingRule {
  stage: StageId;
  /** Lowercased keyword/phrase patterns that signal this stage */
  patterns: string[];
  /** Higher = stronger signal */
  weight: number;
}

export interface FeedbackTemplate {
  stage: StageId;
  what_you_understood: string;
  what_is_incomplete: string;
  what_layer_is_missing: string;
  why_this_step_matters: string;
  what_to_do_next: string;
}

export interface UnlockRule {
  stage: StageId;
  requires_completed: StageId[];
  /** If set, the student needs at least this accuracy on the prereq */
  min_accuracy?: number;
}

export interface CompletionRule {
  stage: StageId;
  /** Minimum length / quality to mark a typed response complete */
  min_chars?: number;
  /** Minimum required keyword hits from the stage's mapping rule */
  min_keyword_hits?: number;
  /** Minimum quiz/recall accuracy (%) */
  min_accuracy?: number;
}

export interface ReinforcementRule {
  stage: StageId;
  /** Trigger if attempt_count exceeds N without completion */
  trigger_after_attempts: number;
  /** Trigger if accuracy below N% */
  trigger_below_accuracy?: number;
  focus_shift: string;
  reteach_summary: string;
  memory_cue: string;
  micro_check: string;
}

export interface DNAUpdateRule {
  stage: StageId;
  brain_key: BrainKey;
  brain_delta_complete: number;
  brain_delta_attempt: number;
  signal_delta?: Partial<Record<SignalKey, number>>;
}

/* ─── Submission Interpreter ─── */

export interface InterpretedSubmission {
  detected_stage: StageId;
  stage_confidence: number; // 0-1
  matched_patterns: Record<StageId, string[]>;
  is_complete: boolean;
  missing_signals: StageId[];
  raw_text: string;
  word_count: number;
}

/* ─── Engine output ─── */

export interface TJFeedback {
  what_you_understood: string;
  what_is_incomplete: string;
  what_layer_is_missing: string;
  why_this_step_matters: string;
  what_to_do_next: string;
}

export interface ProgressDecision {
  next_action: NextActionType;
  reason: string;
  trigger_reinforcement: boolean;
  reinforcement?: ReinforcementRule;
  unlock_next_stage?: StageId;
  completion_state: CompletionState;
}

export interface EngineEvaluation {
  stage_id: StageId;
  interpretation: InterpretedSubmission;
  feedback: TJFeedback;
  decision: ProgressDecision;
  dna_update: {
    brain_key: BrainKey;
    brain_delta: number;
    signal_delta: Partial<Record<SignalKey, number>>;
  };
}

/* ─── Upload pipeline ─── */

export interface ExtractedTermDraft {
  term_title: string;
  raw_definition: string;
  source_excerpt: string;
  stages: Partial<Record<StageId, string>>;
}
