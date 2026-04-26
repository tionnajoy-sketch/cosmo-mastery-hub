import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  loadLatestRhythm,
  RHYTHM_COPY,
  RHYTHM_EVENT,
  type LearningRhythmState,
} from "@/lib/learning-rhythm";
import { Activity, Sparkles, Waves, AlertCircle, LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ICONS: Record<LearningRhythmState, React.ComponentType<{ className?: string }>> = {
  flow: Sparkles,
  steady: Waves,
  strained: Activity,
  overwhelmed: AlertCircle,
  recovering: LifeBuoy,
};

const TONE: Record<LearningRhythmState, string> = {
  flow:        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15",
  steady:      "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/15",
  strained:    "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15",
  overwhelmed: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/15",
  recovering:  "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30 hover:bg-violet-500/15",
};

const DOT_COLOR: Record<LearningRhythmState, string> = {
  flow:        "bg-emerald-500",
  steady:      "bg-sky-500",
  strained:    "bg-amber-500",
  overwhelmed: "bg-rose-500",
  recovering:  "bg-violet-500",
};

// Subtle motion per state — never aggressive, always small.
//   flow        → smooth slow drift (forward momentum)
//   steady      → no motion (calm baseline)
//   strained    → gentle warning pulse
//   overwhelmed → faster alert pulse
//   recovering  → soft slow breath
const DOT_MOTION: Record<LearningRhythmState, {
  animate: Record<string, number[]>;
  transition: Record<string, unknown>;
}> = {
  flow: {
    animate: { x: [0, 3, 0], opacity: [0.85, 1, 0.85] },
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
  steady: {
    animate: { opacity: [1, 1] },
    transition: { duration: 0 },
  },
  strained: {
    animate: { scale: [1, 1.25, 1], opacity: [0.9, 1, 0.9] },
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
  overwhelmed: {
    animate: { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] },
    transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
  },
  recovering: {
    animate: { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] },
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
};

/**
 * Subtle, tappable Learning Rhythm Indicator.
 * - Tiny colored dot with state-specific micro-motion (flow drifts, strained
 *   pulses, overwhelmed alerts, recovering breathes, steady stays still).
 * - Tap opens a popover with "What this means" + suggested actions.
 * - Listens for `tj-learning-rhythm-changed` events; hydrates from DB on mount.
 * - Hides when no rhythm has been recorded yet.
 */
const LearningRhythmBadge = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const [state, setState] = useState<LearningRhythmState | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadLatestRhythm(user.id).then((s) => { if (!cancelled) setState(s); });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent)?.detail?.state as LearningRhythmState | undefined;
      if (next) setState(next);
    };
    window.addEventListener(RHYTHM_EVENT, onChange);
    return () => window.removeEventListener(RHYTHM_EVENT, onChange);
  }, []);

  if (!state) return null;
  const Icon = ICONS[state];
  const copy = RHYTHM_COPY[state];
  const motionCfg = DOT_MOTION[state];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Learning rhythm: ${copy.label}. Tap to learn what this means.`}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
            "transition-colors duration-300 cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            TONE[state],
            className,
          )}
        >
          <span className="relative flex items-center justify-center h-3.5 w-3.5">
            <motion.span
              aria-hidden="true"
              className={cn("absolute h-2 w-2 rounded-full", DOT_COLOR[state])}
              animate={motionCfg.animate}
              transition={motionCfg.transition}
            />
            <Icon className="h-3.5 w-3.5 opacity-0" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">{copy.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", DOT_COLOR[state])} />
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            You are currently in
          </p>
        </div>
        <h4 className="text-base font-semibold text-foreground leading-snug flex items-center gap-2">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {copy.label}
        </h4>

        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
            What this means
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed">
            {copy.meaning}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
            Suggested actions
          </p>
          <ul className="space-y-1.5">
            {copy.actions.map((a) => (
              <li
                key={a}
                className="text-sm text-foreground/85 leading-snug flex gap-2"
              >
                <span aria-hidden="true" className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", DOT_COLOR[state])} />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LearningRhythmBadge;
