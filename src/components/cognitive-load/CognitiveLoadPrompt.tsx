import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain, Coffee, Eye, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import {
  COGNITIVE_LOAD_ACTIONS,
  COGNITIVE_LOAD_PROMPT,
  type CognitiveLoad,
  type CognitiveLoadAction,
} from "@/lib/cognitive-load";

interface Props {
  level: Exclude<CognitiveLoad, "low">;
  reasons: string[];
  onAction: (action: CognitiveLoadAction) => void;
  onDismiss?: () => void;
}

const ICONS: Record<CognitiveLoadAction, JSX.Element> = {
  continue: <ArrowRight className="h-3.5 w-3.5" />,
  show_visual: <Eye className="h-3.5 w-3.5" />,
  show_metaphor: <Sparkles className="h-3.5 w-3.5" />,
  tj_cafe: <Coffee className="h-3.5 w-3.5" />,
  simpler_question: <HelpCircle className="h-3.5 w-3.5" />,
};

export function CognitiveLoadPrompt({ level, reasons, onAction, onDismiss }: Props) {
  const accent = level === "high" ? "hsl(0 65% 50%)" : "hsl(35 85% 50%)";
  const wash = level === "high" ? "hsl(0 65% 50% / 0.06)" : "hsl(35 85% 50% / 0.06)";
  const label = level === "high" ? "High cognitive load" : "Moderate cognitive load";

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border p-5 space-y-4"
      style={{
        background: wash,
        borderColor: accent,
        borderLeftWidth: 4,
      }}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: accent, color: "white" }}
        >
          <Brain className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {label}
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
            {COGNITIVE_LOAD_PROMPT[level]}
          </p>
          {reasons.length > 0 && (
            <p className="mt-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              Signals: {reasons.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {COGNITIVE_LOAD_ACTIONS.map((a) => (
          <Button
            key={a.id}
            size="sm"
            variant={a.id === "continue" ? "outline" : "secondary"}
            onClick={() => onAction(a.id)}
            className="gap-1.5"
          >
            {ICONS[a.id]}
            {a.label}
          </Button>
        ))}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Not now
          </Button>
        )}
      </div>
    </motion.aside>
  );
}

export default CognitiveLoadPrompt;
