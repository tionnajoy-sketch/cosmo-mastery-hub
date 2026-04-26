import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  RECOVERY_EVENT,
  emitRecoveryChange,
  logRecoveryEntry,
  logRecoveryExit,
  type RecoveryEventDetail,
  type RecoveryTrigger,
  type RecoveryExitReason,
} from "@/lib/recovery-mode";
import { RHYTHM_EVENT, type LearningRhythmState, emitRhythmChange } from "@/lib/learning-rhythm";
import { CYCLE_EVENT, type CycleStage } from "@/lib/learning-cycle";

interface RecoveryContextValue {
  active: boolean;
  trigger: RecoveryTrigger | null;
  enter: (trigger: RecoveryTrigger, ctx?: { termId?: string | null; moduleId?: string | null; sessionId?: string }) => void;
  exit: (reason: RecoveryExitReason, ctx?: { termId?: string | null; moduleId?: string | null; sessionId?: string }) => void;
}

const RecoveryContext = createContext<RecoveryContextValue | null>(null);

export const RecoveryModeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [trigger, setTrigger] = useState<RecoveryTrigger | null>(null);
  // Last-known context so global rhythm/cycle listeners can persist with sane defaults.
  const lastCtxRef = useRef<{ termId?: string | null; moduleId?: string | null; sessionId?: string }>({});

  const enter = useCallback<RecoveryContextValue["enter"]>((t, ctx) => {
    if (ctx) lastCtxRef.current = { ...lastCtxRef.current, ...ctx };
    setActive((wasActive) => {
      if (wasActive) return true;
      setTrigger(t);
      emitRecoveryChange({ active: true, trigger: t });
      if (user?.id) {
        logRecoveryEntry({
          userId: user.id,
          termId: lastCtxRef.current.termId ?? null,
          moduleId: lastCtxRef.current.moduleId ?? null,
          sessionId: lastCtxRef.current.sessionId ?? "",
          trigger: t,
        });
      }
      return true;
    });
  }, [user?.id]);

  const exit = useCallback<RecoveryContextValue["exit"]>((reason, ctx) => {
    if (ctx) lastCtxRef.current = { ...lastCtxRef.current, ...ctx };
    setActive((wasActive) => {
      if (!wasActive) return false;
      setTrigger(null);
      emitRecoveryChange({ active: false, exitReason: reason });
      if (user?.id) {
        logRecoveryExit({
          userId: user.id,
          termId: lastCtxRef.current.termId ?? null,
          moduleId: lastCtxRef.current.moduleId ?? null,
          sessionId: lastCtxRef.current.sessionId ?? "",
          reason,
        });
      }
      // On a correct answer, also flip rhythm to "recovering" per spec.
      if (reason === "correct_answer") {
        try { emitRhythmChange("recovering"); } catch {}
      }
      return false;
    });
  }, [user?.id]);

  // Listen to rhythm + cycle changes globally so Recovery Mode can auto-arm
  // even from surfaces that don't import the context directly.
  useEffect(() => {
    const onRhythm = (e: Event) => {
      const next = (e as CustomEvent)?.detail?.state as LearningRhythmState | undefined;
      if (next === "overwhelmed") enter("rhythm_overwhelmed");
    };
    const onCycle = (e: Event) => {
      const next = (e as CustomEvent)?.detail?.stage as CycleStage | undefined;
      if (next === "reset") enter("cycle_reset");
    };
    window.addEventListener(RHYTHM_EVENT, onRhythm);
    window.addEventListener(CYCLE_EVENT, onCycle);
    return () => {
      window.removeEventListener(RHYTHM_EVENT, onRhythm);
      window.removeEventListener(CYCLE_EVENT, onCycle);
    };
  }, [enter]);

  // Optional: keep external listeners in sync if some other surface dispatches RECOVERY_EVENT.
  useEffect(() => {
    const onExternal = (e: Event) => {
      const detail = (e as CustomEvent)?.detail as RecoveryEventDetail | undefined;
      if (!detail) return;
      // Don't re-emit; just sync local state if needed.
      setActive((curr) => (curr === detail.active ? curr : detail.active));
      if (detail.active && detail.trigger) setTrigger(detail.trigger);
      if (!detail.active) setTrigger(null);
    };
    window.addEventListener(RECOVERY_EVENT, onExternal);
    return () => window.removeEventListener(RECOVERY_EVENT, onExternal);
  }, []);

  const value = useMemo<RecoveryContextValue>(() => ({ active, trigger, enter, exit }), [active, trigger, enter, exit]);
  return <RecoveryContext.Provider value={value}>{children}</RecoveryContext.Provider>;
};

export const useRecoveryMode = () => {
  const ctx = useContext(RecoveryContext);
  if (!ctx) throw new Error("useRecoveryMode must be used inside <RecoveryModeProvider>");
  return ctx;
};
