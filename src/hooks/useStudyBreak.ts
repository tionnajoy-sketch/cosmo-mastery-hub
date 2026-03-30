import { useState, useEffect, useCallback, useRef } from "react";

// Global event to open cafe from anywhere
export const openTJCafe = () => {
  window.dispatchEvent(new CustomEvent("open-tj-cafe"));
};

const BREAK_INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
const SESSION_KEY = "tj_study_start_time";

export const useStudyBreak = () => {
  const [showCafe, setShowCafe] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleOpenCafe = () => setShowCafe(true);
    window.addEventListener("open-tj-cafe", handleOpenCafe);
    return () => window.removeEventListener("open-tj-cafe", handleOpenCafe);
  }, []);

  useEffect(() => {
    // Initialize or restore session start time
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    }

    const check = () => {
      const start = Number(sessionStorage.getItem(SESSION_KEY) || Date.now());
      const elapsed = Date.now() - start;
      if (elapsed >= BREAK_INTERVAL_MS) {
        setShowCafe(true);
      }
    };

    // Check every 30 seconds
    timerRef.current = setInterval(check, 30000);
    check();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const dismissCafe = useCallback(() => {
    setShowCafe(false);
    // Reset timer for another 60 minutes
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  }, []);

  const openCafe = useCallback(() => {
    setShowCafe(true);
  }, []);

  return { showCafe, dismissCafe, openCafe };
};
