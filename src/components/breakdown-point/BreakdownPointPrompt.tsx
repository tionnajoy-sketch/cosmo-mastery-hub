import { Compass, X } from "lucide-react";
import { BREAKDOWN_LABEL, BREAKDOWN_OPTIONS, type BreakdownPoint } from "@/lib/breakdown-point";

interface BreakdownPointPromptProps {
  /** Number of incorrect attempts on this term (shown softly to the learner). */
  incorrectAttempts: number;
  /** Dominant pattern across recent terms, if any. */
  dominantPattern?: BreakdownPoint | null;
  onPick: (point: BreakdownPoint) => void;
  onDismiss?: () => void;
}

/**
 * Soft, supportive prompt shown after repeated struggle on a single term.
 * Asks the learner to identify where the concept stopped making sense so
 * the system can route them back to the right layer.
 */
export function BreakdownPointPrompt({
  incorrectAttempts,
  dominantPattern,
  onPick,
  onDismiss,
}: BreakdownPointPromptProps) {
  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{
        background: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
      role="dialog"
      aria-labelledby="breakdown-point-heading"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 p-2 rounded-full"
          style={{ background: "hsl(265 60% 95%)" }}
        >
          <Compass className="h-5 w-5" style={{ color: "hsl(265 60% 45%)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id="breakdown-point-heading"
            className="font-display text-lg font-bold leading-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Where did this stop making sense?
          </h3>
          <p
            className="text-xs mt-1"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            {incorrectAttempts >= 2
              ? "Let's pinpoint the breakdown so we can take the right next step together."
              : "No wrong answer here — just tell me where it got fuzzy."}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:opacity-70"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        )}
      </div>

      {dominantPattern && (
        <div
          className="rounded-xl px-3 py-2 text-[11px]"
          style={{ background: "hsl(45 95% 95%)", color: "hsl(35 65% 30%)" }}
        >
          <span className="font-semibold">Pattern noticed:</span> you've named{" "}
          <span className="font-semibold">{BREAKDOWN_LABEL[dominantPattern]}</span> as the
          breakdown point on multiple terms.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {BREAKDOWN_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all hover:opacity-90 border"
            style={{
              background: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          >
            <span>{BREAKDOWN_LABEL[opt]}</span>
            <span className="text-xs opacity-50">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
