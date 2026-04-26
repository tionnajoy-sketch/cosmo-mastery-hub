import { AlertTriangle, ArrowRight, Sparkles, Target } from "lucide-react";
import {
  LAYER_LABEL,
  type IntegrityLayer,
  type IntegrityResult,
} from "@/lib/layer-integrity";

interface LayerIntegrityGateProps {
  result: IntegrityResult;
  onContinueAnyway: () => void;
  onGoToMissing: () => void;
  onShowMostImportant: () => void;
}

/**
 * Soft gate shown before the Mastery Check when the learner has completed
 * fewer than 70% of the prerequisite learning layers. Non-blocking — the
 * learner can always continue.
 */
export function LayerIntegrityGate({
  result,
  onContinueAnyway,
  onGoToMissing,
  onShowMostImportant,
}: LayerIntegrityGateProps) {
  const { pct, missing, mostImportantMissing } = result;

  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{
        background: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
      role="alertdialog"
      aria-labelledby="integrity-heading"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 p-2 rounded-full"
          style={{ background: "hsl(45 95% 92%)" }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: "hsl(35 85% 40%)" }} />
        </div>
        <div className="min-w-0">
          <h3
            id="integrity-heading"
            className="font-display text-lg font-bold leading-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Heads up before the Mastery Check
          </h3>
          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            You can continue, but your retention may be stronger if you complete
            more layers first.
          </p>
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-3 text-xs"
        style={{ background: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="flex items-center justify-between font-semibold">
          <span style={{ color: "hsl(var(--foreground))" }}>
            Layers completed
          </span>
          <span style={{ color: "hsl(35 85% 40%)" }}>{pct}%</span>
        </div>
        {missing.length > 0 && (
          <p className="mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Still missing:{" "}
            <span style={{ color: "hsl(var(--foreground))" }}>
              {missing.map((m: IntegrityLayer) => LAYER_LABEL[m]).join(", ")}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {mostImportantMissing && (
          <button
            type="button"
            onClick={onShowMostImportant}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all hover:opacity-90"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Show me the most important missing layer
            </span>
            <span className="flex items-center gap-1 text-xs opacity-80">
              {LAYER_LABEL[mostImportantMissing]}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onGoToMissing}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all hover:opacity-90 border"
          style={{
            background: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Take me to missing layers
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
        </button>
        <button
          type="button"
          onClick={onContinueAnyway}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold underline-offset-2 hover:underline"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Continue anyway
        </button>
      </div>
    </div>
  );
}
