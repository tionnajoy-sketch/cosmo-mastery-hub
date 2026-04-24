import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, ArrowRight, Loader2, Zap, Target, BookOpen, Eye, MessageSquare, Lightbulb, PenTool, GraduationCap, Wrench, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import LearningOrbDialog from "@/components/LearningOrbDialog";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import { pageColors } from "@/lib/colors";

const c = pageColors.study;

/* ─── Step Icons ─── */
const STEP_ICONS: Record<string, React.ReactNode> = {
  breakdown: <BookOpen className="h-4 w-4" />,
  application: <Wrench className="h-4 w-4" />,
  definition: <Target className="h-4 w-4" />,
  scripture: <BookOpen className="h-4 w-4" />,
  visual: <Eye className="h-4 w-4" />,
  metaphor: <Lightbulb className="h-4 w-4" />,
  information: <Brain className="h-4 w-4" />,
  reflection: <PenTool className="h-4 w-4" />,
  quiz: <GraduationCap className="h-4 w-4" />,
};

const STEP_LABELS: Record<string, string> = {
  breakdown: "Word Breakdown",
  application: "Apply It",
  definition: "Definition",
  scripture: "Scripture",
  visual: "Visualization",
  metaphor: "Metaphor",
  information: "Information",
  reflection: "Reflection",
  quiz: "Knowledge Check",
};

/* ─── Strategy Explanation Templates ─── */
function buildStrategyExplanation(
  rules: ReturnType<typeof useDNAAdaptation>["rules"],
  blockStrength: "weak" | "neutral" | "strong",
  visitCount: number,
): string[] {
  const lines: string[] = [];

  if (visitCount === 0) {
    lines.push("First time with this concept — let's build a strong foundation.");
  } else if (visitCount === 1) {
    lines.push("Welcome back! Let's deepen what you started last time.");
  } else {
    lines.push("You've been here before — this time we're pushing further.");
  }

  const layerMap: Record<string, string> = {
    breakdown: "Starting with word structure to activate your analytical mind.",
    definition: "Leading with a clear definition since that's how you learn best.",
    visual: "Starting with visuals to help you see it clearly.",
    metaphor: "Opening with a story to connect this to your experience.",
    information: "Diving into deeper context since you thrive on detail.",
    reflection: "Beginning with reflection to connect this to your life.",
    application: "Jumping into practice since you learn best by doing.",
    quiz: "Testing first to activate your recall pathways.",
  };
  const firstStep = rules.stepOrder[1];
  if (firstStep && layerMap[firstStep]) {
    lines.push(layerMap[firstStep]);
  }

  if (blockStrength === "weak") {
    lines.push("We'll reinforce this with extra practice — it's a growth area for you.");
  } else if (blockStrength === "strong") {
    lines.push("You're strong here — we'll move at a faster pace.");
  }

  if (rules.toneModifier === "supportive") {
    lines.push("Taking it step by step with encouragement along the way.");
  } else if (rules.toneModifier === "challenging") {
    lines.push("Expect a challenge — you're ready for it.");
  }

  if (rules.contentDepth === "brief") {
    lines.push("Keeping it focused and concise for maximum retention.");
  } else if (rules.contentDepth === "deep") {
    lines.push("Going deep — you're ready for the full picture.");
  }

  return lines;
}

/* ─── Props ─── */
interface LearningOrchestratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: UploadedBlock | null;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
  blockIndex?: number;
  onComplete?: () => void;
}

const LearningOrchestrator = ({
  open, onOpenChange, block, onNotesChange, mode = "uploaded", blockIndex = 0, onComplete,
}: LearningOrchestratorProps) => {
  const { user, profile } = useAuth();
  const { rules, dna, context } = useDNAAdaptation();

  const [phase, setPhase] = useState<"strategy" | "learning">("strategy");
  const [blockStrength, setBlockStrength] = useState<"weak" | "neutral" | "strong">("neutral");
  const [visitCount, setVisitCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState<string>("developing");
  const [retentionLevel, setRetentionLevel] = useState<string>("developing");

  useEffect(() => {
    if (block && open) {
      setPhase("strategy");
      setAnalyzing(true);
      setBlockStrength("neutral");
      setVisitCount(0);

      const analyze = async () => {
        if (!user) { setAnalyzing(false); return; }
        try {
          const termId = block.id;
          const [metricsRes, notesRes, wrongRes] = await Promise.all([
            supabase.from("user_learning_metrics")
              .select("confidence, retention, understanding, layers_completed")
              .eq("user_id", user.id)
              .eq("term_id", termId)
              .maybeSingle(),
            supabase.from("journal_notes")
              .select("id")
              .eq("user_id", user.id)
              .eq("term_id", termId),
            supabase.from("wrong_answers")
              .select("id")
              .eq("user_id", user.id)
              .limit(5),
          ]);

          const hasMetrics = !!metricsRes.data;
          const hasNotes = (notesRes.data?.length || 0) > 0;
          const visits = (hasMetrics ? 1 : 0) + (hasNotes ? 1 : 0);
          setVisitCount(visits);

          if (metricsRes.data) {
            const avg = (metricsRes.data.confidence + metricsRes.data.retention + metricsRes.data.understanding) / 3;
            setBlockStrength(avg >= 70 ? "strong" : avg <= 30 ? "weak" : "neutral");
          }
        } catch {}
        setTimeout(() => setAnalyzing(false), 800);
      };
      analyze();
    }
  }, [block?.id, open, user]);

  useEffect(() => {
    if (!dna) return;
    setConfidenceLevel(dna.confidence);
    setRetentionLevel(dna.retention);
  }, [dna]);

  const strategyLines = useMemo(
    () => buildStrategyExplanation(rules, blockStrength, visitCount),
    [rules, blockStrength, visitCount],
  );

  const handleStartLearning = useCallback(() => {
    setPhase("learning");
  }, []);

  if (!block) return null;

  if (phase === "learning") {
    return (
      <LearningOrbDialog
        open={open}
        onOpenChange={onOpenChange}
        block={block}
        onNotesChange={onNotesChange}
        mode={mode}
        blockIndex={blockIndex}
        onComplete={onComplete}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 max-w-none w-screen h-screen m-0 p-0 gap-0 border-0 rounded-none translate-x-0 translate-y-0 top-0 left-0 data-[state=open]:slide-in-from-bottom-0 overflow-y-auto" style={{ background: "hsl(var(--background))" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(265 40% 96%) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(215 40% 96%) 0%, transparent 60%)" }} />

        <div className="relative z-10 min-h-full flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(215 70% 50%))" }}>
                    <Brain className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-display text-xl font-bold" style={{ color: c.heading }}>Analyzing your learning profile…</p>
                    <p className="text-sm mt-1" style={{ color: c.subtext }}>Building a personalized path for {block.term_title}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="strategy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                      className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(215 70% 50%))" }}>
                      <Sparkles className="h-7 w-7 text-white" />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold" style={{ color: c.heading }}>
                      Your Learning Path
                    </h2>
                    <p className="text-sm" style={{ color: c.subtext }}>
                      Personalized for <span className="font-semibold" style={{ color: c.heading }}>{block.term_title}</span>
                    </p>
                  </div>

                  {/* DNA Profile Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Shield, label: "Confidence", value: confidenceLevel, color: confidenceLevel === "high" ? "hsl(145 55% 45%)" : confidenceLevel === "low" ? "hsl(25 70% 50%)" : "hsl(215 60% 50%)" },
                      { icon: Brain, label: "Retention", value: retentionLevel, color: retentionLevel === "strong" ? "hsl(145 55% 45%)" : retentionLevel === "low" ? "hsl(25 70% 50%)" : "hsl(265 55% 55%)" },
                      { icon: TrendingUp, label: "Block", value: blockStrength, color: blockStrength === "strong" ? "hsl(145 55% 45%)" : blockStrength === "weak" ? "hsl(25 70% 50%)" : "hsl(215 60% 50%)" },
                    ].map((item, i) => (
                      <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                        className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
                        <item.icon className="h-4 w-4 mx-auto mb-1" style={{ color: item.color }} />
                        <p className="text-xs font-semibold capitalize" style={{ color: item.color }}>{item.value}</p>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: c.subtext }}>{item.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Strategy Explanation */}
                  <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: c.subtext }}>
                      Here's how we're approaching this for you:
                    </p>
                    {strategyLines.map((line, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
                        className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: "hsl(265 60% 55%)" }} />
                        <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>{line}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Step Sequence Preview */}
                  <div className="rounded-2xl p-4" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: c.subtext }}>Your Sequence</p>
                    <div className="flex flex-wrap gap-2">
                      {rules.stepOrder.map((stepKey, i) => (
                        <motion.div key={stepKey} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.06 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{
                            background: i === 0 ? "linear-gradient(135deg, hsl(265 60% 55%), hsl(215 70% 50%))" : "hsl(var(--muted))",
                            color: i === 0 ? "white" : c.bodyText,
                          }}>
                          {STEP_ICONS[stepKey]}
                          {STEP_LABELS[stepKey] || stepKey}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* V2: Recovery mode indicator (additive — only shows when active) */}
                  {context?.recoveryMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl"
                      style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <Shield className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(265 60% 55%)" }} />
                      <p className="text-xs" style={{ color: c.bodyText }}>
                        Recovery mode is on — we'll go gentler and slower until you feel steady again.
                      </p>
                    </motion.div>
                  )}

                  {/* Weak block warning */}
                  {blockStrength === "weak" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "hsl(25 70% 95%)", border: "1px solid hsl(25 60% 80%)" }}>
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(25 70% 50%)" }} />
                      <p className="text-xs" style={{ color: "hsl(25 50% 30%)" }}>This is a growth area — we'll spend extra time reinforcing the key concepts.</p>
                    </motion.div>
                  )}

                  {/* CTA */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="flex flex-col items-center gap-3 pt-2">
                    <Button size="lg" onClick={handleStartLearning}
                      className="w-full gap-2 text-base py-6 shadow-lg"
                      style={{ background: "linear-gradient(135deg, hsl(265 60% 55%), hsl(215 70% 50%))", color: "white" }}>
                      Begin Learning <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                      className="text-sm" style={{ color: c.subtext }}>
                      Maybe Later
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOrchestrator;
