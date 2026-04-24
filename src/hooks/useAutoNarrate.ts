// VOICE DISABLED — all auto-narration and TTS playback is turned off app-wide.
// Force the global pause flag and stop any in-flight audio on import.

let globalAudioRef: HTMLAudioElement | null = null;

export function stopGlobalNarration() {
  if (globalAudioRef) {
    try { globalAudioRef.pause(); } catch {}
    globalAudioRef = null;
  }
  try { window.speechSynthesis?.cancel(); } catch {}
  try {
    document.querySelectorAll("audio").forEach((a) => {
      try { (a as HTMLAudioElement).pause(); } catch {}
    });
  } catch {}
}

// Force-disable on module load
if (typeof window !== "undefined") {
  try {
    localStorage.setItem("tj_voice_globally_paused", "true");
    document.querySelectorAll("audio").forEach((a) => {
      try { (a as HTMLAudioElement).pause(); } catch {}
    });
    window.speechSynthesis?.cancel();
  } catch {}
}

export async function startGlobalNarration(_text: string): Promise<HTMLAudioElement | null> {
  // Voice is fully disabled
  return null;
}

const VOICE_PAUSE_KEY = "tj_voice_globally_paused";
export function isVoiceGloballyPaused(): boolean {
  return true; // always paused
}
export function setVoiceGloballyPaused(_paused: boolean) {
  localStorage.setItem(VOICE_PAUSE_KEY, "true");
  stopGlobalNarration();
}

/** No-op: auto-narration is permanently disabled. */
export function useAutoNarrate(_text: string | (() => string), _delayMs = 800) {
  // intentionally empty
}
