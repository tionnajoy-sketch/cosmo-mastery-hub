/* ───────────────────────────────────────────────────────────────────
 * StrengthenLayerDialog — "Strengthen This Layer" reinforcement loop.
 *
 * Triggered when Recall Reconstruction (or another check) scores < 60%.
 * Rotates the re-teach format on each attempt:
 *   Attempt 1 → Micro Breakdown
 *   Attempt 2 → Metaphor
 *   Attempt 3 → Visual
 * After re-teach, a one-question Micro Check gates progress.
 *   • Pass  → return to lesson (recall +1, confidence +1)
 *   • Fail 3x → flag weakness but allow progress
 * ─────────────────────────────────────────────────────────────────── */

import { useMemo, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, XCircle, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { useBrainStrengths } from "@/hooks/useBrainStrengths";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type TeachMode = "micro" | "metaphor" | "visual";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termId: string;
  termTitle: string;
  definition: string;
  metaphor?: string;
  visualDesc?: string;
  microBreakdown?: string;
  imageUrl?: string;
  /** Called with passed=true if learner completed the micro check correctly,
   *  or passed=false if they bailed out after 3 failed attempts (allowed to continue). */
  onResolved: (args: { passed: boolean; attempts: number }) => void;
}

const TEACH_SEQUENCE: TeachMode[] = ["micro", "metaphor", "visual"];

const TEACH_LABEL: Record<TeachMode, string> = {
  micro: "Micro Breakdown",
  metaphor: "Memorable Metaphor",
  visual: "Visual Anchor",
};

/** Build a single 3-option micro-check. Distractors are intentionally generic
 *  so the choice cleanly tests "did the function land?" */
function buildMicroCheck(termTitle: string, definition: string) {
  // Pull a function-y phrase from the definition (first comma- or period-separated chunk).
  const fnPhrase = (definition || "").split(/[,.;]/)[0]?.trim() || `what ${termTitle} actually does`;
  const correct = `It is responsible for ${fnPhrase.replace(/^it is\s+/i, "")}`.slice(0, 110);
  return {
    question: `${termTitle} is primarily responsible for ______.`,
    options: [
      { letter: "A", text: correct, correct: true },
      { letter: "B", text: "Storing long-term emotional memory", correct: false },
      { letter: "C", text: "Producing digestive enzymes", correct: false },
    ],
  };
}

export const StrengthenLayerDialog = ({
  open,
  onOpenChange,
  termId,
  termTitle,
  definition,
  metaphor,
  visualDesc,
  microBreakdown,
  imageUrl,
  onResolved,
}: Props) => {
  const { user } = useAuth();
  const { applyManualDelta } = useBrainStrengths();
  const [attempt, setAttempt] = useState(0);              // 0..2 → which TEACH_SEQUENCE entry
  const [phase, setPhase] = useState<"teach" | "check">("teach");
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<{ passed: boolean } | null>(null);

  // Reset whenever the dialog re-opens for a fresh trigger.
  useEffect(() => {
    if (open) {
      setAttempt(0);
      setPhase("teach");
      setSelected(null);
      setRevealed(false);
      setDone(null);
    }
  }, [open]);

  const teachMode = TEACH_SEQUENCE[Math.min(attempt, TEACH_SEQUENCE.length - 1)];
  const check = useMemo(() => buildMicroCheck(termTitle, definition), [termTitle, definition]);

  const teachContent = useMemo(() => {
    switch (teachMode) {
      case "micro":
        return microBreakdown?.trim() || (definition || "")
          .split(/[,;.]/)
          .filter((s) => s.trim().length > 0)
          .slice(0, 3)
          .map((s, i) => `• ${s.trim()}`)
          .join("\n") || `• Core idea: ${termTitle}`;
      case "metaphor":
        return metaphor?.trim() || `Think of ${termTitle} like a familiar object in daily life that does the same job.`;
      case "visual":
        return visualDesc?.trim() || `Picture ${termTitle} as a clear shape with the function flowing through it.`;
    }
  }, [teachMode, microBreakdown, metaphor, visualDesc, termTitle, definition]);

  const persistOutcome = useCallback(async (passed: boolean) => {
    if (user) {
      // Update the most recent recall_attempt for this term with the outcome.
      const { data: latest } = await (supabase as any)
        .from("recall_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("term_id", termId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.id) {
        await (supabase as any)
          .from("recall_attempts")
          .update({ reinforcement_passed: passed })
          .eq("id", latest.id);
      }
    }
    if (passed) {
      await applyManualDelta({ recall: 1, confidence: 1, retention: 1 });
    } else {
      // No punishment — we already tracked the weakness.
      await applyManualDelta({ engagement: 1 });
    }
  }, [user, termId, applyManualDelta]);

  const handleSelect = useCallback((letter: string, isCorrect: boolean) => {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    if (isCorrect) {
      setTimeout(async () => {
        await persistOutcome(true);
        setDone({ passed: true });
      }, 700);
    } else {
      setTimeout(() => {
        // Move to next teach mode if we have one left.
        if (attempt < TEACH_SEQUENCE.length - 1) {
          setAttempt((a) => a + 1);
          setPhase("teach");
          setSelected(null);
          setRevealed(false);
        } else {
          // 3 strikes → flag weakness, allow progress.
          (async () => { await persistOutcome(false); })();
          setDone({ passed: false });
        }
      }, 900);
    }
  }, [revealed, attempt, persistOutcome]);

  const handleClose = useCallback(() => {
    if (!done) return;
    onResolved({ passed: done.passed, attempts: attempt + 1 });
    onOpenChange(false);
  }, [done, attempt, onOpenChange, onResolved]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // LOCK: cannot close until resolved.
        if (!o && !done) return;
        if (!o) handleClose();
      }}
    >
      <DialogContent
        variant="fullscreen"
        onPointerDownOutside={(e) => { if (!done) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!done) e.preventDefault(); }}
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
          <div className="max-w-lg mx-auto space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(25 80% 50%), hsl(15 85% 55%))" }}
              >
                <Brain className="h-7 w-7 text-white" />
              </motion.div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "hsl(25 70% 45%)" }}>
                Strengthen This Layer
              </p>
              <h2 className="font-display text-2xl font-bold" style={{ color: "hsl(220 25% 18%)" }}>
                Let's lock {termTitle} in.
              </h2>
              <p className="text-sm italic" style={{ color: "hsl(220 15% 40%)" }}>
                You understood parts of this — the full connection isn't solid yet.
                Attempt {attempt + 1} of 3 · {TEACH_LABEL[teachMode]}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!done && phase === "teach" && (
                <motion.div
                  key={`teach-${attempt}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  <article
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "white",
                      border: "1.5px solid hsl(25 60% 80%)",
                      boxShadow: "0 12px 30px -12px hsl(0 0% 0% / 0.18)",
                    }}
                  >
                    <header className="px-4 py-3" style={{ background: "hsl(25 60% 96%)", borderBottom: "1px solid hsl(25 60% 88%)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(25 70% 40%)" }}>
                        Focus Shift
                      </p>
                      <h3 className="font-display text-lg font-bold" style={{ color: "hsl(220 25% 18%)" }}>
                        Let's focus on what {termTitle} actually does.
                      </h3>
                    </header>
                    <div className="p-4">
                      {teachMode === "visual" && imageUrl ? (
                        <div className="space-y-3">
                          <img src={imageUrl} alt={termTitle} className="w-full rounded-xl" />
                          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "hsl(220 20% 22%)" }}>
                            {teachContent}
                          </p>
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "hsl(220 20% 22%)" }}>
                          {teachContent}
                        </p>
                      )}
                    </div>
                  </article>

                  <Button
                    className="w-full py-5 gap-2"
                    onClick={() => setPhase("check")}
                    style={{ background: "linear-gradient(135deg, hsl(25 80% 50%), hsl(15 85% 55%))", color: "white" }}
                  >
                    I've Got It — Quick Check <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {!done && phase === "check" && (
                <motion.div
                  key={`check-${attempt}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  <article className="rounded-2xl overflow-hidden bg-white" style={{ border: "1.5px solid hsl(220 15% 88%)" }}>
                    <header className="px-4 py-3" style={{ borderBottom: "1px solid hsl(220 15% 92%)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(265 60% 50%)" }}>
                        Micro Check
                      </p>
                      <h3 className="font-display text-base font-bold mt-1" style={{ color: "hsl(220 25% 18%)" }}>
                        {check.question}
                      </h3>
                    </header>
                    <div className="p-4 space-y-2">
                      {check.options.map((opt) => {
                        const isSelected = selected === opt.letter;
                        let bg = "hsl(var(--muted))";
                        let color = "hsl(var(--foreground))";
                        let border = "transparent";
                        if (revealed && opt.correct) { bg = "hsl(145 50% 92%)"; color = "hsl(145 45% 25%)"; border = "hsl(145 55% 50%)"; }
                        else if (revealed && isSelected && !opt.correct) { bg = "hsl(0 70% 95%)"; color = "hsl(0 60% 30%)"; border = "hsl(0 65% 55%)"; }
                        return (
                          <motion.button
                            key={opt.letter}
                            onClick={() => handleSelect(opt.letter, opt.correct)}
                            disabled={revealed}
                            whileHover={!revealed ? { scale: 1.01 } : {}}
                            whileTap={!revealed ? { scale: 0.99 } : {}}
                            className="w-full flex items-start gap-3 text-left p-3 rounded-xl transition-all"
                            style={{ background: bg, color, border: `2px solid ${border}` }}
                          >
                            <span className="font-display text-lg font-bold opacity-80">{opt.letter}</span>
                            <span className="text-sm flex-1 pt-0.5">{opt.text}</span>
                            {revealed && opt.correct && <CheckCircle2 className="h-4 w-4 mt-1" />}
                            {revealed && isSelected && !opt.correct && <XCircle className="h-4 w-4 mt-1" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </article>
                </motion.div>
              )}

              {done && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div
                    className="rounded-2xl p-5 text-center space-y-3"
                    style={{
                      background: done.passed ? "hsl(145 50% 96%)" : "hsl(35 80% 96%)",
                      border: `2px solid ${done.passed ? "hsl(145 55% 50%)" : "hsl(35 80% 60%)"}`,
                    }}
                  >
                    {done.passed ? (
                      <>
                        <Sparkles className="h-10 w-10 mx-auto" style={{ color: "hsl(145 55% 38%)" }} />
                        <h3 className="font-display text-xl font-bold" style={{ color: "hsl(145 45% 22%)" }}>
                          Pathway rebuilt.
                        </h3>
                        <p className="text-sm" style={{ color: "hsl(145 35% 28%)" }}>
                          Recall +1 · Confidence +1 · Retention +1
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-10 w-10 mx-auto" style={{ color: "hsl(35 80% 45%)" }} />
                        <h3 className="font-display text-xl font-bold" style={{ color: "hsl(35 60% 25%)" }}>
                          Flagged as a growth area.
                        </h3>
                        <p className="text-sm" style={{ color: "hsl(35 50% 28%)" }}>
                          You can keep learning — we'll bring this back during your next review.
                        </p>
                      </>
                    )}
                  </div>
                  <Button className="w-full py-5 gap-2" onClick={handleClose}
                    style={{ background: "linear-gradient(135deg, hsl(265 72% 48%), hsl(215 80% 42%))", color: "white" }}>
                    Continue Lesson <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrengthenLayerDialog;
