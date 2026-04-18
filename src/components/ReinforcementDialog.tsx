import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, CheckCircle2, XCircle, Lock, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReinforcement, type ReinforcementQuestion } from "@/hooks/useReinforcement";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import { shuffleOptions } from "@/lib/shuffleOptions";

interface Props {
  open: boolean;
  /* Closing is BLOCKED until the learner answers correctly OR exhausts cycles. */
  onResolved: (result: { passed: boolean; cyclesUsed: number }) => void;
  termId: string;
  term: string;
  definition?: string;
  metaphor?: string;
  missedQuestion: string;
  missedAnswerExplanation?: string;
}

const MAX_CYCLES = 3;

const ReinforcementDialog = ({
  open,
  onResolved,
  termId,
  term,
  definition,
  metaphor,
  missedQuestion,
  missedAnswerExplanation,
}: Props) => {
  const { generateReinforcement, recordCorrect, recordIncorrect } = useReinforcement();
  const { updateDNA } = useDNAAdaptation();
  const [cycle, setCycle] = useState(1);
  const [content, setContent] = useState<ReinforcementQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<"lesson" | "quiz" | "feedback">("lesson");

  // Load reinforcement content when the dialog opens or cycle advances
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSelected(null);
    setPhase("lesson");
    generateReinforcement({
      term,
      definition,
      metaphor,
      missedQuestion,
      missedAnswerExplanation,
      cycle,
    }).then((q) => {
      if (!cancelled) {
        setContent(q);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cycle]);

  // Defensive shuffle: even if the AI biases the correct answer to "A",
  // we re-randomize positions per-question so learners can't pattern-match.
  const shuffled = useMemo(() => {
    if (!content) return null;
    return shuffleOptions(
      content.options,
      content.correctOption,
      `${termId}-cycle-${cycle}`,
    );
  }, [content, termId, cycle]);

  const handleAnswer = async (key: string) => {
    if (selected || !content || !shuffled) return;
    setSelected(key);
    const correct = key === shuffled.correctLetter;
    setPhase("feedback");

    if (correct) {
      await recordCorrect(termId, true);
      // Reinforcement success boosts retention + confidence MORE than standard correct
      updateDNA({ quizCorrect: true, layerCompleted: "quiz", reflectionLength: 60 });
      // Brief celebration delay then resolve
      setTimeout(() => onResolved({ passed: true, cyclesUsed: cycle }), 1400);
    } else {
      await recordIncorrect(termId);
      updateDNA({ quizCorrect: false, layerCompleted: "quiz" });
      if (cycle >= MAX_CYCLES) {
        // Safeguard: exhausted cycles → exit to guided/recovery mode
        setTimeout(() => onResolved({ passed: false, cyclesUsed: cycle }), 1800);
      }
    }
  };

  const handleNextCycle = () => {
    setCycle((c) => c + 1);
  };

  const isCorrect = !!(content && shuffled && selected === shuffled.correctLetter);
  const exhausted = cycle >= MAX_CYCLES && phase === "feedback" && !isCorrect;

  return (
    <Dialog open={open} onOpenChange={() => { /* locked — cannot close */ }}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Lock className="h-4 w-4 text-amber-600" />
            Quick Reinforcement
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Cycle {cycle} of {MAX_CYCLES}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-3 h-6 w-6 animate-pulse text-primary" />
            TJ is preparing a fresh approach...
          </div>
        )}

        {!loading && content && (
          <AnimatePresence mode="wait">
            {phase === "lesson" && (
              <motion.div
                key="lesson"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Card className="border-0 shadow-sm" style={{ background: "hsl(42 50% 96%)" }}>
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-amber-700" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                        New Approach: {content.approach}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {content.microLesson}
                    </p>
                  </CardContent>
                </Card>
                <Button onClick={() => setPhase("quiz")} className="w-full">
                  I'm ready — re-test me
                </Button>
              </motion.div>
            )}

            {phase === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {content.difficulty} question
                </p>
                <p className="text-sm font-medium leading-relaxed">{content.question}</p>
                <div className="space-y-2 pt-2">
                  {(shuffled?.options ?? []).map((opt) => (
                    <button
                      key={opt.letter}
                      onClick={() => handleAnswer(opt.letter)}
                      className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span className="mr-2 font-semibold text-primary">{opt.letter}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card
                  className="border-0 shadow-sm"
                  style={{
                    background: isCorrect ? "hsl(145 40% 94%)" : "hsl(0 50% 96%)",
                  }}
                >
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-700" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-700" />
                      )}
                      <span className="font-semibold">
                        {isCorrect ? "You got it!" : "Not quite — let's try again."}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {content.explanation}
                    </p>
                  </CardContent>
                </Card>

                {isCorrect && (
                  <p className="text-center text-sm text-muted-foreground">
                    <Heart className="mr-1 inline h-3.5 w-3.5 text-rose-500" />
                    Reinforcement successful — moving on...
                  </p>
                )}

                {!isCorrect && !exhausted && (
                  <Button onClick={handleNextCycle} className="w-full">
                    Try a different angle (Cycle {cycle + 1})
                  </Button>
                )}

                {exhausted && (
                  <div className="space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      That's okay — we'll switch to guided mode and revisit this later.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onResolved({ passed: false, cyclesUsed: cycle })}
                      className="w-full"
                    >
                      Continue in guided mode
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReinforcementDialog;
