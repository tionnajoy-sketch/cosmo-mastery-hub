import { Heart } from "lucide-react";
import { useRecoveryMode } from "@/contexts/RecoveryModeContext";
import { RECOVERY_MESSAGE } from "@/lib/recovery-mode";
import { Button } from "@/components/ui/button";

/**
 * Calm, low-contrast banner shown across the app while Recovery Mode is active.
 * Uses semantic tokens + a soft violet accent (matches the "recovering" rhythm).
 */
const RecoveryModeBanner = () => {
  const { active, exit } = useRecoveryMode();
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-violet-500/20 bg-violet-500/[0.06]"
    >
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-start gap-3">
        <div
          aria-hidden="true"
          className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center"
        >
          <Heart className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-medium">
            Recovery Mode
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
            {RECOVERY_MESSAGE}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground -mr-2"
          onClick={() => exit("manual")}
        >
          I'm okay
        </Button>
      </div>
    </div>
  );
};

export default RecoveryModeBanner;
