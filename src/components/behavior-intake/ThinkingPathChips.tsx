import type { ThinkingPath } from "@/lib/behavior-intake";
import { cn } from "@/lib/utils";

interface ThinkingPathChipsProps {
  value: ThinkingPath | null;
  onChange: (p: ThinkingPath) => void;
}

const OPTIONS: { id: ThinkingPath; label: string; emoji: string }[] = [
  { id: "visual", label: "Picture", emoji: "🖼️" },
  { id: "verbal", label: "Words", emoji: "💬" },
  { id: "logical", label: "Logic", emoji: "🧩" },
  { id: "story", label: "Story", emoji: "📖" },
  { id: "kinesthetic", label: "Doing", emoji: "✋" },
];

export default function ThinkingPathChips({ value, onChange }: ThinkingPathChipsProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">How did you think this through?</p>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all",
                active
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border/40 bg-background/40 text-muted-foreground hover:border-primary/40",
              )}
            >
              <span>{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
