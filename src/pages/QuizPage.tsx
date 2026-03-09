import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Brain, Heart, Target, Eye, BookOpen, Sparkles } from "lucide-react";
import { pageColors } from "@/lib/colors";

const c = pageColors.quiz;

interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; explanation: string; related_term_id: string | null; }
interface RelatedTerm { term: string; metaphor: string; }
type QuizMode = "practice" | "confidence";

const preQuizMessages = [
  "Remember: everyone learns differently. Take your time with each question.",
  "You've studied for this. Trust your preparation and read carefully.",
  "Don't rush. The best test-takers eliminate wrong answers first.",
  "Take a deep breath. You know more than you think you do.",
];

const QuizPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sectionName, setSectionName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [relatedTerm, setRelatedTerm] = useState<RelatedTerm | null>(null);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [strategyMode, setStrategyMode] = useState(false);
  const [strategyStep, setStrategyStep] = useState<"answers" | "passage" | "eliminate" | "choose">("answers");
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [preQuizMessage] = useState(() => preQuizMessages[Math.floor(Math.random() * preQuizMessages.length)]);

  useEffect(() => {
    if (!id || !block) return;
    const fetchData = async () => {
      const [sectionRes, questionsRes] = await Promise.all([
        supabase.from("sections").select("name").eq("id", id).single(),
        supabase.from("questions").select("*").eq("section_id", id).eq("block_number", Number(block)),
      ]);
      if (sectionRes.data) setSectionName(sectionRes.data.name);
      if (questionsRes.data) setQuestions(questionsRes.data);
    };
    fetchData();
  }, [id, block]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_option;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = async (option: string) => {
    if (selectedAnswer) return;

    // Strategy mode: enforce elimination step
    if (strategyMode && strategyStep === "eliminate") {
      if (eliminated.has(option)) {
        setEliminated(prev => { const n = new Set(prev); n.delete(option); return n; });
      } else if (eliminated.size < 2) {
        setEliminated(prev => new Set(prev).add(option));
      }
      if (eliminated.size === 1 && !eliminated.has(option)) {
        // Just added second elimination, move to choose step
        setTimeout(() => setStrategyStep("choose"), 300);
      }
      return;
    }

    if (strategyMode && strategyStep !== "choose") return;

    setSelectedAnswer(option);
    if (option === currentQuestion.correct_option) {
      setScore((s) => s + 1);
    } else {
      setWrongCount((cnt) => cnt + 1);
      if (user && id) {
        await supabase.from("wrong_answers").insert({
          user_id: user.id, question_id: currentQuestion.id, section_id: id,
          block_number: Number(block), selected_option: option,
        });
      }
    }
    if (currentQuestion.related_term_id) {
      const { data } = await supabase.from("terms").select("term, metaphor").eq("id", currentQuestion.related_term_id).single();
      if (data) setRelatedTerm(data);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigate(`/section/${id}/results/${block}`, { state: { score, total: questions.length, mode, wrongCount } });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRelatedTerm(null);
      setStrategyStep("answers");
      setEliminated(new Set());
    }
  };

  // Mode selection
  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: c.gradient }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>{sectionName} — Block {block}</h1>
            <p className="text-base" style={{ color: c.subtext }}>Choose your quiz mode</p>
          </div>

          {/* Pre-quiz motivational message */}
          <Card className="border-0 shadow-md" style={{ background: "hsl(42 50% 96%)" }}>
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 58% 48%)" }} />
              <p className="text-sm italic leading-relaxed" style={{ color: "hsl(42 30% 28%)" }}>
                {preQuizMessage}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.practiceBg, borderColor: c.practiceBorder }} onClick={() => setMode("practice")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-6 w-6" style={{ color: c.practiceIcon }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.practiceHeading }}>Practice Mode</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.practiceText }}>Harder questions for serious exam prep. Designed to challenge you and expose weak areas.</p>
            </CardContent>
          </Card>

          <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.confidenceBg, borderColor: c.confidenceBorder }} onClick={() => setMode("confidence")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="h-6 w-6" style={{ color: c.confidenceIcon }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.confidenceHeading }}>Confidence Builder</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.confidenceText }}>Gentler questions with nurturing feedback. Perfect when you want to build confidence without pressure.</p>
            </CardContent>
          </Card>

          {/* Strategy Mode Toggle */}
          <Card className="border-0 shadow-md" style={{ background: c.practiceBg }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5" style={{ color: c.practiceIcon }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: c.practiceHeading }}>Strategy Mode</p>
                  <p className="text-xs" style={{ color: c.practiceText }}>Enforces the TJ Anderson Layer Method steps</p>
                </div>
              </div>
              <Switch checked={strategyMode} onCheckedChange={setStrategyMode} />
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="w-full mt-4 gap-2" style={{ color: c.backButton }}>
            <ArrowLeft className="h-4 w-4" /> Back to Section
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading quiz...</p></div>;
  }

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  const getWrongFeedback = () => mode === "confidence"
    ? "That was not the best answer, but you are learning and that is what matters. Let us look at why together."
    : "Not quite. Let's look at why.";

  const getStrategyInstruction = () => {
    switch (strategyStep) {
      case "answers": return { icon: Eye, text: "Step 1: Read the answer choices below first", color: "hsl(200 50% 45%)" };
      case "passage": return { icon: BookOpen, text: "Step 2: Now read the question carefully", color: "hsl(42 55% 45%)" };
      case "eliminate": return { icon: XCircle, text: `Step 3: Tap 2 wrong answers to eliminate (${eliminated.size}/2)`, color: "hsl(0 50% 50%)" };
      case "choose": return { icon: CheckCircle2, text: "Step 4: Choose the best remaining answer", color: "hsl(145 50% 38%)" };
    }
  };

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2" style={{ color: c.backButton }}>
          <ArrowLeft className="h-4 w-4" /> Back to Section
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold" style={{ color: c.heading }}>{sectionName} — Block {block} Quiz</h1>
            {mode === "confidence" && <Heart className="h-4 w-4" style={{ color: c.confidenceIcon }} />}
          </div>
          <p className="text-sm" style={{ color: c.subtext }}>
            Question {currentIndex + 1} of {questions.length} — {mode === "practice" ? "Practice Mode" : "Confidence Builder"}
            {strategyMode && " • Strategy Mode"}
          </p>
        </div>

        {/* Strategy mode instruction banner */}
        {strategyMode && !selectedAnswer && (() => {
          const inst = getStrategyInstruction();
          const Icon = inst.icon;
          return (
            <motion.div key={strategyStep} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
              <Card className="border-2" style={{ borderColor: inst.color, background: "hsl(0 0% 98%)" }}>
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: inst.color }} />
                  <p className="text-sm font-medium" style={{ color: inst.color }}>{inst.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Question card - dimmed in strategy mode step 1 */}
            <Card
              className="border-0 shadow-lg mb-4 transition-opacity"
              style={{
                background: c.card,
                opacity: strategyMode && strategyStep === "answers" ? 0.3 : 1,
                filter: strategyMode && strategyStep === "answers" ? "blur(3px)" : "none",
              }}
              onClick={() => {
                if (strategyMode && strategyStep === "answers") {
                  setStrategyStep("passage");
                }
              }}
            >
              <CardContent className="p-6">
                <p className="text-base leading-relaxed" style={{ color: c.cardText }}>{currentQuestion.question_text}</p>
              </CardContent>
            </Card>

            {strategyMode && strategyStep === "answers" && (
              <p className="text-center text-xs mb-4" style={{ color: c.subtext }}>
                👇 Read these answer choices first, then tap the question above
              </p>
            )}

            <div className="space-y-3 mb-4">
              {options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isRight = opt.key === currentQuestion.correct_option;
                const isEliminated = eliminated.has(opt.key);
                let bg = c.optionBg;
                let border = c.optionBorder;
                let opacity = 1;

                if (selectedAnswer) {
                  if (isRight) { bg = c.correctBg; border = c.correctBorder; }
                  else if (isSelected && !isRight) { bg = c.wrongBg; border = c.wrongBorder; }
                }

                if (strategyMode && !selectedAnswer) {
                  if (isEliminated) { opacity = 0.4; bg = "hsl(0 20% 95%)"; border = "hsl(0 30% 75%)"; }
                  if (strategyStep === "choose" && isEliminated) { opacity = 0.3; }
                }

                const disabled = !!selectedAnswer ||
                  (strategyMode && strategyStep === "answers") ||
                  (strategyMode && strategyStep === "passage") ||
                  (strategyMode && strategyStep === "choose" && isEliminated);

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(opt.key)}
                    disabled={disabled}
                    className="w-full text-left rounded-xl p-4 transition-all border-2"
                    style={{ background: bg, borderColor: border, opacity }}
                  >
                    <span className="font-semibold mr-2" style={{ color: c.optionLabel }}>{opt.key}.</span>
                    <span className={`text-sm ${isEliminated && !selectedAnswer ? "line-through" : ""}`} style={{ color: c.optionText }}>{opt.text}</span>
                    {isEliminated && !selectedAnswer && <span className="ml-2 text-xs" style={{ color: "hsl(0 40% 55%)" }}>✕</span>}
                  </button>
                );
              })}
            </div>

            {strategyMode && strategyStep === "passage" && (
              <Button className="w-full mb-4" variant="outline" onClick={() => setStrategyStep("eliminate")} style={{ borderColor: "hsl(0 50% 65%)", color: "hsl(0 50% 45%)" }}>
                <XCircle className="h-4 w-4 mr-2" /> Ready to Eliminate
              </Button>
            )}

            {selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-md mb-4" style={{ background: isCorrect ? c.feedbackCorrectBg : c.feedbackWrongBg }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="h-5 w-5" style={{ color: c.feedbackCorrectIcon }} /><span className="font-semibold" style={{ color: c.feedbackCorrectIcon }}>{mode === "confidence" ? "Yes! You got it! I knew you could. ✨" : "Correct!"}</span></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: c.feedbackWrongIcon }} /><span className="font-semibold" style={{ color: c.feedbackWrongIcon }}>{getWrongFeedback()}</span></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: c.cardText }}>{currentQuestion.explanation}</p>

                    {strategyMode && !isCorrect && (
                      <div className="p-3 rounded-lg mb-3" style={{ background: "hsl(42 50% 96%)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "hsl(42 40% 40%)" }}>Layer Method Tip</p>
                        <p className="text-sm" style={{ color: "hsl(42 25% 30%)" }}>
                          Next time, try to identify which answers are clearly in the wrong category first. Eliminating two options makes the final choice much easier.
                        </p>
                      </div>
                    )}

                    {relatedTerm && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: c.optionBorder }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: c.optionLabel }}>Related Term: {relatedTerm.term}</p>
                        <p className="text-sm italic" style={{ color: c.optionText }}>{relatedTerm.metaphor}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button className="w-full py-5 text-base" style={{ background: c.nextButton, color: "white" }} onClick={handleNext}>
                  {isLastQuestion ? "See Results" : "Next Question"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;
