import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { useWordHighlight } from "@/hooks/useWordHighlight";
import { cn } from "@/lib/utils";

interface ReadAlongTextProps {
  text: string;
  className?: string;
  textClassName?: string;
  usageType?: "greeting" | "lesson" | "affirmation" | "onboarding" | "faq" | "dynamic";
  showButton?: boolean;
  buttonLabel?: string;
}

const ReadAlongText = ({
  text,
  className = "",
  textClassName = "",
  usageType = "dynamic",
  showButton = true,
  buttonLabel = "Listen",
}: ReadAlongTextProps) => {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const words = useMemo(() => text.split(/(\s+)/), [text]); // keep whitespace tokens
  const wordIndexes = useMemo(() => {
    let idx = -1;
    return words.map((tok) => {
      if (/\S/.test(tok)) {
        idx += 1;
        return idx;
      }
      return -1;
    });
  }, [words]);
  const wordCount = useMemo(() => words.filter((t) => /\S/.test(t)).length, [words]);
  const { activeIndex, attach, reset } = useWordHighlight(wordCount);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    attach(null);
    reset();
  }, [attach, reset]);

  const handleSpeak = useCallback(async () => {
    if (speaking || loading) {
      cleanup();
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
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
      attach(audio);
      audio.onended = () => { setSpeaking(false); cleanup(); };
      audio.onerror = () => { setSpeaking(false); cleanup(); };
      setSpeaking(true);
      await audio.play();
    } catch (e) {
      console.warn("ReadAlongText error:", e);
      setLoading(false);
      setSpeaking(false);
    }
  }, [text, speaking, loading, cleanup, attach, usageType]);

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className={cn("leading-relaxed", textClassName)}>
        {words.map((tok, i) => {
          const wIdx = wordIndexes[i];
          if (wIdx < 0) return <span key={i}>{tok}</span>;
          const active = speaking && activeIndex === wIdx;
          return (
            <span
              key={i}
              className={cn(
                "transition-colors duration-150 rounded px-0.5",
                active && "bg-primary/25 text-foreground"
              )}
            >
              {tok}
            </span>
          );
        })}
      </p>
      {showButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSpeak}
          className="h-8 gap-1.5 px-2 text-xs"
          title={speaking ? "Stop" : loading ? "Loading…" : "Listen"}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : speaking ? (
            <VolumeX className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span>{speaking ? "Stop" : buttonLabel}</span>
        </Button>
      )}
    </div>
  );
};

export default ReadAlongText;
