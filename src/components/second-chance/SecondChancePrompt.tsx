import { motion } from "framer-motion";
import { RotateCcw, Layers, Eye, Sparkles, BookOpenCheck, Hourglass } from "lucide-react";
import {
  SECOND_CHANCE_OPTIONS,
  type SecondChanceBehavior,
  type SecondChanceOption,
} from "@/lib/second-chance";

const ICONS: Record<SecondChanceBehavior, React.ComponentType<{ className?: string }>> = {
  try_again: RotateCcw,
  break_it_down: Layers,
  show_visual: Eye,
  show_metaphor: Sparkles,
  show_answer: BookOpenCheck,
};

interface Props {
  onChoose: (opt: SecondChanceOption) => void;
}

export default function SecondChancePrompt({ onChoose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mt-3 border-2"
      style={{
        background: "hsl(40 35% 99%)",
        borderColor: "hsl(220 60% 78%)",
        boxShadow: "0 12px 30px -12px hsl(0 0% 0% / 0.18)",
      }}
    >
      <header
        className="px-5 py-4 flex items-start gap-3 border-b"
        style={{ borderColor: "hsl(220 60% 78%)" }}
      >
        <Hourglass className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: "hsl(220 65% 45%)" }} />
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "hsl(220 65% 45%)" }}
          >
            Second chance
          </p>
          <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight mt-1">
            Do you want to try again or break it down first?
          </h3>
          <p className="text-sm italic mt-1 text-muted-foreground">
            The answer is still hidden — you choose how you recover.
          </p>
        </div>
      </header>

      <div className="px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECOND_CHANCE_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.key];
            const isReveal = opt.key === "show_answer";
            const isPrimary = opt.key === "try_again";
            return (
              <motion.button
                key={opt.key}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChoose(opt)}
                className="text-left rounded-xl border bg-card p-3 transition-all hover:border-primary/50"
                style={
                  isPrimary
                    ? {
                        borderColor: "hsl(var(--primary) / 0.55)",
                        background: "hsl(var(--primary) / 0.06)",
                      }
                    : isReveal
                      ? {
                          borderColor: "hsl(220 15% 80%)",
                          background: "hsl(220 15% 98%)",
                        }
                      : undefined
                }
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="grid place-items-center w-8 h-8 rounded-lg shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.12)" }}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug">{opt.label}</p>
                    {isPrimary && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold text-primary">
                        Recommended
                      </span>
                    )}
                    {isReveal && (
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Skip the recovery
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
