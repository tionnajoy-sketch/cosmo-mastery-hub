import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  loadLatestRhythm,
  RHYTHM_COPY,
  RHYTHM_EVENT,
  type LearningRhythmState,
} from "@/lib/learning-rhythm";
import { Activity, Sparkles, Waves, AlertCircle, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<LearningRhythmState, React.ComponentType<{ className?: string }>> = {
  flow: Sparkles,
  steady: Waves,
  strained: Activity,
  overwhelmed: AlertCircle,
  recovering: LifeBuoy,
};

const TONE: Record<LearningRhythmState, string> = {
  flow:        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  steady:      "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
  strained:    "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
  overwhelmed: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30",
  recovering:  "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
};

/**
 * Subtle pill that shows the learner's current Learning Rhythm.
 * - Listens for `tj-learning-rhythm-changed` events emitted from term flows.
 * - Hydrates from the latest persisted row on mount.
 * - Hides itself when no rhythm has been recorded yet.
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

  return (
    <div
      title={`${copy.label} — ${copy.hint}`}
      aria-label={`Learning rhythm: ${copy.label}. ${copy.hint}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
        "transition-colors duration-300",
        TONE[state],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{copy.label}</span>
    </div>
  );
};

export default LearningRhythmBadge;
