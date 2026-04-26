import { Wind } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BREATH_MESSAGE,
  BREATH_OPTIONS,
  type BreathResponseChoice,
} from "@/lib/breath-trigger";

interface BreathPromptProps {
  open: boolean;
  reasons: string[];
  onChoose: (choice: Exclude<BreathResponseChoice, "dismissed">) => void;
  onDismiss: () => void;
}

const BreathPrompt = ({ open, reasons, onChoose, onDismiss }: BreathPromptProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border/40 bg-gradient-to-b from-sky-500/[0.04] via-background to-background"
        aria-describedby="breath-message"
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div
            aria-hidden="true"
            className="mx-auto h-14 w-14 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center"
          >
            <Wind className="h-6 w-6 text-sky-600 dark:text-sky-300 animate-pulse" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            Breath
          </h2>
          <p id="breath-message" className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {BREATH_MESSAGE}
          </p>
          {reasons.length > 0 && (
            <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
              Noticed: {reasons.slice(0, 3).join(" · ")}
            </p>
          )}
        </div>

        <div className="px-4 pb-5 space-y-2">
          {BREATH_OPTIONS.map((opt) => (
            <Button
              key={opt.choice}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 text-left"
              onClick={() => onChoose(opt.choice)}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</span>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BreathPrompt;
