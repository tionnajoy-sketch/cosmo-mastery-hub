/**
 * Browser-based Speech Synthesis fallback for when ElevenLabs credits are exhausted.
 * Returns an object that mimics HTMLAudioElement's play/pause pattern.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => /samantha|karen|victoria|zira|female/i.test(v.name)) || voices[0] || null;
}

/** Ensure voices are loaded (some browsers load async) */
function ensureVoices(): Promise<void> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve();
    // Timeout fallback — speak even without preferred voice
    setTimeout(resolve, 500);
  });
}

export function speakWithBrowserTTS(
  text: string,
  onEnd?: () => void,
  onError?: () => void
): { pause: () => void } {
  window.speechSynthesis.cancel();
  ensureVoices().then(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
  });
  return {
    pause: () => window.speechSynthesis.cancel(),
  };
}

/**
 * Fetch TTS from the edge function with automatic browser fallback.
 * Returns an audio element on success, or falls back to browser speech.
 */
export async function fetchTTSWithFallback(
  text: string,
  opts?: { usageType?: string }
): Promise<HTMLAudioElement | null> {
  const plain = text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*]\s/g, "")
    .replace(/["""]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 5000);

  if (!plain) return null;

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: plain, usageType: opts?.usageType || "dynamic" }),
      }
    );

    if (!resp.ok) {
      console.warn("TTS API unavailable (status " + resp.status + "), using browser voice");
      return createBrowserAudioShim(plain);
    }

    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("audio")) {
      console.warn("TTS returned non-audio, using browser voice");
      return createBrowserAudioShim(plain);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    return new Audio(url);
  } catch (e) {
    console.warn("TTS fetch error, using browser voice:", e);
    return createBrowserAudioShim(plain);
  }
}

/**
 * Creates a fake HTMLAudioElement-like wrapper around browser speechSynthesis
 * so callers can treat it like `new Audio(url)`.
 */
function createBrowserAudioShim(text: string): HTMLAudioElement {
  const audio = new Audio();

  audio.play = () => {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      ensureVoices().then(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          audio.dispatchEvent(new Event("ended"));
        };
        utterance.onerror = () => {
          audio.dispatchEvent(new Event("error"));
        };
        window.speechSynthesis.speak(utterance);
        resolve();
      });
    });
  };

  audio.pause = () => {
    window.speechSynthesis.cancel();
  };

  return audio;
}
