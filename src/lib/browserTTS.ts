// Voice removed — all TTS functions are no-ops so nothing speaks.

export function speakWithBrowserTTS(
  _text: string,
  _opts?: any,
): { audio: HTMLAudioElement | null } {
  return { audio: null };
}

export async function fetchTTSWithFallback(
  _text: string,
  _opts?: any,
): Promise<HTMLAudioElement | null> {
  return null;
}
