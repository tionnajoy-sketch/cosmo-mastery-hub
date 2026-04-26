import { Coffee, Play, Shuffle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSessionBalance } from "@/contexts/SessionBalanceContext";
import { formatBucketMinutes } from "@/lib/session-balance";

/**
 * Soft session-balance prompt. Appears once the learner crosses the
 * 45-minute learning threshold. Three calm choices, all tracked.
 */
const SessionBalancePrompt = () => {
  const { promptOpen, buckets, ignoreCount, recordChoice, dismissPrompt } = useSessionBalance();

  const totalLearning = buckets.learning_ms;
  const supportText = formatBucketMinutes(buckets.support_ms);
  const quizText = formatBucketMinutes(buckets.quiz_ms);
  const cafeText = formatBucketMinutes(buckets.cafe_ms);
  const learningText = formatBucketMinutes(totalLearning);

  return (
    <Dialog
      open={promptOpen}
      onOpenChange={(open) => { if (!open) dismissPrompt(); }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 h-11 w-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-lg leading-snug">
            You've been focused for a while.
          </DialogTitle>
          <DialogDescription className="text-center">
            Do you want to reset or continue?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-2 mb-1 text-center">
          <div className="rounded-lg border border-border/50 bg-card/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Learning</p>
            <p className="text-sm font-semibold text-foreground">{learningText}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Support</p>
            <p className="text-sm font-semibold text-foreground">{supportText}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Quizzes</p>
            <p className="text-sm font-semibold text-foreground">{quizText}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TJ Café</p>
            <p className="text-sm font-semibold text-foreground">{cafeText}</p>
          </div>
        </div>

        {ignoreCount >= 1 && (
          <p className="text-xs text-amber-700 dark:text-amber-300 text-center mt-1">
            One more skip and we'll gently move you to TJ Café.
          </p>
        )}

        <div className="grid gap-2 mt-3">
          <Button
            variant="outline"
            className="justify-start gap-2 h-11"
            onClick={() => recordChoice("continue")}
          >
            <Play className="h-4 w-4" />
            Continue
          </Button>
          <Button
            variant="default"
            className="justify-start gap-2 h-11"
            onClick={() => recordChoice("take_reset")}
          >
            <Coffee className="h-4 w-4" />
            Take a reset
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 h-11"
            onClick={() => recordChoice("switch_style")}
          >
            <Shuffle className="h-4 w-4" />
            Switch learning style
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionBalancePrompt;
