import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { pageColors } from "@/lib/colors";
import AppFooter from "@/components/AppFooter";
import skeletonImg from "@/assets/skeleton-diagram.png";

const c = pageColors.study;

/* ─── Anatomy Data ─── */
type BodyRegion = "head" | "face" | "neck" | "chest" | "shoulder" | "arm" | "hand" | "spine" | "pelvis" | "leg" | "foot" | "skull" | "brain" | "torso" | "abdomen" | "full";

interface AnatomyTerm {
  name: string;
  definition: string;
  region: BodyRegion;
  labelPos: { x: number; y: number }; // position on SVG
  anchorPos: { x: number; y: number }; // point on body it connects to
}

const boneTerms: AnatomyTerm[] = [
  { name: "Skull", definition: "The skeleton of the head, divided into the cranium and the facial skeleton.", region: "head", labelPos: { x: 172, y: 12 }, anchorPos: { x: 105, y: 18 } },
  { name: "Frontal Bone", definition: "The bone that forms the forehead.", region: "head", labelPos: { x: 162, y: 28 }, anchorPos: { x: 105, y: 28 } },
  { name: "Mandible", definition: "The largest and strongest bone of the face, forming the lower jaw.", region: "face", labelPos: { x: 162, y: 52 }, anchorPos: { x: 105, y: 50 } },
  { name: "Cervical Vertebrae", definition: "Seven bones below the skull providing support and flexibility to the neck.", region: "neck", labelPos: { x: 160, y: 62 }, anchorPos: { x: 105, y: 62 } },
  { name: "Clavicle", definition: "The collarbone — joins the sternum and scapula.", region: "shoulder", labelPos: { x: 158, y: 74 }, anchorPos: { x: 130, y: 72 } },
  { name: "Scapula", definition: "The shoulder blade — a large, flat, triangular bone of the shoulder.", region: "shoulder", labelPos: { x: 18, y: 86 }, anchorPos: { x: 72, y: 85 } },
  { name: "Humerus", definition: "The uppermost and largest bone in the arm, from elbow to shoulder.", region: "arm", labelPos: { x: 10, y: 108 }, anchorPos: { x: 62, y: 108 } },
  { name: "Radius", definition: "The smaller bone in the forearm on the thumb side.", region: "arm", labelPos: { x: 8, y: 148 }, anchorPos: { x: 55, y: 148 } },
  { name: "Ulna", definition: "The inner, larger bone of the forearm on the pinky side.", region: "arm", labelPos: { x: 8, y: 138 }, anchorPos: { x: 58, y: 138 } },
];

const muscleTerms: AnatomyTerm[] = [
  { name: "Frontalis", definition: "Scalp muscle that raises eyebrows and causes wrinkles across the forehead.", region: "head", labelPos: { x: 162, y: 16 }, anchorPos: { x: 105, y: 16 } },
  { name: "Orbicularis Oculi", definition: "Ring muscle around the eye socket that closes the eyelid.", region: "face", labelPos: { x: 162, y: 34 }, anchorPos: { x: 112, y: 34 } },
  { name: "Orbicularis Oris", definition: "Flat band around the lips that compresses, contracts, and puckers the lips.", region: "face", labelPos: { x: 162, y: 46 }, anchorPos: { x: 105, y: 46 } },
  { name: "Masseter", definition: "One of the jaw muscles used in chewing.", region: "face", labelPos: { x: 162, y: 56 }, anchorPos: { x: 118, y: 44 } },
  { name: "Sternocleidomastoid", definition: "Muscle of the neck that rotates and bends the head.", region: "neck", labelPos: { x: 155, y: 64 }, anchorPos: { x: 108, y: 62 } },
  { name: "Trapezius", definition: "Broad muscle covering the back of the neck and upper back.", region: "shoulder", labelPos: { x: 12, y: 78 }, anchorPos: { x: 72, y: 78 } },
  { name: "Deltoid", definition: "Large, thick muscle that covers the shoulder and lifts the arm.", region: "shoulder", labelPos: { x: 10, y: 88 }, anchorPos: { x: 62, y: 82 } },
  { name: "Bicep", definition: "Muscle on the front of the upper arm that flexes the forearm.", region: "arm", labelPos: { x: 8, y: 110 }, anchorPos: { x: 60, y: 108 } },
  { name: "Pectoralis", definition: "Muscles of the chest that assist in breathing and arm movement.", region: "chest", labelPos: { x: 160, y: 90 }, anchorPos: { x: 118, y: 90 } },
];

const nerveTerms: AnatomyTerm[] = [
  { name: "Brain", definition: "Part of the CNS in the cranium — controls all body functions.", region: "brain", labelPos: { x: 162, y: 14 }, anchorPos: { x: 105, y: 20 } },
  { name: "Spinal Cord", definition: "Portion of the CNS within the spinal column, connecting brain to body.", region: "spine", labelPos: { x: 160, y: 110 }, anchorPos: { x: 105, y: 110 } },
  { name: "Nervous System", definition: "Brain, spinal cord, and nerves — controls and coordinates all body systems.", region: "full", labelPos: { x: 160, y: 130 }, anchorPos: { x: 105, y: 130 } },
  { name: "Central Nervous System", definition: "Controls voluntary muscles — consists of brain, spinal cord, and cranial nerves.", region: "brain", labelPos: { x: 162, y: 28 }, anchorPos: { x: 105, y: 28 } },
  { name: "Peripheral Nervous System", definition: "Nerves connecting outer body parts to the CNS — sensory and motor nerves.", region: "arm", labelPos: { x: 8, y: 130 }, anchorPos: { x: 55, y: 130 } },
  { name: "Heart", definition: "A muscular, cone-shaped organ that keeps blood moving through the body.", region: "chest", labelPos: { x: 18, y: 98 }, anchorPos: { x: 95, y: 98 } },
  { name: "Circulatory System", definition: "Controls steady blood circulation through the heart and blood vessels.", region: "torso", labelPos: { x: 160, y: 98 }, anchorPos: { x: 120, y: 100 } },
];

const tabData = [
  { key: "bones", label: "Bones", terms: boneTerms, accent: "hsl(42 58% 48%)", accentLight: "hsl(42 55% 92%)" },
  { key: "muscles", label: "Muscles", terms: muscleTerms, accent: "hsl(350 55% 55%)", accentLight: "hsl(350 50% 92%)" },
  { key: "nerves", label: "Nerves & Systems", terms: nerveTerms, accent: "hsl(200 65% 48%)", accentLight: "hsl(200 55% 92%)" },
];

/* ─── Clickable regions mapped as percentage-based zones on the skeleton image ─── */
const regionZones: Record<string, { top: string; left: string; width: string; height: string }> = {
  head: { top: "0%", left: "30%", width: "40%", height: "10%" },
  skull: { top: "0%", left: "30%", width: "40%", height: "8%" },
  brain: { top: "1%", left: "33%", width: "34%", height: "6%" },
  face: { top: "5%", left: "32%", width: "36%", height: "7%" },
  neck: { top: "11%", left: "38%", width: "24%", height: "4%" },
  shoulder: { top: "14%", left: "18%", width: "64%", height: "5%" },
  chest: { top: "19%", left: "28%", width: "44%", height: "14%" },
  torso: { top: "19%", left: "28%", width: "44%", height: "25%" },
  abdomen: { top: "33%", left: "30%", width: "40%", height: "12%" },
  spine: { top: "15%", left: "45%", width: "10%", height: "35%" },
  arm: { top: "19%", left: "8%", width: "18%", height: "30%" },
  hand: { top: "49%", left: "3%", width: "15%", height: "8%" },
  pelvis: { top: "44%", left: "28%", width: "44%", height: "8%" },
  leg: { top: "52%", left: "25%", width: "50%", height: "35%" },
  foot: { top: "88%", left: "22%", width: "56%", height: "10%" },
  full: { top: "0%", left: "5%", width: "90%", height: "100%" },
};

interface DiagramProps {
  terms: AnatomyTerm[];
  selectedTerm: string | null;
  onSelectTerm: (name: string) => void;
  accent: string;
  accentLight: string;
  quizTarget?: string | null;
  quizMode?: boolean;
  onRegionTap?: (region: BodyRegion) => void;
}

const AnatomyDiagram = ({ terms, selectedTerm, onSelectTerm, accent, accentLight, quizMode, quizTarget, onRegionTap }: DiagramProps) => {
  const selectedData = terms.find(t => t.name === selectedTerm);
  const highlightRegion = selectedData?.region;

  const allRegions = useMemo(() => {
    const set = new Set(terms.map(t => t.region));
    return Array.from(set);
  }, [terms]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[280px]">
        <img src={skeletonImg} alt="Human skeleton diagram" className="w-full h-auto" />

        {/* Highlight overlay for selected region */}
        {highlightRegion && regionZones[highlightRegion] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute rounded-md pointer-events-none"
            style={{
              ...regionZones[highlightRegion],
              background: `${accent}30`,
              border: `2px solid ${accent}`,
              boxShadow: `0 0 16px ${accent}40`,
            }}
          />
        )}

        {/* Tappable zones in quiz mode */}
        {quizMode && allRegions.map(region => regionZones[region] && (
          <div
            key={region}
            className="absolute cursor-pointer hover:bg-yellow-200/30 rounded-md transition-all border border-dashed border-transparent hover:border-yellow-500/50"
            style={regionZones[region]}
            onClick={() => onRegionTap?.(region)}
          />
        ))}

        {/* Term label dots on the image */}
        {!quizMode && terms.map(t => {
          const zone = regionZones[t.region];
          if (!zone) return null;
          const isSelected = t.name === selectedTerm;
          // Position dot at the center of the zone
          const dotTop = `calc(${zone.top} + ${zone.height} / 2)`;
          const dotLeft = t.labelPos.x > 105 ? `calc(${zone.left} + ${zone.width})` : zone.left;
          return (
            <button
              key={t.name}
              onClick={() => onSelectTerm(t.name)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all z-10"
              style={{ top: dotTop, left: dotLeft }}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isSelected ? 12 : 8,
                  height: isSelected ? 12 : 8,
                  background: isSelected ? accent : "hsl(42 30% 60%)",
                  boxShadow: isSelected ? `0 0 8px ${accent}` : "none",
                  border: isSelected ? "2px solid white" : "1px solid white",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Term List Sidebar ─── */
interface TermListProps {
  terms: AnatomyTerm[];
  selectedTerm: string | null;
  onSelect: (name: string) => void;
  accent: string;
  accentLight: string;
}

const TermList = ({ terms, selectedTerm, onSelect, accent, accentLight }: TermListProps) => (
  <div className="space-y-1.5">
    {terms.map(t => {
      const isActive = t.name === selectedTerm;
      return (
        <button
          key={t.name}
          onClick={() => onSelect(t.name)}
          className="w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium"
          style={{
            background: isActive ? accentLight : "transparent",
            color: isActive ? accent : c.subtext,
            borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
          }}
        >
          {t.name}
        </button>
      );
    })}
  </div>
);

/* ─── Find-the-Term Quiz ─── */
interface QuizState {
  currentIndex: number;
  score: number;
  answered: boolean;
  correct: boolean | null;
  finished: boolean;
}

/* ─── Main Page ─── */
const AnatomyMapPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bones");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>({ currentIndex: 0, score: 0, answered: false, correct: null, finished: false });

  const currentTab = tabData.find(t => t.key === activeTab)!;
  const selectedData = currentTab.terms.find(t => t.name === selectedTerm);

  // Quiz logic
  const quizTerms = useMemo(() => {
    return [...currentTab.terms].sort(() => Math.random() - 0.5);
  }, [activeTab, quizMode]);

  const currentQuizTerm = quizTerms[quiz.currentIndex];

  const handleRegionTap = (region: BodyRegion) => {
    if (quiz.answered || quiz.finished) return;
    const isCorrect = currentQuizTerm.region === region;
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
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3" style={{ background: "hsl(42 55% 88% / 0.95)", backdropFilter: "blur(8px)" }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(`/section/b2c3d4e5-f6a7-8901-bcde-fa2345678901`)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" style={{ color: c.heading }} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate font-display" style={{ color: c.heading }}>Anatomy Map</h1>
          <p className="text-xs" style={{ color: c.subtext }}>General Anatomy & Physiology</p>
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
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedTerm(null); setQuizMode(false); }}>
          <TabsList className="w-full grid grid-cols-3 mb-4" style={{ background: "hsl(42 30% 91%)" }}>
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
                /* ─── Explore Mode ─── */
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
                  {/* Diagram */}
                  <Card className="overflow-hidden" style={{ borderColor: tab.accentLight }}>
                    <CardContent className="py-4 px-2">
                      <AnatomyDiagram
                        terms={tab.terms}
                        selectedTerm={selectedTerm}
                        onSelectTerm={setSelectedTerm}
                        accent={tab.accent}
                        accentLight={tab.accentLight}
                      />
                      {/* Definition Panel */}
                      <AnimatePresence mode="wait">
                        {selectedData && (
                          <motion.div
                            key={selectedData.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-3 rounded-lg p-3 text-center"
                            style={{ background: tab.accentLight, borderLeft: `3px solid ${tab.accent}` }}
                          >
                            <p className="text-sm font-bold" style={{ color: tab.accent }}>{selectedData.name}</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: c.subtext }}>{selectedData.definition}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!selectedTerm && (
                        <p className="text-center text-xs mt-3 italic" style={{ color: c.subtext }}>
                          Tap a label or term from the list to highlight it on the body
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Term List */}
                  <Card className="hidden md:block" style={{ borderColor: tab.accentLight }}>
                    <CardContent className="py-3 px-2">
                      <p className="text-xs font-bold mb-2 px-2" style={{ color: tab.accent }}>
                        {tab.label} ({tab.terms.length})
                      </p>
                      <TermList
                        terms={tab.terms}
                        selectedTerm={selectedTerm}
                        onSelect={setSelectedTerm}
                        accent={tab.accent}
                        accentLight={tab.accentLight}
                      />
                    </CardContent>
                  </Card>

                  {/* Mobile Term list */}
                  <Card className="md:hidden" style={{ borderColor: tab.accentLight }}>
                    <CardContent className="py-3 px-2">
                      <p className="text-xs font-bold mb-2 px-2" style={{ color: tab.accent }}>
                        Tap to explore
                      </p>
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {tab.terms.map(t => (
                          <button
                            key={t.name}
                            onClick={() => setSelectedTerm(t.name === selectedTerm ? null : t.name)}
                            className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                            style={{
                              background: t.name === selectedTerm ? tab.accent : tab.accentLight,
                              color: t.name === selectedTerm ? "white" : tab.accent,
                            }}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* ─── Quiz Mode ─── */
                <Card style={{ borderColor: tab.accentLight }}>
                  <CardContent className="py-5 px-4">
                    {!quiz.finished ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold" style={{ color: tab.accent }}>
                            Question {quiz.currentIndex + 1} of {quizTerms.length}
                          </p>
                          <p className="text-xs" style={{ color: c.subtext }}>
                            Score: {quiz.score}/{quiz.currentIndex + (quiz.answered ? 1 : 0)}
                          </p>
                        </div>

                        <div className="text-center py-2">
                          <Sparkles className="w-5 h-5 mx-auto mb-2" style={{ color: tab.accent }} />
                          <p className="text-base font-bold" style={{ color: c.heading }}>
                            Find: <span style={{ color: tab.accent }}>{currentQuizTerm?.name}</span>
                          </p>
                          <p className="text-xs mt-1" style={{ color: c.subtext }}>
                            Tap the correct region on the body below
                          </p>
                        </div>

                        <AnatomyDiagram
                          terms={tab.terms}
                          selectedTerm={null}
                          onSelectTerm={() => {}}
                          accent={tab.accent}
                          accentLight={tab.accentLight}
                          quizMode
                          quizTarget={currentQuizTerm?.name}
                          onRegionTap={handleRegionTap}
                        />

                        <AnimatePresence>
                          {quiz.answered && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-lg p-3 text-center"
                              style={{
                                background: quiz.correct ? "hsl(145 40% 94%)" : "hsl(0 35% 95%)",
                                borderLeft: `3px solid ${quiz.correct ? "hsl(145 50% 45%)" : "hsl(0 55% 55%)"}`,
                              }}
                            >
                              <div className="flex items-center justify-center gap-2 mb-1">
                                {quiz.correct ? (
                                  <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(145 50% 40%)" }} />
                                ) : (
                                  <XCircle className="w-4 h-4" style={{ color: "hsl(0 55% 50%)" }} />
                                )}
                                <p className="text-sm font-bold" style={{ color: quiz.correct ? "hsl(145 40% 28%)" : "hsl(0 40% 35%)" }}>
                                  {quiz.correct ? "Correct!" : `That was the ${currentQuizTerm?.region}`}
                                </p>
                              </div>
                              <p className="text-xs" style={{ color: c.subtext }}>{currentQuizTerm?.definition}</p>
                              <Button size="sm" onClick={nextQuizQuestion} className="mt-2 text-xs" style={{ background: tab.accent, color: "white" }}>
                                {quiz.currentIndex + 1 < quizTerms.length ? "Next →" : "See Results"}
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <Sparkles className="w-8 h-8 mx-auto" style={{ color: tab.accent }} />
                        <p className="text-xl font-bold" style={{ color: c.heading }}>
                          {quiz.score}/{quizTerms.length}
                        </p>
                        <p className="text-sm" style={{ color: c.subtext }}>
                          {quiz.score === quizTerms.length
                            ? "Perfect! You know your anatomy. 🎉"
                            : quiz.score >= quizTerms.length * 0.7
                            ? "Great job — keep building that confidence!"
                            : "Every attempt strengthens your neural pathways. Try again!"}
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={resetQuiz}>Back to Map</Button>
                          <Button size="sm" onClick={startQuiz} style={{ background: tab.accent, color: "white" }}>Try Again</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <AppFooter />
    </div>
  );
};

export default AnatomyMapPage;
