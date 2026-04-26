import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Learner {
  id: string;
  user_id: string;
  display_name: string;
  cohort: string;
  learning_goal: string;
}

/**
 * Loads or auto-creates the learner row for the current authenticated user.
 * The LMS routes are wrapped in ProtectedRoute, so a session is guaranteed.
 */
export function useLearner() {
  const { user, profile } = useAuth();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function ensureLearner() {
      if (!user) return;
      setLoading(true);

      const { data: existing } = await supabase
        .from("learners")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        if (!cancelled) setLearner(existing as Learner);
      } else {
        const { data: created } = await supabase
          .from("learners")
          .insert({
            user_id: user.id,
            display_name: profile?.name || "Learner",
          })
          .select()
          .single();
        if (!cancelled && created) setLearner(created as Learner);
      }
      if (!cancelled) setLoading(false);
    }
    ensureLearner();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.name]);

  return { learner, loading };
}
