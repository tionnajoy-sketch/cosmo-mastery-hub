import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { REENTRY_OPTIONS, REENTRY_PROMPT, type ReentryChoice } from "@/lib/reentry";

interface ReentryPromptProps {
  open: boolean;
  onChoose: (choice: ReentryChoice) => void;
  onDismiss?: () => void;
}

/**
 * Calm, focused re-entry sheet. Renders inline above the orb step content.
 * Visually styled in the violet "recovering" register used elsewhere in the
 * Recovery / Rhythm system to signal continuity.
 */
const ReentryPrompt = ({ open, onChoose, onDismiss }: ReentryPromptProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="reentry"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-5 mb-4"
          role="dialog"
          aria-label="Re-entry options"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
            </div>
            <p className="text-[11px] uppercase tracking-wide text-violet-700 dark:text-violet-300 font-medium">
              Re-entry
            </p>
          </div>
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {REENTRY_PROMPT}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            You don't go back to where you were. Pick a softer way in.
          </p>

          <div className="mt-4 grid gap-2">
            {REENTRY_OPTIONS.map((opt) => (
              <button
                key={opt.choice}
                onClick={() => onChoose(opt.choice)}
                className="w-full text-left px-4 py-3 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 hover:border-violet-500/40 transition-colors"
              >
                <div className="text-sm font-medium text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Skip — keep going from where I was
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReentryPrompt;
