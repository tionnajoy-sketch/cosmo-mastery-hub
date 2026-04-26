import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ExplainTrigger = "definition" | "guided_lesson" | "missed_question";
export type FollowUpAction =
  | "understand"
  | "need_explanation"
  | "want_visual"
  | "want_metaphor";

export interface SaveArgs {
  response: string;
  followUp?: FollowUpAction | null;
  skipped?: boolean;
}

export interface SaveResult {
  saved: boolean;
  skipCount: number;
  flag: "avoids explanation" | null;
  recommendation: "guided_lesson" | null;
}

interface Options {
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  trigger: ExplainTrigger;
  contextRef?: string;
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function useExplainItBack(opts: Options) {
  const { user } = useAuth();
  const [skipCount, setSkipCount] = useState(0);
  const [flag, setFlag] = useState<"avoids explanation" | null>(null);

  // Pull recent skip history for this user + term
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id || !opts.termId) return;
      const { data } = await supabase
        .from("explain_it_back_responses")
        .select("skipped, learning_behavior_flag")
        .eq("user_id", user.id)
        .eq("term_id", opts.termId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled || !data) return;
      const skips = data.filter((r) => r.skipped).length;
      setSkipCount(skips);
      const existingFlag = data.find((r) => r.learning_behavior_flag)?.learning_behavior_flag;
      if (existingFlag === "avoids explanation") setFlag("avoids explanation");
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, opts.termId]);

  const save = useCallback(
    async ({ response, followUp = null, skipped = false }: SaveArgs): Promise<SaveResult> => {
      if (!user?.id) {
        return { saved: false, skipCount, flag, recommendation: null };
      }
      const nextSkipCount = skipped ? skipCount + 1 : skipCount;
      const newFlag: "avoids explanation" | null =
        nextSkipCount >= 2 ? "avoids explanation" : flag;
      const recommendation: "guided_lesson" | null =
        newFlag === "avoids explanation" ? "guided_lesson" : null;

      const { error } = await supabase.from("explain_it_back_responses").insert({
        user_id: user.id,
        term_id: opts.termId ?? null,
        module_id: opts.moduleId ?? null,
        block_number: opts.blockNumber ?? null,
        trigger_source: opts.trigger,
        context_ref: opts.contextRef ?? "",
        explain_it_back_response: skipped ? "" : response,
        word_count: skipped ? 0 : wordCount(response),
        follow_up_action: followUp,
        skipped,
        learning_behavior_flag: newFlag,
      });

      if (!error) {
        if (skipped) setSkipCount(nextSkipCount);
        if (newFlag) setFlag(newFlag);
      }

      return {
        saved: !error,
        skipCount: nextSkipCount,
        flag: newFlag,
        recommendation,
      };
    },
    [user?.id, opts.termId, opts.moduleId, opts.blockNumber, opts.trigger, opts.contextRef, skipCount, flag]
  );

  return { save, skipCount, flag };
}
