import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Brain, Sparkles, BookOpen, Target, Heart } from "lucide-react";
import { pageColors } from "@/lib/colors";

const c = pageColors.quiz;

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  block_number: number;
}

type ExamMode = "practice" | "exam";

const FinalExamPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackQuestions } = useStudyTracker();
  const [sectionName, setSectionName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [blockScores, setBlockScores] = useState<Map<number, { correct: number; total: number }>>(new Map());
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [examAnswers, setExamAnswers] = useState<Map<number, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [sRes, qRes] = await Promise.all([
        supabase.from("sections").select("name").eq("id", id).single(),
        supabase.from("questions").select("*").eq("section_id", id),
      ]);
      if (sRes.data) setSectionName(sRes.data.name);
      if (qRes.data) {
        const byBlock = new Map<number, Question[]>();
        qRes.data.forEach((q: Question) => {
          if (!byBlock.has(q.block_number)) byBlock.set(q.block_number, []);
          byBlock.get(q.block_number)!.push(q);
        });
        const selected: Question[] = [];
        byBlock.forEach((qs) => {
          const shuffled = [...qs].sort(() => Math.random() - 0.5);
          selected.push(...shuffled.slice(0, Math.min(4, qs.length)));
        });
        setQuestions(selected.sort(() => Math.random() - 0.5));
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (mode === "exam" && timeLeft > 0 && !done) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { finishExam(); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [mode, done]);

  // Track questions when done
  useEffect(() => {
    if (done && !trackedRef.current && questions.length > 0) {
      trackedRef.current = true;
      trackQuestions(questions.length);
    }
  }, [done]);

  const startExam = (m: ExamMode) => {
    setMode(m);
    if (m === "exam") setTimeLeft(questions.length * 60);
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const bs = new Map<number, { correct: number; total: number }>();
    let totalCorrect = 0;
    questions.forEach((q, i) => {
      const ans = examAnswers.get(i);
      const entry = bs.get(q.block_number) || { correct: 0, total: 0 };
      entry.total++;
      if (ans === q.correct_option) { entry.correct++; totalCorrect++; }
      bs.set(q.block_number, entry);
    });
    setBlockScores(bs);
    setScore(totalCorrect);
    setDone(true);
  };

  const handleAnswer = (option: string) => {
    if (mode === "exam") {
      setExamAnswers((prev) => new Map(prev).set(currentIndex, option));
      if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
    } else {
      if (selectedAnswer) return;
      setSelectedAnswer(option);
      const q = questions[currentIndex];
      const bs = new Map(blockScores);
      const entry = bs.get(q.block_number) || { correct: 0, total: 0 };
      entry.total++;
      if (option === q.correct_option) { entry.correct++; setScore((s) => s + 1); }
      bs.set(q.block_number, entry);
      setBlockScores(bs);
    }
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      if (mode === "exam") finishExam();
      else setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Mode selection
  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: c.gradient }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-4">
          <div className="text-center mb-6">
            <Target className="h-10 w-10 mx-auto mb-3" style={{ color: c.heading }} />
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>{sectionName} Final Check</h1>
            <p className="text-sm" style={{ color: c.subtext }}>Test yourself on all blocks at once. {questions.length} questions.</p>
          </div>

          {/* You're Not Alone - before Final Check */}
          <Card className="border-0 shadow-sm" style={{ background: "hsl(185 18% 28%)" }}>
            <CardContent className="p-4 flex items-start gap-2">
              <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(346 45% 65%)" }} />
              <p className="text-xs leading-relaxed italic" style={{ color: "hsl(185 15% 75%)" }}>
                This is practice, not a judgment. Other students miss questions here too. The goal is to learn what to review—not to be perfect.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.practiceBg, borderColor: c.practiceBorder }} onClick={() => startExam("practice")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="h-6 w-6" style={{ color: c.practiceIcon }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.practiceHeading }}>Practice Mode</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.practiceText }}>See explanations after each question. No timer.</p>
            </CardContent>
          </Card>

          <Card className="border-2 cursor-pointer hover:shadow-lg transition-all" style={{ background: c.confidenceBg, borderColor: c.confidenceBorder }} onClick={() => startExam("exam")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6" style={{ color: c.confidenceIcon }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.confidenceHeading }}>Exam Mode</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: c.confidenceText }}>Timed. Explanations shown only at the end.</p>
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="w-full mt-4 gap-2" style={{ color: c.backButton }}>
            <ArrowLeft className="h-4 w-4" /> Back to Section
          </Button>
        </motion.div>
      </div>
    );
  }

  // Results
  if (done) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const sortedBlocks = Array.from(blockScores.entries()).sort(([a], [b]) => a - b);
    const strongBlocks = sortedBlocks.filter(([, v]) => v.total > 0 && (v.correct / v.total) >= 0.75).map(([k]) => `Block ${k}`);
    const weakBlocks = sortedBlocks.filter(([, v]) => v.total > 0 && (v.correct / v.total) < 0.75).map(([k]) => `Block ${k}`);

    const reflectionTips: Record<string, string> = {
      "weak_blocks": "Tip: Go back to the blocks listed above and spend time in Study and Practice Activities. A solid warm-up makes the final check much easier.",
      "four_steps": "Tip: On your next attempt, try using Strategy Mode in the block quizzes first. Practicing the 4 steps on smaller quizzes helps you use them naturally on longer exams.",
      "slow_down": "Tip: Before your next Final Check, take three deep breaths and remind yourself that slowing down is a strategy, not a weakness. Your brain does better when it feels safe.",
    };

    return (
      <div className="min-h-screen px-4 py-8" style={{ background: c.gradient }}>
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-6">
              <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: c.heading }} />
              <h1 className="font-display text-3xl font-bold" style={{ color: c.heading }}>{sectionName} Final Check Complete!</h1>
            </div>

            <Card className="border-0 shadow-2xl mb-4" style={{ background: "white" }}>
              <CardContent className="p-6 text-center">
                <div className="font-display text-5xl font-bold mb-1" style={{ color: c.heading }}>{score}/{questions.length}</div>
                <p className="text-sm mb-4" style={{ color: c.subtext }}>{percentage}% correct</p>

                {/* You're Not Alone for low scores */}
                {percentage < 60 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-left" style={{ background: "hsl(346 35% 96%)" }}>
                    <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(346 45% 55%)" }} />
                    <p className="text-xs leading-relaxed italic" style={{ color: "hsl(346 25% 35%)" }}>
                      You are not the only one who finds this tough. That's why this app exists—to walk through it with you.
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-left mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.subtext }}>Score by Block</p>
                  {sortedBlocks.map(([block, data]) => {
                    const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                    return (
                      <div key={block} className="flex items-center gap-3">
                        <span className="text-xs w-16" style={{ color: c.subtext }}>Block {block}</span>
                        <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                        <span className="text-xs font-medium w-10 text-right" style={{ color: pct >= 75 ? "hsl(145 50% 40%)" : "hsl(25 60% 50%)" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                {strongBlocks.length > 0 && (
                  <p className="text-sm mb-1" style={{ color: "hsl(145 40% 35%)" }}>
                    ✨ You're strongest in: {strongBlocks.join(", ")}
                  </p>
                )}
                {weakBlocks.length > 0 && (
                  <p className="text-sm mb-4" style={{ color: "hsl(25 50% 45%)" }}>
                    📖 Review before test day: {weakBlocks.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Reflection */}
            <Card className="border-0 shadow-md mb-4" style={{ background: "hsl(42 50% 97%)" }}>
              <CardContent className="p-5">
                <p className="text-sm font-medium mb-3" style={{ color: "hsl(42 30% 28%)" }}>
                  What will you focus on before your next Final Check?
                </p>
                {!reflection ? (
                  <div className="space-y-2">
                    {[
                      { key: "weak_blocks", label: "Review weak blocks" },
                      { key: "four_steps", label: "Practice using the 4 steps" },
                      { key: "slow_down", label: "Slow down and breathe" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setReflection(opt.key)}
                        className="w-full text-left px-4 py-3 rounded-lg text-sm border-2 transition-all hover:shadow-sm"
                        style={{ background: "white", borderColor: "hsl(42 30% 85%)", color: "hsl(42 25% 30%)" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed p-3 rounded-lg" style={{ background: "hsl(42 40% 94%)", color: "hsl(42 25% 30%)" }}>
                    {reflectionTips[reflection]}
                  </motion.p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button className="w-full py-5 text-base gap-2" style={{ background: c.nextButton, color: "white" }} onClick={() => navigate(`/section/${id}`)}>
                <BookOpen className="h-4 w-4" /> Back to Section
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Quiz UI
  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  const isCorrect = selectedAnswer === currentQuestion.correct_option;

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="gap-2" style={{ color: c.backButton }}>
            <ArrowLeft className="h-4 w-4" /> Exit
          </Button>
          {mode === "exam" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "hsl(0 40% 96%)" }}>
              <Clock className="h-4 w-4" style={{ color: timeLeft < 60 ? "hsl(0 60% 50%)" : "hsl(220 30% 50%)" }} />
              <span className="text-sm font-mono font-medium" style={{ color: timeLeft < 60 ? "hsl(0 60% 40%)" : "hsl(220 20% 35%)" }}>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h1 className="font-display text-xl font-bold mb-1" style={{ color: c.heading }}>{sectionName} Final Check</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: c.subtext }}>Question {currentIndex + 1} of {questions.length}</p>
            <p className="text-xs" style={{ color: c.subtext }}>Block {currentQuestion.block_number}</p>
          </div>
          <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5 mt-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <Card className="border-0 shadow-lg mb-4" style={{ background: "white" }}>
              <CardContent className="p-6">
                <p className="text-base leading-relaxed" style={{ color: c.cardText }}>{currentQuestion.question_text}</p>
              </CardContent>
            </Card>

            <div className="space-y-3 mb-4">
              {options.map((opt) => {
                const isSelected = mode === "exam" ? examAnswers.get(currentIndex) === opt.key : selectedAnswer === opt.key;
                const isRight = opt.key === currentQuestion.correct_option;
                let bg = "white";
                let border = "hsl(220 15% 85%)";

                if (mode === "practice" && selectedAnswer) {
                  if (isRight) { bg = "hsl(145 40% 94%)"; border = "hsl(145 50% 55%)"; }
                  else if (isSelected && !isRight) { bg = "hsl(0 40% 95%)"; border = "hsl(0 50% 60%)"; }
                } else if (mode === "exam" && isSelected) {
                  bg = "hsl(220 40% 94%)"; border = "hsl(220 50% 60%)";
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(opt.key)}
                    disabled={mode === "practice" && !!selectedAnswer}
                    className="w-full text-left rounded-xl p-4 transition-all border-2"
                    style={{ background: bg, borderColor: border }}
                  >
                    <span className="font-semibold mr-2" style={{ color: c.optionLabel }}>{opt.key}.</span>
                    <span className="text-sm" style={{ color: c.optionText }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {mode === "practice" && selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-md mb-4" style={{ background: isCorrect ? "hsl(145 40% 95%)" : "hsl(0 30% 96%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} /><span className="font-semibold" style={{ color: "hsl(145 50% 30%)" }}>Correct!</span></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: "hsl(0 55% 50%)" }} /><span className="font-semibold" style={{ color: "hsl(0 45% 35%)" }}>Not quite.</span></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(220 15% 30%)" }}>{currentQuestion.explanation}</p>
                  </CardContent>
                </Card>
                <Button className="w-full py-5 text-base" style={{ background: c.nextButton, color: "white" }} onClick={handleNext}>
                  {currentIndex === questions.length - 1 ? "See Results" : "Next Question"}
                </Button>
              </motion.div>
            )}

            {mode === "exam" && (
              <div className="flex gap-3">
                {currentIndex > 0 && (
                  <Button variant="outline" className="flex-1 py-5" onClick={() => setCurrentIndex((i) => i - 1)}>
                    Previous
                  </Button>
                )}
                {currentIndex === questions.length - 1 ? (
                  <Button className="flex-1 py-5" style={{ background: c.nextButton, color: "white" }} onClick={finishExam}>
                    Finish Exam
                  </Button>
                ) : (
                  <Button className="flex-1 py-5" style={{ background: c.nextButton, color: "white" }} onClick={() => setCurrentIndex((i) => i + 1)}>
                    Next
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FinalExamPage;
