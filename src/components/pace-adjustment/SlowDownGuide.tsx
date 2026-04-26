import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Footprints, ArrowRight, Check } from "lucide-react";
import {
  SLOW_DOWN_ROUTE,
  type SlowDownStep,
} from "@/lib/pace-adjustment";

interface SlowDownGuideProps {
  open: boolean;
  // Called every time the learner advances. Parent jumps the orb step
  // and persists the pace choice for that route step.
  onAdvance: (step: SlowDownStep, index: number) => void;
  onComplete: () => void;
  onExit: (atIndex: number) => void;
}

const SlowDownGuide = ({ open, onAdvance, onComplete, onExit }: SlowDownGuideProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Fire onAdvance whenever the index changes while open
  useEffect(() => {
    if (!open) return;
    const step = SLOW_DOWN_ROUTE[index];
    if (step) onAdvance(step, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, open]);

  const isLast = index >= SLOW_DOWN_ROUTE.length - 1;
  const current = SLOW_DOWN_ROUTE[index];
  if (!current) return null;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onExit(index); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border/40 bg-gradient-to-b from-emerald-500/[0.04] via-background to-background"
        aria-describedby="slow-down-desc"
      >
        <div className="px-6 pt-6 pb-3 text-center">
          <div
            aria-hidden="true"
            className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
          >
            <Footprints className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold text-foreground">
            Slow it down
          </h2>
          <p id="slow-down-desc" className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/80">
            Step {index + 1} of {SLOW_DOWN_ROUTE.length}
          </p>
        </div>

        <div className="px-6 pb-2">
          <div className="rounded-lg border border-border/50 bg-card/50 p-4">
            <p className="text-sm font-medium text-foreground">{current.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
          </div>

          <ol className="mt-4 space-y-1.5">
            {SLOW_DOWN_ROUTE.map((s, i) => (
              <li
                key={s.pace}
                className={`flex items-center gap-2 text-xs ${
                  i < index ? "text-muted-foreground/60" :
                  i === index ? "text-foreground" :
                  "text-muted-foreground/40"
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    i < index ? "bg-emerald-500/20 border-emerald-500/40" :
                    i === index ? "border-foreground/50" :
                    "border-muted-foreground/30"
                  }`}
                >
                  {i < index ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                {s.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="px-4 pb-5 pt-4 flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => onExit(index)}
          >
            Exit slow pace
          </Button>
          <Button
            className="flex-1"
            onClick={handleNext}
          >
            {isLast ? "Done" : (<>Next<ArrowRight className="ml-1 h-4 w-4" /></>)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlowDownGuide;
