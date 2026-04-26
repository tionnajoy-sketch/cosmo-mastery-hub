import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Brain, Heart, Target, Eye, BookOpen, Sparkles, Shield, Library } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useCoins } from "@/hooks/useCoins";
import ConfidenceRatingPrompt from "@/components/ConfidenceRatingPrompt";
import { saveConfidenceRating } from "@/lib/confidence/saveConfidenceRating";
import type { UnderstandingStatus } from "@/lib/confidence/understanding";

const c = pageColors.quiz;

interface Question {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

type QuizMode = "practice" | "confidence";

const preQuizMessages = [
  "These questions came straight from your uploaded materials. You've seen this content before — trust yourself.",
  "Your Quiz Bank grows every time you upload. Each question is another chance to strengthen your knowledge.",
  "Take your time. These are real exam-style questions from your study materials.",
];

const ModuleQuizBankPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleTitle, setModuleTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [strategyMode, setStrategyMode] = useState(false);
  const [strategyStep, setStrategyStep] = useState<"answers" | "passage" | "eliminate" | "choose">("answers");
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [preQuizMessage] = useState(() => preQuizMessages[Math.floor(Math.random() * preQuizMessages.length)]);
  const [resultsSaved, setResultsSaved] = useState(false);
  const { addCoins } = useCoins();
  const [confidenceStatusByQ, setConfidenceStatusByQ] = useState<Record<number, UnderstandingStatus>>({});
  const confidenceComplete = selectedAnswer ? !!confidenceStatusByQ[currentIndex] : true;

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [modRes, qbRes] = await Promise.all([
        supabase.from("uploaded_modules").select("title").eq("id", id).single(),
        supabase.from("uploaded_module_quiz_bank").select("*").eq("module_id", id),
      ]);
      if (modRes.data) setModuleTitle(modRes.data.title);
      if (qbRes.data) {
        setQuestions(qbRes.data.sort(() => Math.random() - 0.5));
      }
    };
    fetchData();
  }, [id]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_option;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    if (strategyMode && strategyStep === "eliminate") {
      if (eliminated.has(option)) {
        setEliminated(prev => { const n = new Set(prev); n.delete(option); return n; });
      } else if (eliminated.size < 2) {
        setEliminated(prev => new Set(prev).add(option));
      }
      if (eliminated.size === 1 && !eliminated.has(option)) {
        setTimeout(() => setStrategyStep("choose"), 300);
      }
      return;
    }
    if (strategyMode && strategyStep !== "choose") return;

    setSelectedAnswer(option);
    if (option === currentQuestion.correct_option) {
      setScore((s) => s + 1);
      addCoins(10, "correct");
    } else {
      setWrongCount((cnt) => cnt + 1);
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      // Save results
      if (user && !resultsSaved) {
        setResultsSaved(true);
        await supabase.from("uploaded_quiz_results").insert({
          user_id: user.id,
          module_id: id!,
          block_number: 0, // 0 = quiz bank
          score,
          total_questions: questions.length,
          mode: "quiz_bank",
        });
      }
      navigate(`/module/${id}/results/0`, {
        state: { score, total: questions.length, mode, wrongCount, moduleTitle, isQuizBank: true },
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setStrategyStep("answers");
      setEliminated(new Set());
    }
  };

  // Mode selection
  if (!mode) {
    return (
      <div className="min-h-screen px-4 py-6" style={{ background: c.gradient }}>
        <div className="max-w-md mx-auto">
          <Button variant="ghost" onClick={() => navigate(`/module/${id}`)} className="mb-4 gap-2" style={{ color: c.backButton }}>
            <ArrowLeft className="h-4 w-4" /> Back to Module
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-6 w-6" style={{ color: c.heading }} />
              <h1 className="font-display text-2xl font-bold" style={{ color: c.heading }}>Quiz Bank</h1>
            </div>
            <p className="text-sm" style={{ color: c.subtext }}>{moduleTitle} · {questions.length} questions from your uploaded materials</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-md mb-6" style={{ background: "hsl(42 50% 96%)" }}>
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 58% 48%)" }} />
                <p className="text-sm italic leading-relaxed" style={{ color: "hsl(42 30% 28%)" }}>{preQuizMessage}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.practiceBg, borderColor: c.practiceBorder }} onClick={() => setMode("practice")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="h-6 w-6" style={{ color: c.practiceIcon }} />
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.practiceHeading }}>Practice Mode</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: c.practiceText }}>Standard exam prep with direct feedback.</p>
              </CardContent>
            </Card>

            <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.confidenceBg, borderColor: c.confidenceBorder }} onClick={() => setMode("confidence")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="h-6 w-6" style={{ color: c.confidenceIcon }} />
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.confidenceHeading }}>Confidence Builder</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: c.confidenceText }}>Gentler feedback to build your confidence.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" style={{ background: c.practiceBg }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5" style={{ color: c.practiceIcon }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: c.practiceHeading }}>Strategy Mode</p>
                    <p className="text-xs" style={{ color: c.practiceText }}>4-step exam strategy</p>
                  </div>
                </div>
                <Switch checked={strategyMode} onCheckedChange={setStrategyMode} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">No quiz bank questions available.</p></div>;
  }

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  const getWrongFeedback = () => mode === "confidence"
    ? "That was not the best answer, but you are learning and that is what matters."
    : "Not quite. Let's review.";

  const getStrategyInstruction = () => {
    switch (strategyStep) {
      case "answers": return { icon: Eye, text: "Step 1: Read the answer choices first", color: "hsl(200 50% 45%)" };
      case "passage": return { icon: BookOpen, text: "Step 2: Now read the question", color: "hsl(42 55% 45%)" };
      case "eliminate": return { icon: XCircle, text: `Step 3: Eliminate 2 wrong answers (${eliminated.size}/2)`, color: "hsl(0 50% 50%)" };
      case "choose": return { icon: CheckCircle2, text: "Step 4: Choose the best answer", color: "hsl(145 50% 38%)" };
    }
  };

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/module/${id}`)} className="mb-4 gap-2" style={{ color: c.backButton }}>
          <ArrowLeft className="h-4 w-4" /> Back to Module
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Library className="h-5 w-5" style={{ color: c.heading }} />
            <h1 className="font-display text-2xl font-bold" style={{ color: c.heading }}>Quiz Bank</h1>
            {mode === "confidence" && <Heart className="h-4 w-4" style={{ color: c.confidenceIcon }} />}
          </div>
          <p className="text-sm" style={{ color: c.subtext }}>
            Question {currentIndex + 1} of {questions.length}
            {strategyMode && " · Strategy Mode"}
          </p>
        </div>

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
            <Card
              className="border-0 shadow-lg mb-4 transition-opacity"
              style={{
                background: c.card,
                opacity: strategyMode && strategyStep === "answers" ? 0.3 : 1,
                filter: strategyMode && strategyStep === "answers" ? "blur(3px)" : "none",
              }}
            >
              <CardContent className="p-6">
                <p className="text-base font-medium leading-relaxed" style={{ color: c.cardText }}>
                  {currentQuestion.question_text}
                </p>
              </CardContent>
            </Card>

            {strategyMode && strategyStep === "answers" && (
              <div className="flex justify-center mb-4">
                <Button size="sm" onClick={() => setStrategyStep("passage")} style={{ background: "hsl(200 50% 45%)", color: "white" }}>
                  I've read the answers → Read the question
                </Button>
              </div>
            )}
            {strategyMode && strategyStep === "passage" && (
              <div className="flex justify-center mb-4">
                <Button size="sm" onClick={() => setStrategyStep("eliminate")} style={{ background: "hsl(42 55% 45%)", color: "white" }}>
                  I've read the question → Eliminate wrong answers
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {options.map(({ key, text }) => {
                const isSelected = selectedAnswer === key;
                const isCorrectOption = key === currentQuestion.correct_option;
                const isEliminated = eliminated.has(key);

                let bg = c.optionBg;
                let border = "transparent";
                let opacity = isEliminated ? 0.4 : 1;

                if (selectedAnswer) {
                  if (isSelected && isCorrectOption) { bg = c.correctBg; border = c.correctBorder; }
                  else if (isSelected && !isCorrectOption) { bg = c.wrongBg; border = c.wrongBorder; }
                  else if (isCorrectOption) { bg = c.correctBg; border = c.correctBorder; }
                }

                return (
                  <motion.button
                    key={key}
                    onClick={() => handleAnswer(key)}
                    className="w-full text-left p-4 rounded-xl text-sm transition-all"
                    style={{ background: bg, border: `2px solid ${border}`, color: c.optionText, opacity }}
                    disabled={!!selectedAnswer}
                    whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                  >
                    <span className="font-bold mr-2">{key})</span> {text}
                    {selectedAnswer && isCorrectOption && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: c.correctBorder }} />}
                    {selectedAnswer && isSelected && !isCorrectOption && <XCircle className="inline h-4 w-4 ml-2" style={{ color: c.wrongBorder }} />}
                  </motion.button>
                );
              })}
            </div>

            {selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Card className="border-0 shadow-md" style={{ background: isCorrect ? c.correctBg : c.wrongBg }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="h-5 w-5" style={{ color: c.correctBorder }} /><p className="font-semibold" style={{ color: c.correctBorder }}>Correct!</p></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: c.wrongBorder }} /><p className="font-semibold" style={{ color: c.wrongBorder }}>{getWrongFeedback()}</p></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: c.cardText }}>{currentQuestion.explanation}</p>
                  </CardContent>
                </Card>

                <Button onClick={handleNext} className="w-full mt-4 py-5" style={{ background: c.nextButton, color: "hsl(0 0% 100%)" }}>
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

export default ModuleQuizBankPage;
