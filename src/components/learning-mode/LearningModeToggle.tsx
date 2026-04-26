import { BookOpen, Target } from "lucide-react";
import type { LearningMode } from "@/hooks/useLearningMode";

interface LearningModeToggleProps {
  mode: LearningMode;
  onChange: (next: LearningMode) => void;
  switchCount?: number;
}

/**
 * Small pill toggle that flips between Teach Mode (instruction layers)
 * and Test Mode (practice + assessment layers).
 */
export function LearningModeToggle({ mode, onChange, switchCount }: LearningModeToggleProps) {
  const buttonBase =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all";

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-full border"
      style={{
        background: "hsl(var(--muted) / 0.5)",
        borderColor: "hsl(var(--border))",
      }}
      role="tablist"
      aria-label="Learning mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "teach"}
        onClick={() => onChange("teach")}
        className={buttonBase}
        style={{
          background: mode === "teach" ? "hsl(var(--primary))" : "transparent",
          color: mode === "teach" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Teach
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "test"}
        onClick={() => onChange("test")}
        className={buttonBase}
        style={{
          background: mode === "test" ? "hsl(var(--primary))" : "transparent",
          color: mode === "test" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Target className="h-3.5 w-3.5" />
        Test
      </button>
      {typeof switchCount === "number" && switchCount > 0 && (
        <span
          className="ml-1 mr-1 text-[10px] font-medium"
          style={{ color: "hsl(var(--muted-foreground))" }}
          aria-label={`${switchCount} mode switches this term`}
        >
          ⇄ {switchCount}
        </span>
      )}
    </div>
  );
}
