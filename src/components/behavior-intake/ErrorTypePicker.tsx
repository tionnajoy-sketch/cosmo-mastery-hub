import type { ErrorType } from "@/lib/behavior-intake";
import { cn } from "@/lib/utils";

interface ErrorTypePickerProps {
  value: ErrorType;
  onChange: (e: ErrorType) => void;
}

const OPTIONS: { id: ErrorType; label: string }[] = [
  { id: "misread", label: "Misread it" },
  { id: "forgot", label: "Forgot" },
  { id: "guessed", label: "Guessed" },
  { id: "wrong_layer", label: "Wrong layer" },
  { id: "partial", label: "Partly right" },
];

export default function ErrorTypePicker({ value, onChange }: ErrorTypePickerProps) {
  return (
    <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
        What happened? (no judgment — this helps TJ adapt)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-all",
                active
                  ? "border-amber-500 bg-amber-500/15 text-foreground"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:border-amber-500/40",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
