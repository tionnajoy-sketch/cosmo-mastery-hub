import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  EMPTY_BUCKETS,
  SESSION_BALANCE_REPROMPT_MS,
  SESSION_BALANCE_THRESHOLD_MS,
  bucketForStepKey,
  persistSessionBalance,
  type ActiveSurface,
  type SessionBalanceChoice,
  type SessionBalanceFlag,
  type TimeBuckets,
} from "@/lib/session-balance";

interface SessionBalanceContextValue {
  buckets: TimeBuckets;
  activeSurface: ActiveSurface;
  ignoreCount: number;
  promptOpen: boolean;
  setActiveSurface: (s: ActiveSurface) => void;
  setActiveSurfaceFromStepKey: (key: string | null | undefined) => void;
  recordChoice: (choice: SessionBalanceChoice) => void;
  dismissPrompt: () => void;
}

const SessionBalanceContext = createContext<SessionBalanceContextValue | null>(null);

const TICK_MS = 5_000; // 5s heartbeat — coarse enough to be cheap, fine enough to be honest.
const SESSION_KEY = "tj_session_balance_id";

const getBalanceSessionId = (): string => {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = `sb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return `sb_${Date.now()}`;
  }
};

export const SessionBalanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<TimeBuckets>(EMPTY_BUCKETS);
  const [activeSurface, setActiveSurfaceState] = useState<ActiveSurface>("idle");
  const [ignoreCount, setIgnoreCount] = useState(0);
  const [promptOpen, setPromptOpen] = useState(false);
  const [lastPromptAt, setLastPromptAt] = useState<number>(0);

  const sessionIdRef = useRef<string>(getBalanceSessionId());
  const lastTickRef = useRef<number>(Date.now());
  const visibleRef = useRef<boolean>(typeof document !== "undefined" ? !document.hidden : true);

  // Track tab visibility so we don't accumulate time when the tab is hidden.
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
      // Reset the tick anchor so the next tick doesn't count the away time.
      lastTickRef.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Heartbeat: every TICK_MS, attribute elapsed wall time to the current bucket.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      if (!visibleRef.current) return;
      if (activeSurface === "idle") return;
      // Guard against laptop sleep / massive deltas
      const safeDelta = Math.min(delta, TICK_MS * 3);
      setBuckets((b) => ({
        learning_ms: b.learning_ms + (activeSurface === "learning" ? safeDelta : 0),
        support_ms:  b.support_ms  + (activeSurface === "support"  ? safeDelta : 0),
        quiz_ms:     b.quiz_ms     + (activeSurface === "quiz"     ? safeDelta : 0),
        cafe_ms:     b.cafe_ms     + (activeSurface === "cafe"     ? safeDelta : 0),
      }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [activeSurface]);

  // Threshold watcher — fires the soft prompt on first cross,
  // re-fires after SESSION_BALANCE_REPROMPT_MS of additional learning time.
  useEffect(() => {
    if (promptOpen) return;
    if (buckets.learning_ms < SESSION_BALANCE_THRESHOLD_MS) return;
    const since = Date.now() - lastPromptAt;
    if (lastPromptAt === 0 || since >= SESSION_BALANCE_REPROMPT_MS) {
      setPromptOpen(true);
      setLastPromptAt(Date.now());
      // Persist the moment the prompt appeared.
      if (user?.id) {
        const flag: SessionBalanceFlag =
          ignoreCount === 0
            ? "over_threshold"
            : ignoreCount === 1
              ? "ignored_once"
              : "ignored_twice";
        persistSessionBalance({
          userId: user.id,
          sessionId: sessionIdRef.current,
          eventType: "prompt_shown",
          flag,
          buckets,
          ignoreCount,
          reasons: [`learning_ms ≥ ${SESSION_BALANCE_THRESHOLD_MS}`],
        });
      }
    }
  }, [buckets.learning_ms, promptOpen, lastPromptAt, ignoreCount, user?.id, buckets]);

  const setActiveSurface = useCallback((s: ActiveSurface) => {
    setActiveSurfaceState(s);
    lastTickRef.current = Date.now();
  }, []);

  const setActiveSurfaceFromStepKey = useCallback((key: string | null | undefined) => {
    setActiveSurface(bucketForStepKey(key));
  }, [setActiveSurface]);

  // Listen for TJ Café open/close so the cafe bucket is always honest,
  // regardless of which surface called openTJCafe().
  useEffect(() => {
    const onOpen = () => setActiveSurface("cafe");
    const onClose = () => setActiveSurface("learning"); // default back to learning context
    window.addEventListener("open-tj-cafe", onOpen);
    window.addEventListener("tj-cafe-closed", onClose);
    return () => {
      window.removeEventListener("open-tj-cafe", onOpen);
      window.removeEventListener("tj-cafe-closed", onClose);
    };
  }, [setActiveSurface]);

  const recordChoice = useCallback((choice: SessionBalanceChoice) => {
    if (!user?.id) {
      setPromptOpen(false);
      return;
    }
    const flagMap: Record<SessionBalanceChoice, SessionBalanceFlag | ""> = {
      continue: "chose_continue",
      take_reset: "chose_reset",
      switch_style: "chose_switch_style",
      ignored: "ignored_once",
      auto_cafe: "auto_cafe_suggested",
    };
    const flag = flagMap[choice];

    persistSessionBalance({
      userId: user.id,
      sessionId: sessionIdRef.current,
      eventType: `choice_${choice}`,
      flag,
      buckets,
      ignoreCount,
      reasons: [`choice=${choice}`],
    });

    setPromptOpen(false);

    if (choice === "take_reset") {
      // Open TJ Café — its surface listener will switch the bucket.
      try { window.dispatchEvent(new CustomEvent("open-tj-cafe", { detail: { manual: true } })); } catch { }
      setIgnoreCount(0);
    } else if (choice === "switch_style") {
      // Surface-level UIs handle the actual style switch; we just reset counts.
      setIgnoreCount(0);
    } else if (choice === "continue") {
      // Soft "ignore" — they chose to keep going. Count it.
      const next = ignoreCount + 1;
      setIgnoreCount(next);
      if (next >= 2) {
        // Auto-suggest TJ Café.
        persistSessionBalance({
          userId: user.id,
          sessionId: sessionIdRef.current,
          eventType: "auto_cafe_suggested",
          flag: "auto_cafe_suggested",
          buckets,
          ignoreCount: next,
          reasons: ["ignored 2 times"],
        });
        try { window.dispatchEvent(new CustomEvent("open-tj-cafe", { detail: { manual: false } })); } catch { }
        setIgnoreCount(0);
      }
    } else if (choice === "ignored") {
      const next = ignoreCount + 1;
      setIgnoreCount(next);
      if (next >= 2) {
        persistSessionBalance({
          userId: user.id,
          sessionId: sessionIdRef.current,
          eventType: "auto_cafe_suggested",
          flag: "auto_cafe_suggested",
          buckets,
          ignoreCount: next,
          reasons: ["dismissed 2 times"],
        });
        try { window.dispatchEvent(new CustomEvent("open-tj-cafe", { detail: { manual: false } })); } catch { }
        setIgnoreCount(0);
      }
    }
  }, [user?.id, buckets, ignoreCount]);

  const dismissPrompt = useCallback(() => {
    recordChoice("ignored");
  }, [recordChoice]);

  const value = useMemo<SessionBalanceContextValue>(() => ({
    buckets,
    activeSurface,
    ignoreCount,
    promptOpen,
    setActiveSurface,
    setActiveSurfaceFromStepKey,
    recordChoice,
    dismissPrompt,
  }), [buckets, activeSurface, ignoreCount, promptOpen, setActiveSurface, setActiveSurfaceFromStepKey, recordChoice, dismissPrompt]);

  return (
    <SessionBalanceContext.Provider value={value}>
      {children}
    </SessionBalanceContext.Provider>
  );
};

export const useSessionBalance = () => {
  const ctx = useContext(SessionBalanceContext);
  if (!ctx) throw new Error("useSessionBalance must be used inside <SessionBalanceProvider>");
  return ctx;
};

// Optional safe-version for non-critical callers (e.g., orb only wants to set
// the surface but doesn't want to throw if the provider isn't mounted).
export const useSessionBalanceOptional = () => {
  return useContext(SessionBalanceContext);
};
