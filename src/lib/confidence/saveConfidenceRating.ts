import { supabase } from "@/integrations/supabase/client";
import {
  classifyUnderstanding,
  type ConfidenceRating,
  type UnderstandingStatus,
} from "./understanding";

export type ConfidenceSurface =
  | "section_quiz"
  | "pop_quiz"
  | "random_quiz"
  | "module_quiz"
  | "module_quiz_bank"
  | "pretest"
  | "posttest"
  | "final_exam"
  | "comprehensive_final"
  | "orb_assess"
  | "practice";

export interface SaveConfidenceArgs {
  userId: string;
  surface: ConfidenceSurface;
  questionRef?: string;
  questionText?: string;
  sectionId?: string | null;
  moduleId?: string | null;
  termId?: string | null;
  blockNumber?: number | null;
  isCorrect: boolean;
  confidence: ConfidenceRating;
}

/**
 * Save a confidence rating + derived understanding_status. Returns the status
 * so the caller can show inline feedback.
 */
export async function saveConfidenceRating(
  args: SaveConfidenceArgs
): Promise<UnderstandingStatus> {
  const status = classifyUnderstanding(args.isCorrect, args.confidence);
  try {
    await supabase.from("confidence_ratings").insert({
      user_id: args.userId,
      surface: args.surface,
      question_ref: args.questionRef ?? "",
      question_text: (args.questionText ?? "").slice(0, 1000),
      section_id: args.sectionId ?? null,
      module_id: args.moduleId ?? null,
      term_id: args.termId ?? null,
      block_number: args.blockNumber ?? null,
      is_correct: args.isCorrect,
      confidence_rating: args.confidence,
      understanding_status: status,
    });
  } catch (err) {
    // Non-blocking: even if storage fails the learner can keep going.
    console.error("[confidence] saveConfidenceRating failed", err);
  }
  return status;
}
