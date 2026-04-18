import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MasteryStatus = "weak" | "improving" | "mastered";

export interface ReinforcementQuestion {
  microLesson: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  cycle: number;
  approach: string;
  difficulty: string;
}

export interface StruggleRow {
  id: string;
  term_id: string;
  incorrect_attempts: number;
  correct_attempts: number;
  reinforcement_cycles: number;
  mastery_status: MasteryStatus;
  last_attempted: string;
}

const MAX_CYCLES = 3;

export const useReinforcement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /** Record an incorrect attempt → bump struggle row → return updated cycle. */
  const recordIncorrect = useCallback(
    async (termId: string): Promise<number> => {
      if (!user || !termId) return 0;
      const { data: existing } = await (supabase as any)
        .from("term_struggle")
        .select("*")
        .eq("user_id", user.id)
        .eq("term_id", termId)
        .maybeSingle();

      const next = {
        user_id: user.id,
        term_id: termId,
        incorrect_attempts: (existing?.incorrect_attempts ?? 0) + 1,
        correct_attempts: existing?.correct_attempts ?? 0,
        reinforcement_cycles: (existing?.reinforcement_cycles ?? 0) + 1,
        mastery_status: "weak" as MasteryStatus,
        last_attempted: new Date().toISOString(),
      };
      await (supabase as any)
        .from("term_struggle")
        .upsert(next, { onConflict: "user_id,term_id" });

      return next.reinforcement_cycles;
    },
    [user],
  );

  /** Record a correct attempt → upgrade mastery status. */
  const recordCorrect = useCallback(
    async (termId: string, fromReinforcement = false): Promise<MasteryStatus> => {
      if (!user || !termId) return "weak";
      const { data: existing } = await (supabase as any)
        .from("term_struggle")
        .select("*")
        .eq("user_id", user.id)
        .eq("term_id", termId)
        .maybeSingle();

      const correctAttempts = (existing?.correct_attempts ?? 0) + 1;
      const incorrectAttempts = existing?.incorrect_attempts ?? 0;

      let mastery_status: MasteryStatus = "improving";
      if (incorrectAttempts === 0 && correctAttempts >= 1) mastery_status = "mastered";
      else if (correctAttempts >= 2 && correctAttempts >= incorrectAttempts) mastery_status = "mastered";
      else if (fromReinforcement) mastery_status = "improving";

      await (supabase as any)
        .from("term_struggle")
        .upsert(
          {
            user_id: user.id,
            term_id: termId,
            incorrect_attempts: incorrectAttempts,
            correct_attempts: correctAttempts,
            reinforcement_cycles: existing?.reinforcement_cycles ?? 0,
            mastery_status,
            last_attempted: new Date().toISOString(),
          },
          { onConflict: "user_id,term_id" },
        );
      return mastery_status;
    },
    [user],
  );

  /** Fetch a fresh micro-lesson + harder question for the missed concept. */
  const generateReinforcement = useCallback(
    async (input: {
      term: string;
      definition?: string;
      metaphor?: string;
      missedQuestion: string;
      missedAnswerExplanation?: string;
      cycle: number;
    }): Promise<ReinforcementQuestion | null> => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("reinforcement-loop", {
          body: input,
        });
        if (error) throw error;
        return data as ReinforcementQuestion;
      } catch (e) {
        console.error("[reinforcement] generation failed", e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /** Save a journal entry tied to a term. */
  const saveJournal = useCallback(
    async (entry: {
      term_id?: string | null;
      prompt_question: string;
      user_response: string;
      correctness?: boolean | null;
      reflection_type?: "quiz" | "activity" | "learning" | "reinforcement";
      topic?: string;
    }) => {
      if (!user) return;
      await (supabase as any).from("journal_entries").insert({
        user_id: user.id,
        term_id: entry.term_id ?? null,
        prompt_question: entry.prompt_question,
        user_response: entry.user_response,
        correctness: entry.correctness ?? null,
        reflection_type: entry.reflection_type ?? "learning",
        topic: entry.topic ?? "",
      });
    },
    [user],
  );

  return {
    loading,
    MAX_CYCLES,
    recordIncorrect,
    recordCorrect,
    generateReinforcement,
    saveJournal,
  };
};
