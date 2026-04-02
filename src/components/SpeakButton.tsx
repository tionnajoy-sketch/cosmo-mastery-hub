import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeakButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "icon" | "default";
  className?: string;
  onComplete?: () => void;
  usageType?: "greeting" | "lesson" | "affirmation" | "onboarding" | "faq" | "dynamic";
}

const SpeakButton = ({ text, label, size = "icon", className = "", onComplete, usageType = "dynamic" }: SpeakButtonProps) => {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const speakWithBrowser = useCallback((plainText: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    // Try to pick a warm female voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /samantha|karen|victoria|zira|female/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => { setSpeaking(false); onComplete?.(); };
    utterance.onerror = () => { setSpeaking(false); };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [onComplete]);

  const handleSpeak = useCallback(async () => {
    if (speaking || loading) {
      cleanup();
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setLoading(false);
      return;
    }

    const plainText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    if (!plainText) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: plainText, usageType }),
        }
      );

      if (!response.ok) {
        console.warn("ElevenLabs TTS unavailable, falling back to browser voice");
        setLoading(false);
        speakWithBrowser(plainText);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("audio")) {
        console.warn("TTS returned non-audio, falling back to browser voice");
        setLoading(false);
        speakWithBrowser(plainText);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeaking(false);
        cleanup();
        onComplete?.();
      };
      audio.onerror = () => {
        setSpeaking(false);
        cleanup();
      };

      setLoading(false);
      setSpeaking(true);
      await audio.play();
    } catch (e) {
      console.warn("TTS error, falling back to browser voice:", e);
      setLoading(false);
      speakWithBrowser(plainText);
    }
  }, [text, speaking, loading, cleanup, onComplete, speakWithBrowser]);

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleSpeak}
      className={`flex-shrink-0 ${className}`}
      title={speaking ? "Stop speaking" : loading ? "Loading..." : "Listen"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 text-primary animate-spin" />
      ) : speaking ? (
        <VolumeX className="h-4 w-4 text-primary" />
      ) : (
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      )}
      {label && <span className="ml-1 text-xs">{label}</span>}
    </Button>
  );
};

export default SpeakButton;
