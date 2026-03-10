import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Grid3X3 } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const CrosswordClues = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [allChecked, setAllChecked] = useState(false);

  const updateAnswer = (i: number, val: string) => {
    setAnswers((prev) => new Map(prev).set(i, val));
  };

  const checkAll = () => {
    setAllChecked(true);
    const r = new Set<number>();
    terms.forEach((_, i) => r.add(i));
    setRevealed(r);
  };

  const reset = () => {
    setAnswers(new Map());
    setRevealed(new Set());
    setAllChecked(false);
  };

  const correctCount = terms.filter((t, i) =>
    (answers.get(i) || "").trim().toLowerCase() === t.term.toLowerCase()
  ).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Crossword Clues</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>Read each clue and type the matching term. Check them all when ready.</p>

      <div className="space-y-3 mb-4">
        {terms.map((term, i) => {
          const userAnswer = answers.get(i) || "";
          const isCorrect = userAnswer.trim().toLowerCase() === term.term.toLowerCase();
          const isRevealed = revealed.has(i);

          return (
            <Card key={term.id} className="border-0 shadow-sm" style={{ background: isRevealed ? (isCorrect ? "hsl(145 40% 96%)" : "hsl(0 40% 97%)") : "white" }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: c.iconBg, color: c.iconColor }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed mb-2" style={{ color: c.heading }}>
                      {term.definition.slice(0, 120)}{term.definition.length > 120 ? "..." : ""}
                    </p>
                    <Input
                      placeholder={`${term.term.length} letters`}
                      value={userAnswer}
                      onChange={(e) => updateAnswer(i, e.target.value)}
                      disabled={allChecked}
                      className="text-sm"
                      style={isRevealed ? { borderColor: isCorrect ? "hsl(145 50% 55%)" : "hsl(0 50% 60%)" } : {}}
                    />
                    {isRevealed && !isCorrect && (
                      <p className="text-xs mt-1 font-medium" style={{ color: "hsl(0 50% 50%)" }}>
                        Answer: {term.term}
                      </p>
                    )}
                  </div>
                  {isRevealed && (
                    <CheckCircle2 className="h-5 w-5 mt-1 flex-shrink-0" style={{ color: isCorrect ? "hsl(145 60% 35%)" : "hsl(0 50% 60%)" }} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allChecked ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-md mb-4" style={{ background: "hsl(42 50% 97%)" }}>
            <CardContent className="p-4 text-center">
              <Grid3X3 className="h-8 w-8 mx-auto mb-2" style={{ color: c.accent }} />
              <p className="font-display text-xl font-bold" style={{ color: c.heading }}>{correctCount}/{terms.length} correct</p>
              <BrainNote text="Working through clues one by one exercises your recall muscle for each term. The ones you missed are the ones your brain needs to see again." />
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={reset} style={{ background: c.button, color: "white" }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </motion.div>
      ) : (
        <Button className="w-full py-5" onClick={checkAll} style={{ background: c.button, color: "white" }}>
          Check All Answers
        </Button>
      )}
    </motion.div>
  );
};

export default CrosswordClues;
