import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Users, Layers, HelpCircle, Sparkles, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  ENTRY_OPTIONS,
  PATH_LABELS,
  fetchDominantEntryPoint,
  recordEntryChoice,
  type ThinkingPath,
} from "@/lib/entry-point";

const ICONS: Record<ThinkingPath, React.ComponentType<{ className?: string }>> = {
  visual: Eye,
  real_life: Users,
  breakdown: Layers,
  try_first: HelpCircle,
  metaphor: Sparkles,
  reflect_first: Brain,
};

interface Props {
  termId?: string | null;
  moduleId?: string | null;
  termTitle: string;
  onChosen: (path: ThinkingPath, routeTo: string) => void;
  onSkip?: () => void;
}

export default function EntryPointGate({
  termId,
  moduleId,
  termTitle,
  onChosen,
  onSkip,
}: Props) {
  const { user } = useAuth();
  const [dominant, setDominant] = useState<ThinkingPath | null>(null);
  const [submitting, setSubmitting] = useState<ThinkingPath | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchDominantEntryPoint(user.id).then((d) => setDominant(d.dominantPath));
  }, [user?.id]);

  const handlePick = async (path: ThinkingPath, routeTo: string) => {
    setSubmitting(path);
    if (user?.id) {
      await recordEntryChoice({ userId: user.id, termId, moduleId, path, routedTo: routeTo });
    }
    onChosen(path, routeTo);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-5"
      >
        <div className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-primary">
            Before we begin · {termTitle}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            How do you want to approach this term?
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick the door that feels right. We'll start there and weave the rest in.
          </p>
          {dominant && (
            <p className="text-xs text-primary/80">
              Your usual entry: <strong>{PATH_LABELS[dominant]}</strong>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ENTRY_OPTIONS.map((opt) => {
            const Icon = ICONS[opt.key];
            const isLoading = submitting === opt.key;
            const isDominant = dominant === opt.key;
            return (
              <motion.button
                key={opt.key}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={!!submitting}
                onClick={() => handlePick(opt.key, opt.routeTo)}
                className="text-left rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md disabled:opacity-60"
                style={{
                  borderColor: isDominant ? "hsl(var(--primary) / 0.55)" : undefined,
                  background: isDominant ? "hsl(var(--primary) / 0.05)" : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.12)" }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    {isDominant && (
                      <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold text-primary">
                        Your dominant entry
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {onSkip && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onSkip} disabled={!!submitting}>
              Just start at the top
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
