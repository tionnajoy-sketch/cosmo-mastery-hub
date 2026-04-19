import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";

export interface NavStep {
  key: string;
  label: string;
  color: string;
  gradient: string;
}

interface LayerBlockNavigatorProps {
  steps: NavStep[];
  currentStep: number;
  completedSteps: Set<number>;
  onSelect: (index: number) => void;
  /** When true, future tiles are locked (default true). */
  enforceOrder?: boolean;
  /** When true (e.g. reinforcement gate), block ALL navigation. */
  locked?: boolean;
}

/**
 * Vibrant, DNA-ordered tile grid that replaces linear Back/Next pagination
 * inside a learning term. Each tile is a "layer block" — tap to jump to it.
 *
 * Lock rule: a tile is tappable if it's the current step, a completed step,
 * or the very next step after the highest completed step.
 */
const LayerBlockNavigator = ({
  steps,
  currentStep,
  completedSteps,
  onSelect,
  enforceOrder = true,
  locked = false,
}: LayerBlockNavigatorProps) => {
  const highestCompleted = completedSteps.size === 0
    ? -1
    : Math.max(...Array.from(completedSteps));
  const maxUnlocked = Math.max(currentStep, highestCompleted + 1);

  const isUnlocked = (i: number) => {
    if (locked) return i === currentStep;
    if (!enforceOrder) return true;
    return i <= maxUnlocked;
  };

  return (
    <div className="w-full">
      {/* Caption */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Sparkles className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Your TJ-Recommended Path
        </p>
      </div>

      {/* Tile grid: 2 cols on mobile, horizontal scroll on wider */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((s, i) => {
          const isCurrent = i === currentStep;
          const isComplete = completedSteps.has(i);
          const unlocked = isUnlocked(i);

          return (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => unlocked && onSelect(i)}
              disabled={!unlocked}
              whileHover={unlocked ? { scale: 1.04, y: -2 } : {}}
              whileTap={unlocked ? { scale: 0.96 } : {}}
              animate={isCurrent ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={isCurrent ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
              className="relative rounded-xl overflow-hidden text-left transition-all"
              style={{
                background: unlocked ? s.gradient : "hsl(var(--muted))",
                boxShadow: isCurrent
                  ? `0 4px 18px ${s.color}55, 0 0 0 2px ${s.color}`
                  : isComplete
                    ? `0 2px 8px ${s.color}30`
                    : "none",
                opacity: unlocked ? 1 : 0.45,
                cursor: unlocked ? "pointer" : "not-allowed",
                minHeight: 72,
              }}
              aria-label={`Step ${i + 1}: ${s.label}${isComplete ? " (completed)" : isCurrent ? " (current)" : !unlocked ? " (locked)" : ""}`}
            >
              <div className="relative h-full p-2.5 flex flex-col justify-between">
                {/* Top row: number badge + status icon */}
                <div className="flex items-start justify-between">
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold"
                    style={{
                      background: "hsl(0 0% 100% / 0.25)",
                      color: "white",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {isComplete ? (
                    <span
                      className="inline-flex items-center justify-center h-5 w-5 rounded-full"
                      style={{ background: "hsl(0 0% 100% / 0.85)" }}
                    >
                      <Check className="h-3 w-3" style={{ color: s.color }} />
                    </span>
                  ) : !unlocked ? (
                    <Lock className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                  ) : null}
                </div>

                {/* Label */}
                <p
                  className="font-display text-[11px] sm:text-xs font-bold leading-tight mt-1"
                  style={{
                    color: unlocked ? "white" : "hsl(var(--muted-foreground))",
                    textShadow: unlocked ? "0 1px 2px hsl(0 0% 0% / 0.25)" : "none",
                  }}
                >
                  {s.label}
                </p>
              </div>

              {/* Pulsing indicator for current */}
              {isCurrent && (
                <motion.span
                  className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: "white" }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {locked && (
        <p className="text-[10px] text-center mt-2 italic" style={{ color: "hsl(25 70% 40%)" }}>
          🔒 Finish the reinforcement to unlock more steps
        </p>
      )}
    </div>
  );
};

export default LayerBlockNavigator;
