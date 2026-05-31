import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ActiveBeatProps {
  prompt: string;
  /** Multiple-choice options. If omitted, a short-text input is shown. */
  options?: string[];
  /** Optional response shown after the learner answers. */
  acknowledgement?: string;
  accentColor?: string;
  onAnswered?: (value: string) => void;
}

/**
 * One-tap / one-line active learning beat. Inserted between TJ Lesson layers
 * so students answer, connect, or reflect every 1–2 screens.
 */
export default function ActiveBeat({
  prompt,
  options,
  acknowledgement = "Got it. That kind of noticing is what makes this stick.",
  accentColor,
  onAnswered,
}: ActiveBeatProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const accent = accentColor || "hsl(var(--primary))";

  const submit = (value: string) => {
    setPicked(value);
    onAnswered?.(value);
  };

  return (
    <div
      className="mt-6 rounded-2xl border bg-card p-5"
      style={{
        borderColor: `${accent.replace("hsl(", "hsla(").replace(")", " / 0.35)")}`,
        background: `linear-gradient(180deg, hsl(var(--card)), ${accent.replace("hsl(", "hsla(").replace(")", " / 0.04)")})`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Quick check
        </span>
        <span className="text-[10px] text-muted-foreground">· 1 tap</span>
      </div>
      <p className="text-card-foreground text-base leading-relaxed mb-4">
        {prompt}
      </p>

      <AnimatePresence mode="wait">
        {picked === null ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {options ? (
              <div className="grid gap-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => submit(opt)}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-background hover:border-foreground transition text-sm text-foreground"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="One sentence is enough…"
                  className="min-h-[72px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => text.trim() && submit(text.trim())}
                    disabled={!text.trim()}
                    style={{ backgroundColor: accent, color: "white" }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="ack"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-sm text-card-foreground"
          >
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: accent }}
            >
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="font-medium">{picked}</p>
              <p className="text-muted-foreground text-xs mt-1">{acknowledgement}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
