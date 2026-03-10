import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RotateCcw, Shuffle } from "lucide-react";
import BrainNote from "@/components/BrainNote";

interface Term { id: string; term: string; definition: string; }

const scramble = (word: string) => {
  const arr = word.toUpperCase().split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join(" ");
};

const WordScramble = ({ terms, colors: c }: { terms: Term[]; colors: any }) => {
  const [shuffled, setShuffled] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [scrambled, setScrambled] = useState("");

  useEffect(() => {
    const s = [...terms].sort(() => Math.random() - 0.5);
    setShuffled(s);
    if (s.length > 0) setScrambled(scramble(s[0].term));
  }, [terms]);

  const current = shuffled[currentIndex];
  const done = currentIndex >= shuffled.length;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setCorrect(answer.trim().toLowerCase() === current.term.toLowerCase());
    setSubmitted(true);
  };

  const handleNext = () => {
    const next = currentIndex + 1;
    setCurrentIndex(next);
    setAnswer("");
    setSubmitted(false);
    if (next < shuffled.length) setScrambled(scramble(shuffled[next].term));
  };

  const reset = () => {
    const s = [...terms].sort(() => Math.random() - 0.5);
    setShuffled(s);
    setCurrentIndex(0);
    setAnswer("");
    setSubmitted(false);
    if (s.length > 0) setScrambled(scramble(s[0].term));
  };

  if (done || shuffled.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>All Unscrambled! 🎉</h3>
          <Button className="mt-4" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" /> Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Word Scramble</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>{currentIndex + 1}/{shuffled.length} — Unscramble the term</p>

      <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            <Shuffle className="h-4 w-4" style={{ color: c.accent }} />
            <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: c.accent }}>Scrambled</span>
          </div>
          <p className="font-display text-2xl font-bold tracking-widest mb-4" style={{ color: c.heading }}>{scrambled}</p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: c.subtext }}>Clue: {current.definition.slice(0, 100)}...</p>
          <Input placeholder="Type the term..." value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()} disabled={submitted} className="text-base text-center" />
        </CardContent>
      </Card>

      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: correct ? c.successBg : c.wrongBg }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {correct ? (
                  <><CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} /><span className="font-medium" style={{ color: c.successHeading }}>Correct! ✨</span></>
                ) : (
                  <><XCircle className="h-5 w-5" style={{ color: c.wrongBorder }} /><span className="text-sm" style={{ color: c.heading }}>The answer was <strong>{current.term}</strong></span></>
                )}
              </div>
              <BrainNote text="Unscrambling letters forces your brain to reconstruct the word from scratch. This deeper processing makes the term stick better than just reading it." />
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={handleNext} style={{ background: c.button, color: "white" }}>Next</Button>
        </motion.div>
      ) : (
        <Button className="w-full py-5" onClick={handleSubmit} disabled={!answer.trim()} style={{ background: c.button, color: "white" }}>Check Answer</Button>
      )}
    </motion.div>
  );
};

export default WordScramble;
