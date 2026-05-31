import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCw, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { saveConfidenceRating } from "@/lib/confidence/saveConfidenceRating";

interface FlashcardTerm {
  id: string;
  term: string;
  definition: string;
  section_id?: string | null;
  block_number?: number | null;
}

export default function FlashcardDeck({ terms }: { terms: FlashcardTerm[] }) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [needReviewIds, setNeedReviewIds] = useState<Set<string>>(new Set());

  const shuffled = useMemo(() => [...terms].sort(() => Math.random() - 0.5), [terms]);
  const card = shuffled[index];
  const total = shuffled.length;
  const done = index >= total;

  const advance = () => {
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const mark = async (got: boolean) => {
    if (!card || !user) return advance();
    setReviewedIds((s) => new Set(s).add(card.id));
    if (!got) setNeedReviewIds((s) => new Set(s).add(card.id));
    await saveConfidenceRating({
      userId: user.id,
      surface: "practice",
      questionRef: `flashcard:${card.id}`,
      questionText: card.term,
      termId: card.id,
      sectionId: card.section_id ?? null,
      blockNumber: card.block_number ?? null,
      isCorrect: got,
      confidence: got ? 4 : 2,
    });
    advance();
  };

  if (!total) {
    return <p className="text-sm text-muted-foreground">No cards available yet.</p>;
  }

  if (done) {
    return (
      <Card className="p-8 text-center">
        <h3 className="font-display text-2xl font-bold mb-2">Deck complete</h3>
        <p className="text-muted-foreground mb-4">
          You reviewed {reviewedIds.size} cards. {needReviewIds.size} flagged for another pass.
        </p>
        <Button onClick={() => { setIndex(0); setReviewedIds(new Set()); setNeedReviewIds(new Set()); }}>
          <RotateCw className="h-4 w-4 mr-1" /> Restart deck
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Card {index + 1} of {total}</span>
        <span>{needReviewIds.size} to review</span>
      </div>

      <div className="relative h-[280px]" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${flipped ? "back" : "front"}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setFlipped((f) => !f)}
            className="absolute inset-0 cursor-pointer"
          >
            <Card className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-card border-2 hover:border-primary/40 transition">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                {flipped ? "Definition" : "Term"}
              </div>
              <p className="font-display text-2xl font-bold text-foreground leading-snug">
                {flipped ? card.definition : card.term}
              </p>
              <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <RotateCw className="h-3 w-3" /> Tap to flip
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => mark(false)} className="border-2">
            <X className="h-4 w-4 mr-1" /> Need review
          </Button>
          <Button onClick={() => mark(true)}>
            <Check className="h-4 w-4 mr-1" /> Got it
          </Button>
        </div>
      ) : (
        <Button variant="ghost" className="w-full" onClick={() => setFlipped(true)}>
          Reveal definition <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
