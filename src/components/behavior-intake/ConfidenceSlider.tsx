import { cn } from "@/lib/utils";

interface ConfidenceSliderProps {
  value: number | null;
  onChange: (n: number) => void;
}

const FACES = ["😣", "😕", "🙂", "😊", "🤩"];
const LABELS = ["Lost", "Shaky", "Okay", "Solid", "Locked in"];

export default function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">How sure are you?</p>
      <div className="flex items-center gap-1.5">
        {FACES.map((face, i) => {
          const n = i + 1;
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${LABELS[i]} (${n} of 5)`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-base transition-all",
                active
                  ? "border-primary bg-primary/10 scale-110 shadow-sm"
                  : "border-border/40 bg-background/40 hover:border-primary/40",
              )}
            >
              {face}
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-[11px] text-muted-foreground">{LABELS[value - 1]}</p>
      )}
    </div>
  );
}
