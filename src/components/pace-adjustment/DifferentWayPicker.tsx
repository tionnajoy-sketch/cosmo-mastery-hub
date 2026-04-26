import { Eye, Sparkles, BookOpen } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DIFFERENT_WAY_OPTIONS,
  type PaceChoice,
  type OrbStepKey,
} from "@/lib/pace-adjustment";

interface DifferentWayPickerProps {
  open: boolean;
  onPick: (pace: PaceChoice, stepKey: OrbStepKey) => void;
  onClose: () => void;
}

const ICONS: Record<string, JSX.Element> = {
  different_way_visual:   <Eye      className="h-5 w-5" aria-hidden="true" />,
  different_way_metaphor: <Sparkles className="h-5 w-5" aria-hidden="true" />,
  different_way_guided:   <BookOpen className="h-5 w-5" aria-hidden="true" />,
};

const DifferentWayPicker = ({ open, onPick, onClose }: DifferentWayPickerProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border/40"
        aria-describedby="different-way-desc"
      >
        <div className="px-6 pt-6 pb-2 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Show me a different way
          </h2>
          <p id="different-way-desc" className="mt-1 text-sm text-muted-foreground">
            Pick the entry point that feels easier right now.
          </p>
        </div>
        <div className="px-4 pb-5 pt-3 space-y-2">
          {DIFFERENT_WAY_OPTIONS.map((opt) => (
            <Button
              key={opt.pace}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 text-left"
              onClick={() => onPick(opt.pace, opt.stepKey)}
            >
              <span className="mr-3 text-muted-foreground">{ICONS[opt.pace]}</span>
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

export default DifferentWayPicker;
