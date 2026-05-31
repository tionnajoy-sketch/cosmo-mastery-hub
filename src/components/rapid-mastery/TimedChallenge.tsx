import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Timer, Zap, RotateCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { saveConfidenceRating } from "@/lib/confidence/saveConfidenceRating";

interface TimedTerm {
  id: string;
  term: string;
  definition: string;
  section_id?: string | null;
  block_number?: number | null;
}

const DURATION = 60;

export default function TimedChallenge({ terms }: { terms: TimedTerm[] }) {
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [round, setRound] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const pool = useMemo(() => [...terms].sort(() => Math.random() - 0.5), [terms, round]);

  const buildQ = (i: number) => {
    const t = pool[i % pool.length];
    if (!t) return null;
    const distractors = pool
      .filter((x) => x.id !== t.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x.term);
    const opts = [t.term, ...distractors].sort(() => Math.random() - 0.5);
    return { term: t, options: opts, answer: t.term };
  };

  const q = useMemo(() => buildQ(index), [index, pool]);

  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      setPhase("done");
      if (user) addCoins(correct);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, correct, user, addCoins]);

  const start = () => {
    setPhase("running");
    setSecondsLeft(DURATION);
    setIndex(0);
    setCorrect(0);
    setAnswered(0);
    setPicked(null);
  };

  const pick = async (opt: string) => {
    if (!q || picked) return;
    setPicked(opt);
    const isCorrect = opt === q.answer;
    if (isCorrect) setCorrect((c) => c + 1);
    setAnswered((a) => a + 1);
    if (user) {
      saveConfidenceRating({
        userId: user.id,
        surface: "practice",
        questionRef: `timed:${q.term.id}`,
        questionText: q.term.definition,
        termId: q.term.id,
        sectionId: q.term.section_id ?? null,
        blockNumber: q.term.block_number ?? null,
        isCorrect,
        confidence: isCorrect ? 4 : 2,
      });
    }
    setTimeout(() => {
      setPicked(null);
      setIndex((i) => i + 1);
    }, 350);
  };

  if (!pool.length) {
    return <p className="text-sm text-muted-foreground">No terms available yet.</p>;
  }

  if (phase === "idle") {
    return (
      <Card className="p-8 text-center">
        <Zap className="h-10 w-10 mx-auto mb-3 text-amber-500" />
        <h3 className="font-display text-2xl font-bold mb-1">60-second sprint</h3>
        <p className="text-muted-foreground text-sm mb-5">
          Answer as many as you can. Every correct answer = 1 coin.
        </p>
        <Button onClick={start} size="lg">
          <Timer className="h-4 w-4 mr-1" /> Start sprint
        </Button>
      </Card>
    );
  }

  if (phase === "done") {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-display text-3xl font-bold mb-1">+{correct} coins</h3>
        <p className="text-muted-foreground mb-4">
          {correct}/{answered} correct in 60 seconds.
        </p>
        <Button onClick={() => { setRound((r) => r + 1); setPhase("idle"); }}>
          <RotateCw className="h-4 w-4 mr-1" /> Sprint again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground inline-flex items-center gap-1">
          <Timer className="h-3 w-3" /> {secondsLeft}s
        </span>
        <span className="text-muted-foreground">
          {correct} correct · {answered} answered
        </span>
      </div>
      <Progress value={(secondsLeft / DURATION) * 100} className="h-1.5" />

      {q && (
        <Card className="p-5 bg-card">
          <p className="font-display text-base leading-relaxed text-card-foreground mb-4">
            {q.term.definition}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const isPicked = picked === opt;
              const isAnswer = opt === q.answer;
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  disabled={!!picked}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                    picked && isAnswer
                      ? "border-primary bg-primary/10"
                      : picked && isPicked && !isAnswer
                      ? "border-destructive bg-destructive/10"
                      : "border-border bg-background hover:border-foreground"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
