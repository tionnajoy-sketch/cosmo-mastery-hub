import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LearningOrb from "@/components/LearningOrb";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";

interface LearningOrbDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: UploadedBlock | null;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
  blockIndex?: number;
  onComplete?: () => void;
}

const LearningOrbDialog = ({ open, onOpenChange, block, onNotesChange, mode = "uploaded", blockIndex = 0, onComplete }: LearningOrbDialogProps) => {
  if (!block) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-0 max-w-none w-screen h-screen m-0 p-0 gap-0 border-0 rounded-none translate-x-0 translate-y-0 top-0 left-0 data-[state=open]:slide-in-from-bottom-0"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Full-screen background */}
        <div
          className="fixed inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.08, filter: "brightness(1.1)" }}
        />
        <div className="fixed inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.92) 0%, hsl(0 0% 98% / 0.95) 100%)" }} />

        {/* Scrollable content */}
        <div className="relative z-10 h-full overflow-y-auto">
          {/* Sticky header */}
          <div
            className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b"
            style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)" }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="gap-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Terms
            </Button>
            <p className="text-xs font-semibold truncate max-w-[200px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {block.term_title}
            </p>
          </div>

          {/* LearningOrb - full width */}
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 pb-20">
            <LearningOrb
              block={block}
              onNotesChange={onNotesChange}
              mode={mode}
              blockIndex={blockIndex}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOrbDialog;
