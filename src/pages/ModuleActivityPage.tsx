import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, Zap, PenLine, CheckCircle2, XCircle, RotateCcw, Grid3X3, Brain, Image, Lightbulb, FileText, Type, Sparkles, Heart, Shield } from "lucide-react";
import { pageColors } from "@/lib/colors";
import BrainNote from "@/components/BrainNote";
import WordScramble from "@/components/activities/WordScramble";
import CrosswordClues from "@/components/activities/CrosswordClues";
import OwnWords from "@/components/activities/OwnWords";
import BrainDump from "@/components/activities/BrainDump";
import PictureMatch from "@/components/activities/PictureMatch";
import MnemonicBuilder from "@/components/activities/MnemonicBuilder";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import SpeakButton from "@/components/SpeakButton";

const c = pageColors.activity;

interface Term { id: string; term: string; definition: string; }
type ActivityType = "matching" | "flashcard" | "fillin" | "scramble" | "crossword" | "ownwords" | "braindump" | "picturematch" | "mnemonic";

const cognitiveColors = {
  recall:   { bg: "hsl(350 50% 96%)", border: "hsl(350 55% 75%)", icon: "hsl(350 55% 48%)", iconBg: "hsl(350 50% 90%)" },
  vision:   { bg: "hsl(215 50% 96%)", border: "hsl(215 55% 72%)", icon: "hsl(215 55% 42%)", iconBg: "hsl(215 50% 88%)" },
  creative: { bg: "hsl(325 45% 96%)", border: "hsl(325 48% 72%)", icon: "hsl(325 50% 45%)", iconBg: "hsl(325 42% 88%)" },
  logic:    { bg: "hsl(48 60% 96%)", border: "hsl(48 55% 70%)", icon: "hsl(48 65% 38%)", iconBg: "hsl(48 55% 88%)" },
  motor:    { bg: "hsl(145 40% 96%)", border: "hsl(145 45% 68%)", icon: "hsl(145 50% 35%)", iconBg: "hsl(145 40% 88%)" },
};

const activityAccents = [
  cognitiveColors.vision, cognitiveColors.recall, cognitiveColors.recall,
  cognitiveColors.logic, cognitiveColors.logic, cognitiveColors.motor,
  cognitiveColors.recall, cognitiveColors.vision, cognitiveColors.creative,
];

const calmingMessages = [
  "Your brain learns best when your nervous system feels safe. Take a slow breath before you start. 🧠",
  "Repetition builds neural pathways. Each activity strengthens your memory like a muscle. 💪",
  "There's no rush. Your hippocampus encodes better when you're calm and focused. 🌿",
  "Every time you practice, your brain wraps myelin around the nerve fibers — making recall faster. ✨",
];

const ModuleActivityPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleTitle, setModuleTitle] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [activity, setActivity] = useState<ActivityType | null>(null);
  const [calmMessage] = useState(() => calmingMessages[Math.floor(Math.random() * calmingMessages.length)]);

  useEffect(() => {
    if (!id || !block) return;
    const fetchData = async () => {
      const [modRes, blocksRes] = await Promise.all([
        supabase.from("uploaded_modules").select("title").eq("id", id).single(),
        supabase.from("uploaded_module_blocks").select("id, term_title, definition").eq("module_id", id).eq("block_number", Number(block)),
      ]);
      if (modRes.data) setModuleTitle(modRes.data.title);
      if (blocksRes.data) setTerms(blocksRes.data.map((b) => ({ id: b.id, term: b.term_title, definition: b.definition })));
    };
    fetchData();
  }, [id, block]);

  const activities = [
    { key: "matching" as ActivityType, icon: Shuffle, label: "Matching Game", desc: "Match each term to its definition by tapping pairs." },
    { key: "flashcard" as ActivityType, icon: Zap, label: "Flashcard Drill", desc: "Flip cards to test your recall. Mark what you know." },
    { key: "fillin" as ActivityType, icon: PenLine, label: "Fill in the Blank", desc: "Type the missing term from its definition." },
    { key: "scramble" as ActivityType, icon: Type, label: "Word Scramble", desc: "Unscramble the letters to reveal the term." },
    { key: "crossword" as ActivityType, icon: Grid3X3, label: "Crossword Clues", desc: "Read clues and type the matching terms." },
    { key: "ownwords" as ActivityType, icon: FileText, label: "Write In Your Own Words", desc: "Explain each term in your own language." },
    { key: "braindump" as ActivityType, icon: Brain, label: "Brain Dump", desc: "List everything you remember, then compare." },
    { key: "picturematch" as ActivityType, icon: Image, label: "Picture Match", desc: "See an image and choose the matching term." },
    { key: "mnemonic" as ActivityType, icon: Lightbulb, label: "Build a Mnemonic", desc: "Create your own memory tricks for each term." },
  ];

  const totalActivities = activities.length;
  const pieData = [
    { name: "Tried", value: 0 },
    { name: "Available", value: totalActivities },
  ];
  const PIE_COLORS = ["hsl(262 45% 50%)", "hsl(262 18% 88%)"];

  if (!activity) {
    return (
      <div className="min-h-screen" style={{ background: c.gradient }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate(`/module/${id}`)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Module
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>Practice Activities</h1>
            <p className="text-sm mb-6" style={{ color: c.subtext }}>{moduleTitle} — Block {block}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-0 shadow-sm mb-8" style={{ background: "hsl(145 30% 96%)" }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full flex-shrink-0" style={{ background: "hsl(145 35% 88%)" }}>
                    <Shield className="h-5 w-5" style={{ color: "hsl(145 45% 38%)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "hsl(145 40% 25%)" }}>Your Brain Feels Safe Here</p>
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(145 20% 40%)" }}>{calmMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-sm mb-8" style={{ background: "hsl(0 0% 100%)" }}>
              <CardContent className="p-5">
                <h2 className="font-display text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: c.subtext }}>Activity Overview</h2>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-display text-xl font-bold" style={{ color: c.heading }}>{totalActivities}</p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: c.subtext }}>Activities</p>
                    </div>
                    <div>
                      <p className="font-display text-xl font-bold" style={{ color: c.heading }}>{terms.length}</p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: c.subtext }}>Terms</p>
                    </div>
                    <div>
                      <p className="font-display text-xl font-bold" style={{ color: "hsl(262 45% 50%)" }}>Block {block}</p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: c.subtext }}>Current</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: c.heading }}>Choose an Activity</h2>
          </motion.div>

          <div className="space-y-3 mb-8">
            {activities.map((a, i) => {
              const accent = activityAccents[i];
              return (
                <motion.div key={a.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.04 }}>
                  <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: accent.bg, borderColor: accent.border }} onClick={() => setActivity(a.key)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2.5 rounded-full" style={{ background: accent.iconBg }}>
                        <a.icon className="h-5 w-5" style={{ color: accent.icon }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-base font-semibold" style={{ color: accent.icon }}>{a.label}</h3>
                        <p className="text-xs" style={{ color: c.subtext }}>{a.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => setActivity(null)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Activities
        </Button>
        {activity === "matching" && <MatchingGame terms={terms} />}
        {activity === "flashcard" && <FlashcardDrill terms={terms} />}
        {activity === "fillin" && <FillInBlank terms={terms} />}
        {activity === "scramble" && <WordScramble terms={terms} colors={c} />}
        {activity === "crossword" && <CrosswordClues terms={terms} colors={c} />}
        {activity === "ownwords" && <OwnWords terms={terms} colors={c} />}
        {activity === "braindump" && <BrainDump terms={terms} colors={c} />}
        {activity === "picturematch" && <PictureMatch terms={terms} colors={c} />}
        {activity === "mnemonic" && <MnemonicBuilder terms={terms} colors={c} />}
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

  useEffect(() => { setShuffledDefs([...terms].sort(() => Math.random() - 0.5)); }, [terms]);

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
      <h2 className="font-display text-2xl font-bold mb-4" style={{ color: c.heading }}>Matching Game</h2>
      <p className="text-sm mb-6" style={{ color: c.subtext }}>Tap a term, then tap its matching definition.</p>
      {allMatched ? (
        <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>All Matched! 🎉</h3>
            <Button className="mt-4" onClick={() => { setMatched(new Set()); setShuffledDefs([...terms].sort(() => Math.random() - 0.5)); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Play Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: c.accent }}>Terms</p>
            {terms.map((t) => (
              <button key={t.id} disabled={matched.has(t.id)} onClick={() => setSelectedTerm(t.id)}
                className="w-full text-left p-3 rounded-lg text-sm font-medium transition-all border-2"
                style={{
                  background: matched.has(t.id) ? c.matchedBg : selectedTerm === t.id ? c.selectedBg : "white",
                  borderColor: matched.has(t.id) ? c.matchedBorder : selectedTerm === t.id ? c.selectedBorder : c.termBorder,
                  color: matched.has(t.id) ? c.successHeading : c.heading,
                  opacity: matched.has(t.id) ? 0.6 : 1,
                }}>
                {t.term}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: c.accent }}>Definitions</p>
            {shuffledDefs.map((t) => (
              <button key={`def-${t.id}`} disabled={matched.has(t.id)} onClick={() => handleDefClick(t.id)}
                className="w-full text-left p-3 rounded-lg text-xs leading-relaxed transition-all border-2"
                style={{
                  background: matched.has(t.id) ? c.matchedBg : wrong === t.id ? c.wrongBg : "white",
                  borderColor: matched.has(t.id) ? c.matchedBorder : wrong === t.id ? c.wrongBorder : c.termBorder,
                  color: c.heading, opacity: matched.has(t.id) ? 0.6 : 1,
                }}>
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

  const goNext = () => {
    setFlipped(false);
    let next = (currentIndex + 1) % terms.length;
    let attempts = 0;
    while (known.has(next) && attempts < terms.length) { next = (next + 1) % terms.length; attempts++; }
    setCurrentIndex(next);
  };

  if (done) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>All Cards Reviewed! 🌟</h3>
          <Button className="mt-4" onClick={() => { setKnown(new Set()); setCurrentIndex(0); setFlipped(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: c.heading }}>Flashcard Drill</h2>
      <p className="text-sm mb-4" style={{ color: c.subtext }}>{known.size}/{terms.length} mastered — Tap to flip</p>
      <Card className="border-0 shadow-lg cursor-pointer min-h-[200px] flex items-center justify-center" style={{ background: flipped ? c.iconBg : "white" }} onClick={() => setFlipped(!flipped)}>
        <CardContent className="p-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div key={flipped ? "back" : "front"} initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} transition={{ duration: 0.2 }}>
              {flipped ? (
                <p className="text-base leading-relaxed" style={{ color: c.heading }}>{current.definition}</p>
              ) : (
                <h3 className="font-display text-2xl font-bold" style={{ color: c.heading }}>{current.term}</h3>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
      <div className="flex gap-3 mt-4">
        <Button className="flex-1 py-5" variant="outline" onClick={goNext} style={{ borderColor: c.cardBorder, color: c.accent }}>
          <XCircle className="h-4 w-4 mr-2" /> Still Learning
        </Button>
        <Button className="flex-1 py-5" onClick={() => { setKnown((prev) => new Set([...prev, currentIndex])); goNext(); }} style={{ background: c.successColor, color: "white" }}>
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

  useEffect(() => { setShuffled([...terms].sort(() => Math.random() - 0.5)); }, [terms]);

  const current = shuffled[currentIndex];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setCorrect(answer.trim().toLowerCase() === current.term.toLowerCase());
    setSubmitted(true);
  };

  if (done || shuffled.length === 0) {
    return (
      <Card className="border-0 shadow-md" style={{ background: c.successBg }}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.successColor }} />
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: c.successHeading }}>All Done! 🎉</h3>
          <Button className="mt-4" onClick={() => { setShuffled([...terms].sort(() => Math.random() - 0.5)); setCurrentIndex(0); setAnswer(""); setSubmitted(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.heading }}>Fill in the Blank</h2>
      <p className="text-sm mb-6" style={{ color: c.subtext }}>{currentIndex + 1}/{shuffled.length} — Type the term</p>
      <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
        <CardContent className="p-6">
          <p className="text-base leading-relaxed mb-4" style={{ color: c.heading }}>{current.definition}</p>
          <Input placeholder="Type the term..." value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()} disabled={submitted} className="text-base" />
        </CardContent>
      </Card>
      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-4" style={{ background: correct ? c.successBg : c.wrongBg }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {correct ? (
                  <><CheckCircle2 className="h-5 w-5" style={{ color: c.successColor }} /><span className="font-semibold" style={{ color: c.successColor }}>Correct!</span></>
                ) : (
                  <><XCircle className="h-5 w-5" style={{ color: c.wrongBorder }} /><span className="text-sm" style={{ color: c.wrongBorder }}>The answer was: <strong>{current.term}</strong></span></>
                )}
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" onClick={() => { setAnswer(""); setSubmitted(false); setCurrentIndex((i) => i + 1); }} style={{ background: c.button, color: "white" }}>Next</Button>
        </motion.div>
      ) : (
        <Button className="w-full" onClick={handleSubmit} style={{ background: c.button, color: "white" }}>Check Answer</Button>
      )}
    </motion.div>
  );
};

export default ModuleActivityPage;
