import { useEffect, useRef } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { useSoundsEnabled } from "@/hooks/useCoins";

/** Shared narration ref so any page can stop a previous page's audio */
let globalAudioRef: HTMLAudioElement | null = null;
let globalSpeechActive = false;

export function stopGlobalNarration() {
  if (globalAudioRef) {
    globalAudioRef.pause();
    globalAudioRef = null;
  }
  window.speechSynthesis.cancel();
  globalSpeechActive = false;
}

export async function startGlobalNarration(text: string): Promise<HTMLAudioElement | null> {
  // Hard global gate — if paused app-wide, never start narration
  if (localStorage.getItem("tj_voice_globally_paused") !== "false") return null;
  stopGlobalNarration();
  if (!text?.trim()) return null;
  try {
    const audio = await fetchTTSWithFallback(text, { usageType: "lesson" });
    if (!audio) return null;
    globalAudioRef = audio;
    globalSpeechActive = true;
    audio.onended = () => { globalAudioRef = null; globalSpeechActive = false; };
    audio.onerror = () => { globalAudioRef = null; globalSpeechActive = false; };
    await audio.play();
    return audio;
  } catch {
    globalSpeechActive = false;
    return null;
  }
}

/** Global voice pause flag — when true, ALL auto-narration is suppressed app-wide. */
const VOICE_PAUSE_KEY = "tj_voice_globally_paused";
export function isVoiceGloballyPaused(): boolean {
  // Default: paused. User must explicitly set to "false" to allow narration.
  return localStorage.getItem(VOICE_PAUSE_KEY) !== "false";
}
export function setVoiceGloballyPaused(paused: boolean) {
  localStorage.setItem(VOICE_PAUSE_KEY, paused ? "true" : "false");
  if (paused) stopGlobalNarration();
}

/**
 * Hook: auto-narrate text when a page mounts (respects sound toggle + global pause).
 * Stops narration on unmount. Only fires once per mount.
 */
export function useAutoNarrate(text: string | (() => string), delayMs = 800) {
  const { soundsEnabled } = useSoundsEnabled();
  const hasFired = useRef(false);

  useEffect(() => {
    if (isVoiceGloballyPaused()) return;
    if (!soundsEnabled || hasFired.current) return;
    hasFired.current = true;
    const resolved = typeof text === "function" ? text() : text;
    if (!resolved?.trim()) return;
    const timer = setTimeout(() => {
      if (isVoiceGloballyPaused()) return;
      startGlobalNarration(resolved);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [soundsEnabled]);

  useEffect(() => {
    return () => stopGlobalNarration();
  }, []);
}
