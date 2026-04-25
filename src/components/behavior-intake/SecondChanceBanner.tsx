import { Repeat } from "lucide-react";

interface SecondChanceBannerProps {
  attemptCount: number;
  improved: boolean;
  onMark: (improved: boolean) => void;
}

export default function SecondChanceBanner({ attemptCount, improved, onMark }: SecondChanceBannerProps) {
  if (attemptCount < 2) return null;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">
          Attempt #{attemptCount}. Did this round feel better?
        </span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onMark(true)}
          className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
            improved ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onMark(false)}
          className={`rounded-full px-2.5 py-1 text-[11px] transition-all ${
            !improved ? "bg-muted text-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          Not yet
        </button>
      </div>
    </div>
  );
}
