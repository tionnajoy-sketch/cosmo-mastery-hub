/**
 * Browser-based Speech Synthesis fallback for when ElevenLabs credits are exhausted.
 * Returns an object that mimics HTMLAudioElement's play/pause pattern.
 */
const TTS_COOLDOWN_UNTIL_KEY = "tj-tts-cooldown-until";
const TTS_COOLDOWN_REASON_KEY = "tj-tts-cooldown-reason";
const CREDIT_EXHAUSTED_COOLDOWN_MS = 30 * 60 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

function getTTSCooldownUntil(): number {
  const raw = window.localStorage.getItem(TTS_COOLDOWN_UNTIL_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function markTTSUnavailable(reason: string, durationMs: number) {
  window.localStorage.setItem(TTS_COOLDOWN_UNTIL_KEY, String(Date.now() + durationMs));
  window.localStorage.setItem(TTS_COOLDOWN_REASON_KEY, reason);
}

function clearTTSUnavailable() {
  window.localStorage.removeItem(TTS_COOLDOWN_UNTIL_KEY);
  window.localStorage.removeItem(TTS_COOLDOWN_REASON_KEY);
}

function getTTSCooldownReason(): string | null {
  return window.localStorage.getItem(TTS_COOLDOWN_REASON_KEY);
}

function applyTTSCooldown(status: number, reason?: string) {
  const normalizedReason = reason?.toLowerCase() || "";

  if (status === 402 || normalizedReason.includes("credit") || normalizedReason.includes("quota")) {
    markTTSUnavailable(reason || "Voice credits exhausted", CREDIT_EXHAUSTED_COOLDOWN_MS);
    return;
  }

  if (status === 429 || normalizedReason.includes("rate limit")) {
    markTTSUnavailable(reason || "Voice rate limited", RATE_LIMIT_COOLDOWN_MS);
  }
}

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

  const cooldownUntil = getTTSCooldownUntil();
  if (cooldownUntil > Date.now()) {
    console.warn("TTS temporarily unavailable, using browser voice:", getTTSCooldownReason() || "temporary cooldown");
    return createBrowserAudioShim(plain);
  }

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
      const errorText = await resp.text().catch(() => "");
      applyTTSCooldown(resp.status, errorText);
      console.warn("TTS API unavailable (status " + resp.status + "), using browser voice");
      return createBrowserAudioShim(plain);
    }

    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("audio")) {
      const payload = await resp.clone().json().catch(() => null);
      applyTTSCooldown(resp.status, payload?.reason || payload?.error);
      console.warn("TTS returned non-audio, using browser voice");
      return createBrowserAudioShim(plain);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    clearTTSUnavailable();
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

  // Pre-compute char-index → word-index map so we can dispatch wordboundary events
  const wordStarts: number[] = [];
  {
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) wordStarts.push(m.index);
  }
  const charToWordIdx = (charIndex: number) => {
    // Binary search: find largest wordStart <= charIndex
    let lo = 0, hi = wordStarts.length - 1, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (wordStarts[mid] <= charIndex) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  };

  audio.play = () => {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      ensureVoices().then(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        const voice = pickVoice();
        if (voice) utterance.voice = voice;
        utterance.onboundary = (ev: SpeechSynthesisEvent) => {
          if (ev.name && ev.name !== "word") return;
          const idx = charToWordIdx(ev.charIndex || 0);
          audio.dispatchEvent(new CustomEvent("wordboundary", { detail: { index: idx } }));
        };
        utterance.onstart = () => {
          audio.dispatchEvent(new Event("play"));
        };
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
    audio.dispatchEvent(new Event("pause"));
  };

  return audio;
}
