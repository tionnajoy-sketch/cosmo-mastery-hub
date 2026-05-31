import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, RotateCw } from "lucide-react";

interface MatchingTerm {
  id: string;
  term: string;
  definition: string;
}

const PAIR_COUNT = 5;

export default function MatchingBoard({ terms }: { terms: MatchingTerm[] }) {
  const [round, setRound] = useState(0);
  const pool = useMemo(() => {
    const shuffled = [...terms].sort(() => Math.random() - 0.5).slice(0, PAIR_COUNT);
    return shuffled;
  }, [terms, round]);

  const [defs, setDefs] = useState<MatchingTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);

  useEffect(() => {
    setDefs([...pool].sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelectedTerm(null);
    setWrongPair(null);
  }, [pool]);

  const pickDef = (defId: string) => {
    if (!selectedTerm || matched.has(defId)) return;
    if (selectedTerm === defId) {
      const next = new Set(matched).add(defId);
      setMatched(next);
      setSelectedTerm(null);
    } else {
      setWrongPair([selectedTerm, defId]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
      }, 600);
    }
  };

  const done = matched.size === pool.length && pool.length > 0;

  if (!pool.length) {
    return <p className="text-sm text-muted-foreground">No terms available yet.</p>;
  }

  if (done) {
    return (
      <Card className="p-8 text-center">
        <Check className="h-10 w-10 mx-auto mb-3 text-primary" />
        <h3 className="font-display text-2xl font-bold mb-2">All matched</h3>
        <p className="text-muted-foreground mb-4">{pool.length}/{pool.length} pairs locked in.</p>
        <Button onClick={() => setRound((r) => r + 1)}>
          <RotateCw className="h-4 w-4 mr-1" /> Next round
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        Match each term to its definition · {matched.size}/{pool.length}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Terms</p>
          {pool.map((t) => {
            const isMatched = matched.has(t.id);
            const isSelected = selectedTerm === t.id;
            const isWrong = wrongPair?.[0] === t.id;
            return (
              <motion.button
                key={t.id}
                disabled={isMatched}
                onClick={() => setSelectedTerm(t.id)}
                animate={isWrong ? { x: [-4, 4, -3, 3, 0] } : {}}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition text-sm font-medium ${
                  isMatched
                    ? "bg-primary/10 border-primary/30 text-muted-foreground line-through"
                    : isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : isWrong
                    ? "bg-destructive/10 border-destructive text-foreground"
                    : "bg-card border-border hover:border-foreground"
                }`}
              >
                {t.term}
              </motion.button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Definitions</p>
          {defs.map((d) => {
            const isMatched = matched.has(d.id);
            const isWrong = wrongPair?.[1] === d.id;
            return (
              <motion.button
                key={d.id}
                disabled={isMatched}
                onClick={() => pickDef(d.id)}
                animate={isWrong ? { x: [-4, 4, -3, 3, 0] } : {}}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition text-xs leading-snug ${
                  isMatched
                    ? "bg-primary/10 border-primary/30 text-muted-foreground line-through"
                    : isWrong
                    ? "bg-destructive/10 border-destructive text-foreground"
                    : "bg-card border-border hover:border-foreground"
                }`}
              >
                {d.definition}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
