import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import tutorialAsset from "@/assets/student-tutorial.mp4.asset.json";

interface AppTutorialVideoProps {
  variant?: "card" | "button" | "inline";
  label?: string;
}

const AppTutorialVideo = ({ variant = "card", label = "Watch App Tutorial" }: AppTutorialVideoProps) => {
  const [open, setOpen] = useState(false);

  if (variant === "button") {
    return (
      <>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Play className="h-3.5 w-3.5" /> {label}
        </Button>
        <TutorialDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  if (variant === "inline") {
    return (
      <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-[420px] mx-auto bg-black">
        <video
          src={tutorialAsset.url}
          controls
          playsInline
          className="w-full h-full object-contain"
          poster=""
        />
      </div>
    );
  }

  // card variant
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-full rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40 hover:border-primary/30 transition-all group cursor-pointer"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
          </div>
          <span className="text-sm font-medium text-foreground/80">{label}</span>
        </div>
      </button>
      <TutorialDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

const TutorialDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm p-2 bg-black border-0 rounded-2xl">
      <DialogTitle className="sr-only">App Navigation Tutorial</DialogTitle>
      <DialogDescription className="sr-only">Watch a tutorial video on how to use CosmoPrep</DialogDescription>
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden">
        <video
          src={tutorialAsset.url}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </DialogContent>
  </Dialog>
);

export default AppTutorialVideo;
