import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { saveConfidenceRating } from "@/lib/confidence/saveConfidenceRating";

interface MCQTerm {
  id: string;
  term: string;
  definition: string;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  quiz_answer?: string | null;
  section_id?: string | null;
  block_number?: number | null;
}

interface Built {
  termId: string;
  prompt: string;
  options: string[];
  answer: string;
  sectionId?: string | null;
  blockNumber?: number | null;
}

function buildQuestions(terms: MCQTerm[]): Built[] {
  return terms
    .map((t) => {
      // Prefer stored quiz_question, otherwise build from definition
      if (t.quiz_question && t.quiz_options?.length && t.quiz_answer) {
        return {
          termId: t.id,
          prompt: t.quiz_question,
          options: [...t.quiz_options].sort(() => Math.random() - 0.5),
          answer: t.quiz_answer,
          sectionId: t.section_id,
          blockNumber: t.block_number,
        };
      }
      if (!t.term || !t.definition) return null;
      const distractors = terms
        .filter((x) => x.id !== t.id && x.term)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((x) => x.term);
      const opts = [t.term, ...distractors].sort(() => Math.random() - 0.5);
      return {
        termId: t.id,
        prompt: `Which term matches this definition?\n"${t.definition}"`,
        options: opts,
        answer: t.term,
        sectionId: t.section_id,
        blockNumber: t.block_number,
      };
    })
    .filter(Boolean) as Built[];
}

export default function MultipleChoiceRunner({ terms, limit = 10 }: { terms: MCQTerm[]; limit?: number }) {
  const { user } = useAuth();
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => buildQuestions(terms).sort(() => Math.random() - 0.5).slice(0, limit),
    [terms, limit, round]
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[index];
  const done = index >= questions.length;

  const pick = async (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    const isCorrect = opt === q.answer;
    if (isCorrect) setCorrectCount((c) => c + 1);
    if (user) {
      await saveConfidenceRating({
        userId: user.id,
        surface: "practice",
        questionRef: `mcq:${q.termId}`,
        questionText: q.prompt,
        termId: q.termId,
        sectionId: q.sectionId ?? null,
        blockNumber: q.blockNumber ?? null,
        isCorrect,
        confidence: isCorrect ? 4 : 2,
      });
    }
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  if (!questions.length) {
    return <p className="text-sm text-muted-foreground">No questions available yet.</p>;
  }

  if (done) {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <Card className="p-8 text-center">
        <h3 className="font-display text-2xl font-bold mb-2">{pct}%</h3>
        <p className="text-muted-foreground mb-4">
          {correctCount} of {questions.length} correct
        </p>
        <Button onClick={() => { setRound((r) => r + 1); setIndex(0); setCorrectCount(0); }}>
          <RotateCw className="h-4 w-4 mr-1" /> New set
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{correctCount} correct</span>
      </div>
      <Card className="p-6 bg-card">
        <p className="font-display text-lg leading-relaxed text-card-foreground whitespace-pre-line mb-5">
          {q.prompt}
        </p>
        <div className="grid gap-2">
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === q.answer;
            const showState = picked !== null && (isPicked || isAnswer);
            return (
              <button
                key={opt}
                onClick={() => pick(opt)}
                disabled={picked !== null}
                className={`text-left px-4 py-3 rounded-xl border-2 transition text-sm ${
                  showState && isAnswer
                    ? "border-primary bg-primary/10 text-foreground"
                    : showState && isPicked && !isAnswer
                    ? "border-destructive bg-destructive/10 text-foreground"
                    : "border-border bg-background hover:border-foreground text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{opt}</span>
                  {showState && isAnswer && <Check className="h-4 w-4 text-primary" />}
                  {showState && isPicked && !isAnswer && <X className="h-4 w-4 text-destructive" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence>
        {picked && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button className="w-full" onClick={next}>
              {index + 1 === questions.length ? "Finish" : "Next question"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
