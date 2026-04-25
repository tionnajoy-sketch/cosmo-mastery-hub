import { motion } from "framer-motion";
import { GraduationCap, FlaskConical } from "lucide-react";
import type { BehaviorMode } from "@/lib/behavior-intake";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  value: BehaviorMode;
  onChange: (m: BehaviorMode) => void;
}

export default function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-muted/40 p-1 backdrop-blur">
      {(["teach", "test"] as const).map((m) => {
        const active = value === m;
        const Icon = m === "teach" ? GraduationCap : FlaskConical;
        const label = m === "teach" ? "Teach Mode" : "Test Mode";
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="behavior-mode-pill"
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
