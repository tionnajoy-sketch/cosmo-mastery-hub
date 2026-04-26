/* useMicroDecisions — silent, page-scoped tracker.
 *
 * - Detects fast-click bursts and long pauses on the active term/step.
 * - Exposes simple `track*` helpers the LearningOrbDialog can call inline.
 * - Never blocks the UI; all DB writes are fire-and-forget.
 */

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  recordMicroEvent,
  recordAndEvaluate,
  recordShowAnswer,
  setMicroFlag,
  THRESHOLDS,
  type MicroAction,
} from "@/lib/micro-decisions";

interface Args {
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  /** Current step / surface label for context (e.g. "quiz", "reflection"). */
  surface?: string;
}

export function useMicroDecisions({ termId, moduleId, blockNumber, surface }: Args) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Fast-click detection: rolling window of recent click timestamps.
  const clickWindowRef = useRef<number[]>([]);
  // Long-pause detection: timer reset on each tracked interaction.
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks when the current question/quiz first rendered, for fast-reveal.
  const questionShownAtRef = useRef<number | null>(null);

  const baseCtx = {
    userId: userId!,
    termId: termId ?? null,
    moduleId: moduleId ?? null,
    blockNumber: blockNumber ?? null,
    surface: surface ?? "",
  };

  // ----- Long-pause watcher -----
  const armPauseTimer = useCallback(() => {
    if (!userId || !termId) return;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      void recordMicroEvent({
        userId,
        termId,
        moduleId: moduleId ?? null,
        blockNumber: blockNumber ?? null,
        surface: surface ?? "",
        action: "long_pause",
        timeOnSurfaceMs: THRESHOLDS.longPauseMs,
      });
      void setMicroFlag({ userId, termId: null, flag: "long_pause_pattern" });
    }, THRESHOLDS.longPauseMs);
  }, [userId, termId, moduleId, blockNumber, surface]);

  useEffect(() => {
    if (!userId || !termId) return;
    armPauseTimer();
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [userId, termId, surface, armPauseTimer]);

  // ----- Generic click tracker (also feeds fast-click pattern) -----
  const trackClick = useCallback(() => {
    if (!userId) return;
    armPauseTimer();
    const now = Date.now();
    const window = clickWindowRef.current.filter(
      (t) => now - t < THRESHOLDS.fastClickWindowMs,
    );
    window.push(now);
    clickWindowRef.current = window;
    if (window.length >= THRESHOLDS.fastClickCount) {
      clickWindowRef.current = []; // reset to avoid spam
      void recordMicroEvent({
        ...baseCtx,
        action: "fast_click",
        metadata: { burst_size: window.length },
      });
      void setMicroFlag({ userId, termId: null, flag: "fast_clicking_pattern" });
    }
  }, [userId, armPauseTimer, baseCtx]);

  // ----- Question/quiz fast-reveal helpers -----
  const markQuestionShown = useCallback(() => {
    questionShownAtRef.current = Date.now();
  }, []);

  const trackShowAnswer = useCallback(async () => {
    if (!userId) return;
    armPauseTimer();
    const ms = questionShownAtRef.current
      ? Date.now() - questionShownAtRef.current
      : Number.MAX_SAFE_INTEGER;
    await recordShowAnswer({
      userId,
      termId: termId ?? null,
      moduleId: moduleId ?? null,
      blockNumber: blockNumber ?? null,
      surface: surface ?? "quiz",
      msSinceQuestionShown: ms,
    });
  }, [userId, termId, moduleId, blockNumber, surface, armPauseTimer]);

  // ----- Skip / repeat-pick / quiz-avoid trackers -----
  const trackAction = useCallback(
    async (action: MicroAction, metadata?: Record<string, unknown>) => {
      if (!userId) return;
      armPauseTimer();
      await recordAndEvaluate({
        ...baseCtx,
        action,
        metadata,
      });
    },
    [userId, armPauseTimer, baseCtx],
  );

  return {
    /** Wire to clickable controls to feed fast-click + reset pause. */
    trackClick,
    /** Call when a quiz/practice question first renders. */
    markQuestionShown,
    /** Call when learner reveals the answer (any path). */
    trackShowAnswer,
    /** Generic action tracker — handles threshold → flag promotion. */
    trackAction,
  };
}

export type UseMicroDecisionsResult = ReturnType<typeof useMicroDecisions>;
