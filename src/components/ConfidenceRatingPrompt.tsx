import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";
import {
  CONFIDENCE_OPTIONS,
  UNDERSTANDING_COLOR,
  UNDERSTANDING_DESCRIPTION,
  UNDERSTANDING_LABEL,
  type ConfidenceRating,
  type UnderstandingStatus,
} from "@/lib/confidence/understanding";

interface ConfidenceRatingPromptProps {
  /**
   * Called once the learner picks a confidence value.
   * Receives both the raw rating and the derived understanding_status so
   * callers can persist it however they prefer.
   */
  onSubmit: (
    confidence: ConfidenceRating,
    status: UnderstandingStatus
  ) => void | Promise<void>;
  isCorrect: boolean;
  /** Optional override for the question prompt text. */
  prompt?: string;
  /** Compact variant trims padding & headline — used inside crowded surfaces. */
  compact?: boolean;
  /** External "already answered" view; supply to render the result chip only. */
  initialStatus?: UnderstandingStatus | null;
}

export default function ConfidenceRatingPrompt({
  onSubmit,
  isCorrect,
  prompt = "How confident were you in that answer?",
  compact = false,
  initialStatus = null,
}: ConfidenceRatingPromptProps) {
  const [picked, setPicked] = useState<ConfidenceRating | null>(null);
  const [status, setStatus] = useState<UnderstandingStatus | null>(initialStatus);
  const [submitting, setSubmitting] = useState(false);

  const classify = (c: ConfidenceRating): UnderstandingStatus => {
    if (isCorrect) {
      if (c <= 2) return "fragile_understanding";
      if (c >= 4) return "strong_understanding";
      return "building_understanding";
    }
    if (c >= 4) return "strong_misconception";
    if (c <= 2) return "recognized_uncertainty";
    return "developing_misconception";
  };

  const handlePick = async (c: ConfidenceRating) => {
    if (picked || submitting) return;
    setSubmitting(true);
    setPicked(c);
    const next = classify(c);
    setStatus(next);
    try {
      await onSubmit(c, next);
    } finally {
      setSubmitting(false);
    }
  };

  if (status) {
    const palette = UNDERSTANDING_COLOR[status];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden mt-3"
        style={{
          background: palette.bg,
          border: `2px solid ${palette.border}`,
        }}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          <CheckCircle2
            className="h-5 w-5 mt-0.5 flex-shrink-0"
            style={{ color: palette.chip }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: palette.chip }}
            >
              Understanding Status
            </p>
            <p
              className="font-display text-base font-bold leading-tight mt-0.5"
              style={{ color: palette.text }}
            >
              {UNDERSTANDING_LABEL[status]}
            </p>
            <p
              className="text-xs leading-relaxed mt-1"
              style={{ color: palette.text }}
            >
              {UNDERSTANDING_DESCRIPTION[status]}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Card
      className="border-0 shadow-md mt-3 overflow-hidden"
      style={{ background: "hsl(220 30% 99%)" }}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(265 60% 55%)" }} />
          <p
            className="font-display text-sm font-semibold leading-tight"
            style={{ color: "hsl(220 30% 22%)" }}
          >
            {prompt}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {CONFIDENCE_OPTIONS.map((opt) => {
            const isPicked = picked === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handlePick(opt.value)}
                disabled={!!picked || submitting}
                className="rounded-lg px-2 py-2 text-xs font-medium transition-all border-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isPicked
                    ? "hsl(265 70% 55%)"
                    : "hsl(0 0% 100%)",
                  borderColor: isPicked
                    ? "hsl(265 70% 45%)"
                    : "hsl(220 20% 88%)",
                  color: isPicked ? "white" : "hsl(220 30% 25%)",
                }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base leading-none">{opt.emoji}</span>
                  <span className="text-[11px] leading-tight">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {!picked && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] mt-2"
              style={{ color: "hsl(220 15% 50%)" }}
            >
              Your honest answer trains the engine — not your grade.
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
