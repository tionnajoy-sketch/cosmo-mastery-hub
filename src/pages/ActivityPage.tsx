import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, Zap, PenLine, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface Term {
  id: string;
  term: string;
  definition: string;
}

type ActivityType = "matching" | "flashcard" | "fillin";

const ActivityPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const [sectionName, setSectionName] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [activity, setActivity] = useState<ActivityType | null>(null);

  useEffect(() => {
    if (!id || !block) return;
    const fetch = async () => {
      const [sRes, tRes] = await Promise.all([
        supabase.from("sections").select("name").eq("id", id).single(),
        supabase.from("terms").select("id, term, definition").eq("section_id", id).eq("block_number", Number(block)).order("order"),
      ]);
      if (sRes.data) setSectionName(sRes.data.name);
      if (tRes.data) setTerms(tRes.data);
    };
    fetch();
  }, [id, block]);

  if (!activity) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(270 30% 92%), hsl(280 20% 96%))" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate(`/section/${id}/study/${block}`)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Study
          </Button>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(270 30% 22%)" }}>
              Practice Activities
            </h1>
            <p className="text-sm mb-6" style={{ color: "hsl(270 15% 45%)" }}>
              {sectionName} — Block {block}. Choose an activity to strengthen your understanding before the quiz.
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              { key: "matching" as ActivityType, icon: Shuffle, label: "Matching Game", desc: "Match each term to its definition by tapping pairs." },
              { key: "flashcard" as ActivityType, icon: Zap, label: "Flashcard Drill", desc: "Flip cards to test your recall. Mark what you know." },
              { key: "fillin" as ActivityType, icon: PenLine, label: "Fill in the Blank", desc: "Type the missing term from its definition." },
            ].map((a, i) => (
              <motion.div key={a.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: "white", borderColor: "hsl(270 20% 85%)" }} onClick={() => setActivity(a.key)}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-3 rounded-full" style={{ background: "hsl(270 30% 92%)" }}>
                      <a.icon className="h-6 w-6" style={{ color: "hsl(270 40% 45%)" }} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(270 30% 22%)" }}>{a.label}</h3>
                      <p className="text-sm" style={{ color: "hsl(270 15% 50%)" }}>{a.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(270 30% 92%), hsl(280 20% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => setActivity(null)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Button>
        {activity === "matching" && <MatchingGame terms={terms} />}
        {activity === "flashcard" && <FlashcardDrill terms={terms} />}
        {activity === "fillin" && <FillInBlank terms={terms} />}
      </div>
    </div>
  );
};

// ============ MATCHING GAME ============
const MatchingGame = ({ terms }: { terms: Term[] }) => {
  const [shuffledDefs, setShuffledDefs] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    setShuffledDefs([...terms].sort(() => Math.random() - 0.5));
  }, [terms]);

  const handleDefClick = (defTermId: string) => {
    if (!selectedTerm || matched.has(defTermId)) return;
    if (selectedTerm === defTermId) {
      setMatched((prev) => new Set([...prev, defTermId]));
      setSelectedTerm(null);
    } else {
      setWrong(defTermId);
      setTimeout(() => { setWrong(null); setSelectedTerm(null); }, 800);
    }
  };

  const allMatched = matched.size === terms.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-4" style={{ color: "hsl(270 30% 22%)" }}>Matching Game</h2>
      <p className="text-sm mb-6" style={{ color: "hsl(270 15% 45%)" }}>Tap a term, then tap its matching definition.</p>

      {allMatched ? (
        <Card className="border-0 shadow-md" style={{ background: "hsl(145 40% 94%)" }}>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(145 60% 35%)" }} />
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: "hsl(145 40% 25%)" }}>All Matched! 🎉</h3>
            <p className="text-sm" style={{ color: "hsl(145 20% 35%)" }}>You nailed it. You're ready to move on.</p>
            <Button className="mt-4" onClick={() => { setMatched(new Set()); setShuffledDefs([...terms].sort(() => Math.random() - 0.5)); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(270 30% 40%)" }}>Terms</p>
            {terms.map((t) => (
              <button
                key={t.id}
                disabled={matched.has(t.id)}
                onClick={() => setSelectedTerm(t.id)}
                className="w-full text-left p-3 rounded-lg text-sm font-medium transition-all border-2"
                style={{
                  background: matched.has(t.id) ? "hsl(145 40% 92%)" : selectedTerm === t.id ? "hsl(270 40% 88%)" : "white",
                  borderColor: matched.has(t.id) ? "hsl(145 40% 70%)" : selectedTerm === t.id ? "hsl(270 40% 55%)" : "hsl(270 15% 85%)",
                  color: matched.has(t.id) ? "hsl(145 30% 35%)" : "hsl(270 30% 22%)",
                  opacity: matched.has(t.id) ? 0.6 : 1,
                }}
              >
                {t.term}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "hsl(270 30% 40%)" }}>Definitions</p>
            {shuffledDefs.map((t) => (
              <button
                key={`def-${t.id}`}
                disabled={matched.has(t.id)}
                onClick={() => handleDefClick(t.id)}
                className="w-full text-left p-3 rounded-lg text-xs leading-relaxed transition-all border-2"
                style={{
                  background: matched.has(t.id) ? "hsl(145 40% 92%)" : wrong === t.id ? "hsl(0 50% 95%)" : "white",
                  borderColor: matched.has(t.id) ? "hsl(145 40% 70%)" : wrong === t.id ? "hsl(0 50% 60%)" : "hsl(270 15% 85%)",
                  color: "hsl(270 15% 30%)",
                  opacity: matched.has(t.id) ? 0.6 : 1,
                }}
              >
                {t.definition.slice(0, 80)}...
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============ FLASHCARD DRILL ============
const FlashcardDrill = ({ terms }: { terms: Term[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const done = known.size === terms.length;
  const current = terms[currentIndex];

  const markKnown = () => {
    setKnown((prev) => new Set([...prev, currentIndex]));
    goNext();
  };

  const goNext = () => {
    setFlipped(false);
    // Find next unknown
    let next = (currentIndex + 1) % terms.length;
    let attempts = 0;
    while (known.has(next) && attempts < terms.length) {
      next = (next + 1) % terms.length;
      attempts++;
    }
    setCurrentIndex(next);
  };

  if (done) {
    return (
      <Card className="border-0 shadow-md" style={{ background: "hsl(145 40% 94%)" }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(145 60% 35%)" }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: "hsl(145 40% 25%)" }}>All Cards Reviewed! 🌟</h3>
          <Button className="mt-4" onClick={() => { setKnown(new Set()); setCurrentIndex(0); setFlipped(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(270 30% 22%)" }}>Flashcard Drill</h2>
      <p className="text-sm mb-6" style={{ color: "hsl(270 15% 45%)" }}>
        {known.size}/{terms.length} mastered — Tap to flip
      </p>

      <div className="perspective-1000">
        <Card
          className="border-0 shadow-lg cursor-pointer min-h-[200px] flex items-center justify-center"
          style={{ background: flipped ? "hsl(42 60% 96%)" : "white" }}
          onClick={() => setFlipped(!flipped)}
        >
          <CardContent className="p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div key={flipped ? "back" : "front"} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.2 }}>
                {flipped ? (
                  <p className="text-base leading-relaxed" style={{ color: "hsl(42 15% 30%)" }}>{current.definition}</p>
                ) : (
                  <h3 className="font-display text-2xl font-bold" style={{ color: "hsl(270 30% 22%)" }}>{current.term}</h3>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 mt-4">
        <Button className="flex-1 py-5" variant="outline" onClick={goNext} style={{ borderColor: "hsl(270 20% 75%)", color: "hsl(270 30% 35%)" }}>
          <XCircle className="h-4 w-4 mr-2" /> Still Learning
        </Button>
        <Button className="flex-1 py-5" onClick={markKnown} style={{ background: "hsl(145 40% 40%)", color: "white" }}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> I Know This
        </Button>
      </div>
    </motion.div>
  );
};

// ============ FILL IN THE BLANK ============
const FillInBlank = ({ terms }: { terms: Term[] }) => {
  const [shuffled, setShuffled] = useState<Term[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const done = currentIndex >= shuffled.length;

  useEffect(() => {
    setShuffled([...terms].sort(() => Math.random() - 0.5));
  }, [terms]);

  const current = shuffled[currentIndex];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    const isCorrect = answer.trim().toLowerCase() === current.term.toLowerCase();
    setCorrect(isCorrect);
    setSubmitted(true);
  };

  const handleNext = () => {
    setAnswer("");
    setSubmitted(false);
    setCurrentIndex((i) => i + 1);
  };

  if (done || shuffled.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: "hsl(145 40% 94%)" }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(145 60% 35%)" }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: "hsl(145 40% 25%)" }}>All Done! 🎉</h3>
          <Button className="mt-4" onClick={() => { setShuffled([...terms].sort(() => Math.random() - 0.5)); setCurrentIndex(0); setAnswer(""); setSubmitted(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(270 30% 22%)" }}>Fill in the Blank</h2>
      <p className="text-sm mb-6" style={{ color: "hsl(270 15% 45%)" }}>
        {currentIndex + 1}/{shuffled.length} — Type the term that matches this definition
      </p>

      <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
        <CardContent className="p-6">
          <p className="text-base leading-relaxed mb-4" style={{ color: "hsl(270 15% 25%)" }}>
            {current.definition}
          </p>
          <Input
            placeholder="Type the term..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
            disabled={submitted}
            className="text-base"
          />
        </CardContent>
      </Card>

      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: correct ? "hsl(145 40% 94%)" : "hsl(0 30% 96%)" }}>
            <CardContent className="p-4 flex items-center gap-2">
              {correct ? (
                <>
                  <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} />
                  <span className="font-medium" style={{ color: "hsl(145 40% 25%)" }}>Correct! ✨</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" style={{ color: "hsl(0 60% 45%)" }} />
                  <span className="text-sm" style={{ color: "hsl(0 30% 30%)" }}>
                    The answer was <strong>{current.term}</strong>. Keep studying — you'll get it!
                  </span>
                </>
              )}
            </CardContent>
          </Card>
          <Button className="w-full py-5" onClick={handleNext} style={{ background: "hsl(270 35% 45%)", color: "white" }}>
            Next
          </Button>
        </motion.div>
      ) : (
        <Button className="w-full py-5" onClick={handleSubmit} disabled={!answer.trim()} style={{ background: "hsl(270 35% 45%)", color: "white" }}>
          Check Answer
        </Button>
      )}
    </motion.div>
  );
};

export default ActivityPage;
