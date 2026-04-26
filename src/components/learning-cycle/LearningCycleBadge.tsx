import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  loadLatestCycleStage,
  CYCLE_COPY,
  CYCLE_EVENT,
  type CycleStage,
} from "@/lib/learning-cycle";
import {
  BookOpen,
  PencilLine,
  AlertTriangle,
  Coffee,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<CycleStage, React.ComponentType<{ className?: string }>> = {
  learn:    BookOpen,
  try:      PencilLine,
  struggle: AlertTriangle,
  reset:    Coffee,
  reenter:  RotateCcw,
  mastery:  Trophy,
};

const TONE: Record<CycleStage, string> = {
  learn:    "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
  try:      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
  struggle: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
  reset:    "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
  reenter:  "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30",
  mastery:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
};

const LearningCycleBadge = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<CycleStage | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadLatestCycleStage(user.id).then((s) => { if (!cancelled) setStage(s); });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent)?.detail?.stage as CycleStage | undefined;
      if (next) setStage(next);
    };
    window.addEventListener(CYCLE_EVENT, onChange);
    return () => window.removeEventListener(CYCLE_EVENT, onChange);
  }, []);

  if (!stage) return null;
  const Icon = ICONS[stage];
  const copy = CYCLE_COPY[stage];

  return (
    <div
      title={`Learning cycle: ${copy.label} — ${copy.hint}`}
      aria-label={`Learning cycle: ${copy.label}. ${copy.hint}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
        "transition-colors duration-300",
        TONE[stage],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">{copy.label}</span>
    </div>
  );
};

export default LearningCycleBadge;
