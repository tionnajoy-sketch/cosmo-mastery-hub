import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { pageColors } from "@/lib/colors";
import AppFooter from "@/components/AppFooter";
import skinDiagram from "@/assets/skin-layers-diagram.png";

const c = pageColors.study;

type SkinRegion = "epidermis" | "dermis" | "hypodermis" | "hair" | "gland" | "nerve" | "vessel";

interface SkinTerm {
  name: string;
  definition: string;
  region: SkinRegion;
  layer: string;
}

const structureTerms: SkinTerm[] = [
  { name: "Epidermis", definition: "The outermost, thinnest layer of skin — no blood vessels. New cells form at the bottom and push to the surface.", region: "epidermis", layer: "Epidermis" },
  { name: "Dermis", definition: "The middle layer of skin, 25 times thicker than the epidermis. Contains nerves, blood vessels, and collagen.", region: "dermis", layer: "Dermis" },
  { name: "Subcutaneous (Hypodermis)", definition: "The deepest layer of skin made of fatty tissue. Provides cushion and insulation.", region: "hypodermis", layer: "Hypodermis" },
  { name: "Stratum Corneum", definition: "The very top of the epidermis — made of dead, flat keratin cells that shed constantly.", region: "epidermis", layer: "Epidermis" },
  { name: "Stratum Germinativum", definition: "The deepest layer of the epidermis where new skin cells and melanin are produced.", region: "epidermis", layer: "Epidermis" },
  { name: "Keratin", definition: "A tough protein that makes up skin, hair, and nails.", region: "epidermis", layer: "Epidermis" },
  { name: "Melanin", definition: "The pigment that gives skin, hair, and eyes their color and protects from UV rays.", region: "epidermis", layer: "Epidermis" },
  { name: "Collagen", definition: "A protein fiber in the dermis that gives skin its strength and firmness.", region: "dermis", layer: "Dermis" },
  { name: "Elastin", definition: "A protein in the dermis that allows skin to stretch and bounce back.", region: "dermis", layer: "Dermis" },
];

const appendageTerms: SkinTerm[] = [
  { name: "Hair Follicle", definition: "A tube-like pocket in the skin from which hair grows.", region: "hair", layer: "Dermis" },
  { name: "Hair Root", definition: "The part of the hair below the skin surface, inside the follicle.", region: "hair", layer: "Dermis" },
  { name: "Arrector Pili Muscle", definition: "Tiny muscle attached to the hair follicle — contracts to make hair stand up (goosebumps).", region: "hair", layer: "Dermis" },
  { name: "Sebaceous Gland", definition: "Oil gland connected to the hair follicle — produces sebum to lubricate skin and hair.", region: "gland", layer: "Dermis" },
  { name: "Sudoriferous Gland", definition: "Sweat gland — helps regulate body temperature. Two types: eccrine and apocrine.", region: "gland", layer: "Dermis" },
  { name: "Eccrine Gland", definition: "Most common sweat gland, found all over the body. Produces clear, odorless sweat.", region: "gland", layer: "Dermis" },
  { name: "Apocrine Gland", definition: "Sweat gland found in armpits and groin. Produces thicker sweat that causes body odor.", region: "gland", layer: "Dermis" },
];

const functionTerms: SkinTerm[] = [
  { name: "Sensory Nerve Endings", definition: "Receptors in the skin that detect touch, pressure, temperature, and pain.", region: "nerve", layer: "Dermis" },
  { name: "Motor Nerve Fibers", definition: "Nerves that control the arrector pili muscle, glands, and blood vessel dilation.", region: "nerve", layer: "Dermis" },
  { name: "Blood Vessels", definition: "Supply nutrients and oxygen to the skin and help regulate body temperature.", region: "vessel", layer: "Dermis" },
  { name: "Lymph Vessels", definition: "Remove waste products from the skin and help fight infection.", region: "vessel", layer: "Dermis" },
  { name: "Papillary Layer", definition: "Top layer of the dermis — contains fingerprint patterns and connects to the epidermis.", region: "dermis", layer: "Dermis" },
  { name: "Reticular Layer", definition: "Lower layer of the dermis — contains fat cells, blood vessels, and the base of hair follicles.", region: "dermis", layer: "Dermis" },
];

const tabData = [
  { key: "structure", label: "Layers & Structure", terms: structureTerms, accent: "hsl(346 50% 55%)", accentLight: "hsl(346 45% 92%)" },
  { key: "appendages", label: "Appendages", terms: appendageTerms, accent: "hsl(25 60% 50%)", accentLight: "hsl(25 55% 92%)" },
  { key: "functions", label: "Nerves & Vessels", terms: functionTerms, accent: "hsl(200 55% 48%)", accentLight: "hsl(200 50% 92%)" },
];

// Region highlight zones on the skin diagram image (percentage-based)
const regionHighlights: Record<SkinRegion, { top: string; left: string; width: string; height: string }> = {
  epidermis: { top: "0%", left: "0%", width: "100%", height: "18%" },
  dermis: { top: "18%", left: "0%", width: "100%", height: "50%" },
  hypodermis: { top: "68%", left: "0%", width: "100%", height: "32%" },
  hair: { top: "0%", left: "15%", width: "35%", height: "65%" },
  gland: { top: "12%", left: "45%", width: "30%", height: "40%" },
  nerve: { top: "35%", left: "30%", width: "40%", height: "35%" },
  vessel: { top: "50%", left: "10%", width: "60%", height: "30%" },
};

interface QuizState {
  currentIndex: number;
  score: number;
  answered: boolean;
  correct: boolean | null;
  finished: boolean;
}

const SkinMapPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("structure");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>({ currentIndex: 0, score: 0, answered: false, correct: null, finished: false });

  const currentTab = tabData.find(t => t.key === activeTab)!;
  const selectedData = currentTab.terms.find(t => t.name === selectedTerm);

  const quizTerms = useMemo(() => {
    return [...currentTab.terms].sort(() => Math.random() - 0.5);
  }, [activeTab, quizMode]);

  const currentQuizTerm = quizTerms[quiz.currentIndex];

  const handleQuizAnswer = (termName: string) => {
    if (quiz.answered || quiz.finished) return;
    const isCorrect = termName === currentQuizTerm.name;
    setQuiz(prev => ({
      ...prev,
      answered: true,
      correct: isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const nextQuizQuestion = () => {
    if (quiz.currentIndex + 1 >= quizTerms.length) {
      setQuiz(prev => ({ ...prev, finished: true }));
    } else {
      setQuiz(prev => ({ ...prev, currentIndex: prev.currentIndex + 1, answered: false, correct: null }));
    }
  };

  const resetQuiz = () => {
    setQuiz({ currentIndex: 0, score: 0, answered: false, correct: null, finished: false });
    setQuizMode(false);
  };

  const startQuiz = () => {
    setQuizMode(true);
    setSelectedTerm(null);
    setQuiz({ currentIndex: 0, score: 0, answered: false, correct: null, finished: false });
  };

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3" style={{ background: "hsl(346 40% 92% / 0.95)", backdropFilter: "blur(8px)" }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" style={{ color: c.heading }} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate font-display" style={{ color: c.heading }}>Skin Map</h1>
          <p className="text-xs" style={{ color: c.subtext }}>Skin Structure & Growth</p>
        </div>
        {!quizMode ? (
          <Button size="sm" onClick={startQuiz} className="gap-1.5 text-xs" style={{ background: currentTab.accent, color: "white" }}>
            <Search className="w-3.5 h-3.5" /> Find the Term
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={resetQuiz} className="gap-1 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Exit Quiz
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedTerm(null); setQuizMode(false); }}>
          <TabsList className="w-full grid grid-cols-3 mb-4" style={{ background: "hsl(346 25% 91%)" }}>
            {tabData.map(tab => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="text-xs font-semibold data-[state=active]:shadow-sm"
                style={{
                  color: activeTab === tab.key ? "white" : c.subtext,
                  background: activeTab === tab.key ? tab.accent : "transparent",
                }}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabData.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              {!quizMode ? (
                <div className="space-y-4">
                  {/* Diagram with highlight overlay */}
                  <Card className="overflow-hidden" style={{ borderColor: tab.accentLight }}>
                    <CardContent className="p-4">
                      <div className="relative">
                        <img src={skinDiagram} alt="Skin layers cross-section" className="w-full rounded-lg" />
                        {/* Highlight overlay */}
                        {selectedData && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute rounded-md pointer-events-none"
                            style={{
                              ...regionHighlights[selectedData.region],
                              background: `${tab.accent}20`,
                              border: `2px solid ${tab.accent}`,
                              boxShadow: `0 0 20px ${tab.accent}30`,
                            }}
                          />
                        )}
                      </div>

                      {/* Definition panel */}
                      <AnimatePresence mode="wait">
                        {selectedData && (
                          <motion.div
                            key={selectedData.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-4 p-3 rounded-lg"
                            style={{ background: tab.accentLight }}
                          >
                            <p className="text-sm font-bold mb-1" style={{ color: tab.accent }}>{selectedData.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">Layer: {selectedData.layer}</p>
                            <p className="text-sm leading-relaxed" style={{ color: c.heading }}>{selectedData.definition}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  {/* Term list */}
                  <Card style={{ borderColor: tab.accentLight }}>
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: c.subtext }}>
                        Tap a term to explore
                      </p>
                      <div className="space-y-1">
                        {tab.terms.map(t => {
                          const isActive = t.name === selectedTerm;
                          return (
                            <button
                              key={t.name}
                              onClick={() => setSelectedTerm(t.name)}
                              className="w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium"
                              style={{
                                background: isActive ? tab.accentLight : "transparent",
                                color: isActive ? tab.accent : c.subtext,
                                borderLeft: isActive ? `3px solid ${tab.accent}` : "3px solid transparent",
                              }}
                            >
                              {t.name}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Quiz Mode */
                <div className="space-y-4">
                  {!quiz.finished ? (
                    <>
                      <Card style={{ borderColor: tab.accentLight }}>
                        <CardContent className="p-5 text-center">
                          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: c.subtext }}>
                            Question {quiz.currentIndex + 1} of {quizTerms.length}
                          </p>
                          <p className="text-lg font-bold font-display mb-2" style={{ color: tab.accent }}>
                            Find: {currentQuizTerm.name}
                          </p>
                          <p className="text-sm" style={{ color: c.subtext }}>{currentQuizTerm.definition}</p>
                        </CardContent>
                      </Card>

                      {/* Show image */}
                      <Card className="overflow-hidden" style={{ borderColor: tab.accentLight }}>
                        <CardContent className="p-4">
                          <div className="relative">
                            <img src={skinDiagram} alt="Skin layers cross-section" className="w-full rounded-lg" />
                            {quiz.answered && quiz.correct !== null && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute rounded-md pointer-events-none"
                                style={{
                                  ...regionHighlights[currentQuizTerm.region],
                                  background: quiz.correct ? "hsl(145 50% 50% / 0.2)" : "hsl(350 50% 50% / 0.2)",
                                  border: `2px solid ${quiz.correct ? "hsl(145 50% 45%)" : "hsl(350 50% 50%)"}`,
                                }}
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Answer choices - pick from list */}
                      <Card style={{ borderColor: tab.accentLight }}>
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold mb-2" style={{ color: c.subtext }}>Tap the correct term:</p>
                          <div className="space-y-1.5">
                            {tab.terms.map(t => {
                              let bg = "transparent";
                              let textColor = c.subtext;
                              if (quiz.answered) {
                                if (t.name === currentQuizTerm.name) { bg = "hsl(145 40% 92%)"; textColor = "hsl(145 50% 30%)"; }
                                else if (t.name === selectedTerm) { bg = "hsl(350 40% 94%)"; textColor = "hsl(350 50% 35%)"; }
                              }
                              return (
                                <button
                                  key={t.name}
                                  onClick={() => { setSelectedTerm(t.name); handleQuizAnswer(t.name); }}
                                  disabled={quiz.answered}
                                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                  style={{ background: bg, color: textColor }}
                                >
                                  {t.name}
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {quiz.answered && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Card style={{ borderColor: quiz.correct ? "hsl(145 45% 70%)" : "hsl(350 45% 75%)" }}>
                            <CardContent className="p-4 flex items-start gap-3">
                              {quiz.correct ? (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(145 50% 40%)" }} />
                              ) : (
                                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(350 55% 48%)" }} />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium" style={{ color: quiz.correct ? "hsl(145 40% 28%)" : "hsl(350 40% 30%)" }}>
                                  {quiz.correct ? "That's right!" : `The answer was: ${currentQuizTerm.name}`}
                                </p>
                                <p className="text-xs mt-1" style={{ color: c.subtext }}>{currentQuizTerm.definition}</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Button onClick={nextQuizQuestion} className="w-full mt-3" style={{ background: tab.accent, color: "white" }}>
                            {quiz.currentIndex + 1 >= quizTerms.length ? "See Results" : "Next Question"}
                          </Button>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    /* Results */
                    <Card className="text-center" style={{ borderColor: tab.accentLight }}>
                      <CardContent className="p-8">
                        <p className="text-4xl mb-2">🎯</p>
                        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: tab.accent }}>
                          {quiz.score}/{quizTerms.length}
                        </h2>
                        <p className="text-sm mb-4" style={{ color: c.subtext }}>
                          {quiz.score === quizTerms.length ? "Perfect! You know your skin layers inside and out." : "Keep reviewing — every pass strengthens the memory."}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={resetQuiz} className="flex-1">Back to Explore</Button>
                          <Button onClick={startQuiz} className="flex-1" style={{ background: tab.accent, color: "white" }}>Try Again</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <AppFooter />
    </div>
  );
};

export default SkinMapPage;
