import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import LearningOrb from "@/components/LearningOrb";
import type { UploadedBlock } from "@/components/UploadedTermCard";

interface LearningOrbDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: UploadedBlock | null;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
  blockIndex?: number;
}

const LearningOrbDialog = ({ open, onOpenChange, block, onNotesChange, mode = "uploaded", blockIndex = 0 }: LearningOrbDialogProps) => {
  if (!block) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 gap-0 border-0 rounded-2xl"
        style={{
          background: "hsl(var(--background))",
          boxShadow: "0 20px 60px hsl(0 0% 0% / 0.2)",
        }}
      >
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b" style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(10px)" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Terms
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* LearningOrb */}
        <div className="p-2 sm:p-4">
          <LearningOrb
            block={block}
            onNotesChange={onNotesChange}
            mode={mode}
            blockIndex={blockIndex}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOrbDialog;
