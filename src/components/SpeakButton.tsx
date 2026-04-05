import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTTSWithFallback } from "@/lib/browserTTS";

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

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const handleSpeak = useCallback(async () => {
    if (speaking || loading) {
      cleanup();
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setLoading(false);
      return;
    }

    if (!text?.trim()) return;

    try {
      setLoading(true);
      const audio = await fetchTTSWithFallback(text, { usageType });
      setLoading(false);
      if (!audio) return;

      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); cleanup(); onComplete?.(); };
      audio.onerror = () => { setSpeaking(false); cleanup(); };
      setSpeaking(true);
      await audio.play();
    } catch (e) {
      console.warn("SpeakButton error:", e);
      setLoading(false);
      setSpeaking(false);
    }
  }, [text, speaking, loading, cleanup, onComplete, usageType]);


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
