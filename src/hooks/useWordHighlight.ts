import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns the index of the currently spoken word given an audio element + total word count.
 * Works for both real audio (ElevenLabs MP3) — uses time-based estimation —
 * and our browser-TTS shim, which dispatches custom "wordboundary" events with `detail.index`.
 */
export function useWordHighlight(wordCount: number) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    setActiveIndex(-1);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const attach = useCallback((audio: HTMLAudioElement | null) => {
    // Detach previous
    if (audioRef.current) {
      const prev = audioRef.current;
      prev.removeEventListener("ended", reset);
      prev.removeEventListener("pause", onPause);
      prev.removeEventListener("play", onPlay);
      prev.removeEventListener("wordboundary" as any, onBoundary as any);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current = audio;
    setActiveIndex(-1);
    if (!audio) return;

    audio.addEventListener("ended", reset);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("wordboundary" as any, onBoundary as any);
    // If audio already playing, kick off tracking
    if (!audio.paused) onPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordCount]);

  const onBoundary = useCallback((e: CustomEvent<{ index: number }>) => {
    if (typeof e.detail?.index === "number") setActiveIndex(e.detail.index);
  }, []);

  const onPause = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const onPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || wordCount <= 0) return;

    const tick = () => {
      if (!audioRef.current || audioRef.current.paused) return;
      const dur = audioRef.current.duration;
      // Only run estimator if duration is finite (real audio, not browser-TTS shim which uses events)
      if (Number.isFinite(dur) && dur > 0) {
        const t = audioRef.current.currentTime;
        const idx = Math.min(wordCount - 1, Math.floor((t / dur) * wordCount));
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [wordCount]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return { activeIndex, attach, reset };
}
