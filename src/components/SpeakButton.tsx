import { useState, useCallback, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpeakButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "icon" | "default";
  className?: string;
  onComplete?: () => void;
}

const SpeakButton = ({ text, label, size = "icon", className = "", onComplete }: SpeakButtonProps) => {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleSpeak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => {
      setSpeaking(false);
      onComplete?.();
    };
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, speaking, onComplete]);

  if (!("speechSynthesis" in window)) return null;

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleSpeak}
      className={`flex-shrink-0 ${className}`}
      title={speaking ? "Stop speaking" : "Listen"}
    >
      {speaking ? (
        <VolumeX className="h-4 w-4 text-primary" />
      ) : (
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      )}
      {label && <span className="ml-1 text-xs">{label}</span>}
    </Button>
  );
};

export default SpeakButton;
