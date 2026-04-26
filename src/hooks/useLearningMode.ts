import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LearningMode = "teach" | "test";

interface UseLearningModeArgs {
  userId: string | null | undefined;
  termId: string | null | undefined;
  moduleId?: string | null;
  enabled?: boolean;
  defaultMode?: LearningMode;
}

interface ModeStatsRow {
  first_mode: LearningMode | null;
  preferred_mode: LearningMode | null;
  teach_mode_time: number;
  test_mode_time: number;
  teach_open_count: number;
  test_open_count: number;
  mode_switch_count: number;
  last_mode: LearningMode | null;
}

const dominantMode = (teach: number, test: number, fallback: LearningMode | null): LearningMode | null => {
  if (teach === 0 && test === 0) return fallback;
  if (teach === test) return fallback;
  return teach > test ? "teach" : "test";
};

/**
 * useLearningMode — Tracks the learner's Teach vs Test mode usage per term.
 *
 * - Records first_mode the first time a mode is chosen.
 * - Accumulates time spent in each mode (ms).
 * - Counts mode switches and per-mode opens.
 * - Recomputes preferred_mode (most-used) on every flush.
 * - Writes a learning_mode_events row on every switch.
 */
export function useLearningMode({
  userId,
  termId,
  moduleId,
  enabled = true,
  defaultMode = "teach",
}: UseLearningModeArgs) {
  const [mode, setModeState] = useState<LearningMode>(defaultMode);
  const [stats, setStats] = useState<ModeStatsRow | null>(null);

  const enteredAtRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);

  // Load stats + seed first_mode
  useEffect(() => {
    if (!enabled || !userId || !termId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("learning_mode_stats")
        .select(
          "first_mode, preferred_mode, teach_mode_time, test_mode_time, teach_open_count, test_open_count, mode_switch_count, last_mode"
        )
        .eq("user_id", userId)
        .eq("term_id", termId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setStats(data as ModeStatsRow);
        if (data.last_mode === "teach" || data.last_mode === "test") {
          setModeState(data.last_mode);
        }
      } else {
        // Seed row with first_mode
        const seed = {
          user_id: userId,
          term_id: termId,
          module_id: moduleId ?? null,
          first_mode: defaultMode,
          preferred_mode: defaultMode,
          teach_mode_time: 0,
          test_mode_time: 0,
          teach_open_count: defaultMode === "teach" ? 1 : 0,
          test_open_count: defaultMode === "test" ? 1 : 0,
          mode_switch_count: 0,
          last_mode: defaultMode,
        };
        const { data: inserted } = await supabase
          .from("learning_mode_stats")
          .insert(seed)
          .select(
            "first_mode, preferred_mode, teach_mode_time, test_mode_time, teach_open_count, test_open_count, mode_switch_count, last_mode"
          )
          .maybeSingle();
        if (!cancelled && inserted) setStats(inserted as ModeStatsRow);
      }

      initializedRef.current = true;
      enteredAtRef.current = Date.now();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, termId]);

  // Flush time and persist
  const flushAndPersist = useCallback(
    async (nextMode: LearningMode | null) => {
      if (!enabled || !userId || !termId || !initializedRef.current) return;

      const now = Date.now();
      const elapsed = Math.max(0, now - enteredAtRef.current);
      const previousMode = mode;
      enteredAtRef.current = now;

      const base = stats ?? {
        first_mode: previousMode,
        preferred_mode: previousMode,
        teach_mode_time: 0,
        test_mode_time: 0,
        teach_open_count: 0,
        test_open_count: 0,
        mode_switch_count: 0,
        last_mode: previousMode,
      };

      const newTeachTime = base.teach_mode_time + (previousMode === "teach" ? elapsed : 0);
      const newTestTime = base.test_mode_time + (previousMode === "test" ? elapsed : 0);
      const switching = nextMode !== null && nextMode !== previousMode;
      const newSwitchCount = base.mode_switch_count + (switching ? 1 : 0);
      const newTeachOpens = base.teach_open_count + (switching && nextMode === "teach" ? 1 : 0);
      const newTestOpens = base.test_open_count + (switching && nextMode === "test" ? 1 : 0);
      const resolvedNextMode = nextMode ?? previousMode;
      const newPreferred = dominantMode(newTeachTime, newTestTime, base.first_mode ?? resolvedNextMode);

      const updatePayload = {
        teach_mode_time: newTeachTime,
        test_mode_time: newTestTime,
        teach_open_count: newTeachOpens,
        test_open_count: newTestOpens,
        mode_switch_count: newSwitchCount,
        preferred_mode: newPreferred,
        last_mode: resolvedNextMode,
        updated_at: new Date().toISOString(),
      };

      setStats({
        first_mode: base.first_mode ?? previousMode,
        preferred_mode: newPreferred,
        teach_mode_time: newTeachTime,
        test_mode_time: newTestTime,
        teach_open_count: newTeachOpens,
        test_open_count: newTestOpens,
        mode_switch_count: newSwitchCount,
        last_mode: resolvedNextMode,
      });

      await supabase
        .from("learning_mode_stats")
        .update(updatePayload)
        .eq("user_id", userId)
        .eq("term_id", termId);

      if (switching) {
        await supabase.from("learning_mode_events").insert({
          user_id: userId,
          term_id: termId,
          module_id: moduleId ?? null,
          from_mode: previousMode,
          to_mode: resolvedNextMode,
          duration_ms: elapsed,
        });
      }
    },
    [enabled, userId, termId, moduleId, mode, stats]
  );

  const setMode = useCallback(
    (next: LearningMode) => {
      if (next === mode) return;
      void flushAndPersist(next);
      setModeState(next);
    },
    [mode, flushAndPersist]
  );

  // Periodic flush every 30s while open, plus on unmount.
  useEffect(() => {
    if (!enabled || !userId || !termId) return;
    const interval = window.setInterval(() => {
      void flushAndPersist(null);
    }, 30000);
    return () => {
      window.clearInterval(interval);
      void flushAndPersist(null);
    };
  }, [enabled, userId, termId, flushAndPersist]);

  return { mode, setMode, stats };
}
