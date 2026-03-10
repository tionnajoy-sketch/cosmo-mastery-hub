import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Sparkles, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { pageColors } from "@/lib/colors";
import AppFooter from "@/components/AppFooter";

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

/* ─── SVG Body Diagram ─── */
const regionPaths: Record<string, string> = {
  head: "M85 18 C85 8 95 2 105 2 C115 2 125 8 125 18 L125 40 C125 48 118 55 105 55 C92 55 85 48 85 40 Z",
  skull: "M85 18 C85 8 95 2 105 2 C115 2 125 8 125 18 L125 40 C125 48 118 55 105 55 C92 55 85 48 85 40 Z",
  brain: "M90 12 C90 7 97 4 105 4 C113 4 120 7 120 12 L120 30 C120 36 114 40 105 40 C96 40 90 36 90 30 Z",
  face: "M90 30 C90 28 92 26 105 26 C118 26 120 28 120 30 L120 48 C120 52 115 55 105 55 C95 55 90 52 90 48 Z",
  neck: "M97 55 L97 68 L113 68 L113 55 Z",
  shoulder: "M60 68 L97 68 L97 78 L60 78 Z M113 68 L150 68 L150 78 L113 78 Z",
  chest: "M72 78 L138 78 L138 120 L72 120 Z",
  torso: "M72 78 L138 78 L138 155 L72 155 Z",
  abdomen: "M75 120 L135 120 L135 155 L75 155 Z",
  spine: "M103 55 L107 55 L107 160 L103 160 Z",
  arm: "M50 78 L72 78 L72 85 L62 130 L55 170 L45 170 L52 130 L50 85 Z M138 78 L160 78 L160 85 L158 130 L165 170 L155 170 L148 130 L138 85 Z",
  hand: "M42 170 L58 170 L60 190 L40 190 Z M152 170 L168 170 L170 190 L150 190 Z",
  pelvis: "M75 155 L135 155 L140 175 L70 175 Z",
  leg: "M75 175 L100 175 L95 270 L70 270 Z M110 175 L135 175 L140 270 L115 270 Z",
  foot: "M65 270 L100 270 L102 285 L63 285 Z M110 270 L145 270 L147 285 L108 285 Z",
  full: "M85 2 C115 2 125 8 125 18 L125 55 L150 68 L160 78 L165 170 L170 190 L150 190 L138 85 L138 155 L140 175 L145 270 L147 285 L108 285 L110 175 L105 155 L100 175 L100 270 L102 285 L63 285 L70 270 L75 175 L72 155 L72 85 L60 190 L40 190 L45 170 L50 78 L60 68 L85 55 L85 18 Z",
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
  const highlightRegions = selectedData ? [selectedData.region] : [];

  // In quiz mode, collect all unique regions as tappable
  const allRegions = useMemo(() => {
    const set = new Set(terms.map(t => t.region));
    return Array.from(set);
  }, [terms]);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 210 295" className="w-full max-w-[240px] h-auto" style={{ filter: "drop-shadow(0 1px 4px hsl(0 0% 0%/0.08))" }}>
        {/* Full body outline */}
        <path d={regionPaths.full} fill="none" stroke="hsl(42 20% 75%)" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Skeletal details */}
        <g stroke="hsl(42 15% 82%)" strokeWidth="0.8" fill="none" opacity={0.5}>
          <path d="M80 82 Q105 88 130 82" />
          <path d="M78 90 Q105 96 132 90" />
          <path d="M77 98 Q105 104 133 98" />
          <path d="M78 106 Q105 112 132 106" />
          <path d="M80 114 Q105 118 130 114" />
          <line x1="105" y1="55" x2="105" y2="170" strokeDasharray="3 2" />
          <path d="M78 155 Q90 168 105 170 Q120 168 132 155" />
          <path d="M92 15 Q105 22 118 15" />
          <circle cx="95" cy="34" r="5" />
          <circle cx="115" cy="34" r="5" />
          <path d="M103 38 L105 46 L107 38" />
          <path d="M90 48 Q105 56 120 48" />
          <circle cx="72" cy="78" r="4" />
          <circle cx="138" cy="78" r="4" />
          <circle cx="62" cy="130" r="3" />
          <circle cx="148" cy="130" r="3" />
          <circle cx="85" cy="165" r="4" />
          <circle cx="125" cy="165" r="4" />
          <circle cx="83" cy="225" r="3" />
          <circle cx="127" cy="225" r="3" />
        </g>

        {/* Tappable regions in quiz mode */}
        {quizMode && allRegions.map(region => (
          <path
            key={region}
            d={regionPaths[region] || ""}
            fill="hsl(0 0% 0% / 0)"
            stroke="none"
            className="cursor-pointer"
            onClick={() => onRegionTap?.(region)}
          />
        ))}

        {/* Highlighted regions */}
        {highlightRegions.map(region => regionPaths[region] && (
          <motion.path
            key={region}
            d={regionPaths[region]}
            fill={accent}
            fillOpacity={0.2}
            stroke={accent}
            strokeWidth="2"
            strokeLinejoin="round"
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: [0.12, 0.25, 0.12], strokeOpacity: 1 }}
            transition={{ fillOpacity: { repeat: Infinity, duration: 2 }, strokeOpacity: { duration: 0.3 } }}
          />
        ))}

        {/* Label lines and dots */}
        {!quizMode && terms.map(t => {
          const isSelected = t.name === selectedTerm;
          return (
            <g key={t.name} className="cursor-pointer" onClick={() => onSelectTerm(t.name)}>
              <line
                x1={t.anchorPos.x} y1={t.anchorPos.y}
                x2={t.labelPos.x} y2={t.labelPos.y}
                stroke={isSelected ? accent : "hsl(42 15% 72%)"}
                strokeWidth={isSelected ? 1.2 : 0.7}
                strokeDasharray={isSelected ? "none" : "2 2"}
              />
              <circle cx={t.anchorPos.x} cy={t.anchorPos.y} r={isSelected ? 3.5 : 2.5} fill={isSelected ? accent : "hsl(42 15% 72%)"} />
              <text
                x={t.labelPos.x} y={t.labelPos.y + 1}
                fontSize={isSelected ? "6.5" : "5.5"}
                fontWeight={isSelected ? "700" : "500"}
                fill={isSelected ? accent : "hsl(42 18% 38%)"}
                textAnchor={t.labelPos.x > 105 ? "start" : "end"}
                className="cursor-pointer select-none"
              >
                {t.name}
              </text>
            </g>
          );
        })}

        {/* Quiz mode: show target region with a "?" */}
        {quizMode && quizTarget && (
          <g>
            {allRegions.map(region => regionPaths[region] && (
              <path
                key={`quiz-${region}`}
                d={regionPaths[region]}
                fill="hsl(42 50% 90%)"
                fillOpacity={0.3}
                stroke="hsl(42 40% 70%)"
                strokeWidth="1"
                strokeDasharray="4 3"
                strokeLinejoin="round"
                className="cursor-pointer hover:fill-opacity-50 transition-all"
                onClick={() => onRegionTap?.(region)}
              />
            ))}
          </g>
        )}
      </svg>
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
