import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch, GitCompare, Layers, Sparkles, Timer, Anchor, HelpCircle,
  AlertTriangle, ArrowRight, Eye, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  ERROR_OPTIONS, ERROR_LABELS, fetchErrorPattern, recordErrorPick,
  type ErrorType, type ErrorRoute,
} from "@/lib/error-type";

const ICONS: Record<ErrorType, React.ComponentType<{ className?: string }>> = {
  misread: ScanSearch,
  confused_terms: GitCompare,
  didnt_understand: Layers,
  overthought: Sparkles,
  rushed: Timer,
  guessed: Anchor,
  not_sure: HelpCircle,
};

interface Props {
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  questionRef?: string;
  termTitle: string;
  definition?: string;
  metaphor?: string;
  /** Called when learner has either picked an error type AND chosen the next move,
   *  or chose to "Show me the answer anyway". */
  onResolved: (info: {
    errorType: ErrorType | null;
    route: ErrorRoute | null;
    revealAnswer: boolean;
    /** When set, the parent should jump to this step key (visual / breakdown / metaphor / information / quiz). */
    jumpTo?: "visual" | "breakdown" | "metaphor" | "information" | "quiz";
  }) => void;
}

export default function WrongAnswerErrorPicker({
  termId, moduleId, blockNumber, questionRef,
  termTitle, definition, metaphor, onResolved,
}: Props) {
  const { user } = useAuth();
  const [picked, setPicked] = useState<ErrorType | null>(null);
  const [pattern, setPattern] = useState<{ dominant: ErrorType | null; repeats: number } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchErrorPattern(user.id).then((p) =>
      setPattern({ dominant: p.dominantType, repeats: p.recentRepeats })
    );
  }, [user?.id]);

  const handlePick = async (key: ErrorType) => {
    setPicked(key);
    const opt = ERROR_OPTIONS.find((o) => o.key === key)!;
    if (user?.id) {
      await recordErrorPick({
        userId: user.id,
        termId, moduleId, blockNumber, questionRef,
        errorType: key,
        routedTo: opt.route,
      });
    }
  };

  const finish = (revealAnswer: boolean, jumpTo?: Props["onResolved"] extends (i: infer I) => void ? (I extends { jumpTo?: infer J } ? J : never) : never) => {
    const opt = picked ? ERROR_OPTIONS.find((o) => o.key === picked) : null;
    onResolved({
      errorType: picked,
      route: opt?.route ?? null,
      revealAnswer,
      jumpTo,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mt-2 border-2"
      style={{
        background: "hsl(40 35% 99%)",
        borderColor: "hsl(352 65% 78%)",
        boxShadow: "0 12px 30px -12px hsl(0 0% 0% / 0.18)",
      }}
    >
      <header className="px-5 py-4 flex items-start gap-3 border-b" style={{ borderColor: "hsl(352 65% 78%)" }}>
        <AlertTriangle className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: "hsl(352 65% 50%)" }} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(352 65% 50%)" }}>
            Pause before the answer
          </p>
          <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight mt-1">
            What do you think happened?
          </h3>
          <p className="text-sm italic mt-1 text-muted-foreground">
            Naming the slip is how you stop repeating it.
          </p>
        </div>
      </header>

      <div className="px-5 py-4 space-y-3">
        {!picked && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ERROR_OPTIONS.map((opt) => {
              const Icon = ICONS[opt.key];
              const isDominant = pattern?.dominant === opt.key && (pattern?.repeats ?? 0) >= 2;
              return (
                <motion.button
                  key={opt.key}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePick(opt.key)}
                  className="text-left rounded-xl border bg-card p-3 hover:border-primary/50 transition-all"
                  style={isDominant ? { borderColor: "hsl(var(--primary) / 0.55)", background: "hsl(var(--primary) / 0.05)" } : undefined}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug">{opt.label}</p>
                      {isDominant && (
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold text-primary">
                          Pattern detected
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                  You said: {ERROR_LABELS[picked]}
                </p>
                <RouteHint pick={picked} termTitle={termTitle} definition={definition} metaphor={metaphor} />
              </div>

              <RouteActions pick={picked} onChoose={finish} />

              {pattern?.dominant === picked && pattern.repeats >= 3 && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-[12px] text-amber-700">
                  Heads up — this is the {pattern.repeats}th time recently you've named "{ERROR_LABELS[picked]}".
                  We'll start defending against it earlier.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RouteHint({
  pick, termTitle, definition, metaphor,
}: { pick: ErrorType; termTitle: string; definition?: string; metaphor?: string }) {
  switch (pick) {
    case "misread":
      return (
        <div className="text-sm mt-1.5 space-y-1">
          <p><strong>Question-Reading Strategy:</strong></p>
          <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
            <li>Read the answer choices first.</li>
            <li>Then read the question.</li>
            <li>Eliminate the two clearly wrong options.</li>
            <li>Pick the one that matches the function — not the keyword.</li>
          </ol>
        </div>
      );
    case "confused_terms":
      return (
        <div className="text-sm mt-1.5">
          <p><strong>Comparison Card</strong> — {termTitle} vs. its lookalike. Side-by-side check coming up so the two stop blurring.</p>
        </div>
      );
    case "didnt_understand":
      return (
        <div className="text-sm mt-1.5 text-muted-foreground">
          Going to the <strong>Breakdown Layer</strong> — we'll decode the parts of the term so the meaning lands first, before any question.
        </div>
      );
    case "overthought":
      return (
        <div className="text-sm mt-1.5">
          <strong>Simple version first:</strong> {definition || `${termTitle} is exactly what the name says — no extra rules.`}
          <p className="text-muted-foreground mt-1">Trust the obvious read.</p>
        </div>
      );
    case "rushed":
      return (
        <div className="text-sm mt-1.5 text-muted-foreground">
          Take a breath. Re-read the stem out loud. When you're ready, retry — slowly this time.
        </div>
      );
    case "guessed":
      return (
        <div className="text-sm mt-1.5">
          <strong>Memory Anchor:</strong> {metaphor || `Picture ${termTitle} as a hook in your mind — link it to one image you'll never forget.`}
        </div>
      );
    case "not_sure":
      return (
        <div className="text-sm mt-1.5 text-muted-foreground">
          That's honest. Pick the doorway that feels easiest right now — visual, metaphor, or a guided lesson.
        </div>
      );
  }
}

function RouteActions({
  pick,
  onChoose,
}: {
  pick: ErrorType;
  onChoose: (revealAnswer: boolean, jumpTo?: "visual" | "breakdown" | "metaphor" | "information" | "quiz") => void;
}) {
  const buttons: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    primary?: boolean;
    onClick: () => void;
  }> = [];

  switch (pick) {
    case "misread":
      buttons.push({ label: "Retry the question", icon: ArrowRight, primary: true, onClick: () => onChoose(false, "quiz") });
      break;
    case "confused_terms":
      buttons.push({ label: "Open Comparison Card", icon: GitCompare, primary: true, onClick: () => onChoose(false, "breakdown") });
      break;
    case "didnt_understand":
      buttons.push({ label: "Go to Breakdown Layer", icon: Layers, primary: true, onClick: () => onChoose(false, "breakdown") });
      break;
    case "overthought":
      buttons.push({ label: "Retry with simple read", icon: ArrowRight, primary: true, onClick: () => onChoose(false, "quiz") });
      break;
    case "rushed":
      buttons.push({ label: "Slow down & retry", icon: Timer, primary: true, onClick: () => onChoose(false, "quiz") });
      break;
    case "guessed":
      buttons.push({ label: "Lock in a Memory Anchor", icon: Anchor, primary: true, onClick: () => onChoose(false, "metaphor") });
      break;
    case "not_sure":
      buttons.push({ label: "Show the visual", icon: Eye, onClick: () => onChoose(false, "visual") });
      buttons.push({ label: "Give me the metaphor", icon: Sparkles, onClick: () => onChoose(false, "metaphor") });
      buttons.push({ label: "Guided lesson", icon: BookOpen, primary: true, onClick: () => onChoose(false, "information") });
      break;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b, i) => (
        <Button
          key={i}
          size="sm"
          variant={b.primary ? "default" : "outline"}
          onClick={b.onClick}
        >
          <b.icon className="h-3.5 w-3.5 mr-1" />
          {b.label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={() => onChoose(true)}>
        Show me the answer anyway
      </Button>
    </div>
  );
}
