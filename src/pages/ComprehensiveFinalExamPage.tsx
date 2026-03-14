import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Target, Shield, Brain } from "lucide-react";
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
  section_name?: string;
}

const ComprehensiveFinalExamPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const { trackQuestions } = useStudyTracker();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [sectionScores, setSectionScores] = useState<Map<string, { correct: number; total: number }>>(new Map());
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Map<number, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const fetchAllQuestions = async () => {
      const { data: sections } = await supabase.from("sections").select("id, name");
      if (!sections) return;

      const { data: allQuestions } = await supabase.from("questions").select("*");
      if (!allQuestions) return;

      const sectionMap = new Map(sections.map((s: any) => [s.id, s.name]));

      // Group by section, pick questions evenly
      const bySection = new Map<string, Question[]>();
      allQuestions.forEach((q: any) => {
        const sName = sectionMap.get(q.section_id) || "Unknown";
        if (!bySection.has(sName)) bySection.set(sName, []);
        bySection.get(sName)!.push({ ...q, section_name: sName });
      });

      const selected: Question[] = [];
      bySection.forEach((qs, sectionName) => {
        const shuffled = [...qs].sort(() => Math.random() - 0.5);
        // Take up to 10 per section for a comprehensive exam
        selected.push(...shuffled.slice(0, Math.min(10, qs.length)));
      });

      setQuestions(selected.sort(() => Math.random() - 0.5));
      setLoading(false);
    };
    fetchAllQuestions();
  }, []);

  useEffect(() => {
    if (started && timeLeft > 0 && !done) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { finishExam(); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [started, done]);

  useEffect(() => {
    if (done && !trackedRef.current && questions.length > 0) {
      trackedRef.current = true;
      trackQuestions(questions.length);
    }
  }, [done]);

  const startExam = () => {
    setStarted(true);
    setTimeLeft(questions.length * 75); // 75 seconds per question — state board pacing
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const ss = new Map<string, { correct: number; total: number }>();
    let totalCorrect = 0;

    questions.forEach((q, i) => {
      const answer = examAnswers.get(i);
      const sName = q.section_name || "Unknown";
      if (!ss.has(sName)) ss.set(sName, { correct: 0, total: 0 });
      const entry = ss.get(sName)!;
      entry.total++;
      if (answer === q.correct_option) {
        entry.correct++;
        totalCorrect++;
      }
    });

    setScore(totalCorrect);
    setSectionScores(ss);
    setDone(true);
    if (totalCorrect >= questions.length * 0.7) {
      addCoins(25, "block_complete");
    }
  };

  const handleAnswer = (option: string) => {
    setExamAnswers((prev) => new Map(prev).set(currentIndex, option));
    setSelectedAnswer(option);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const overallPercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = overallPercent >= 70;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: c.bg }}>
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <p style={{ color: c.subtext }}>Loading comprehensive exam...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (done) {
    return (
      <div className="min-h-screen" style={{ background: c.bg }}>
        <AppHeader />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-0 shadow-lg" style={{ background: c.card }}>
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-5xl">{passed ? "🎓" : "📚"}</div>
                <h2 className="font-display text-2xl font-bold" style={{ color: c.termHeading }}>
                  {passed ? "You're State Board Ready!" : "Keep Studying — You're Getting There!"}
                </h2>
                <div className="text-4xl font-bold" style={{ color: passed ? "hsl(145 40% 45%)" : "hsl(25 80% 55%)" }}>
                  {overallPercent}%
                </div>
                <p style={{ color: c.bodyText }}>{score} of {questions.length} correct</p>
                {passed && <p className="text-sm" style={{ color: "hsl(145 40% 45%)" }}>+25 coins earned! 🪙</p>}
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border-0 shadow-md" style={{ background: c.card }}>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-display font-semibold" style={{ color: c.termHeading }}>Section Breakdown</h3>
              {Array.from(sectionScores.entries()).map(([section, { correct, total }]) => {
                const pct = Math.round((correct / total) * 100);
                return (
                  <div key={section} className="flex items-center justify-between py-2 border-b border-border/20">
                    <span className="text-sm font-medium" style={{ color: c.bodyText }}>{section}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: pct >= 70 ? "hsl(145 40% 45%)" : "hsl(0 60% 50%)" }}>
                        {pct}%
                      </span>
                      <span className="text-xs" style={{ color: c.subtext }}>({correct}/{total})</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/")} className="flex-1" variant="outline">Dashboard</Button>
            <Button onClick={() => window.location.reload()} className="flex-1" style={{ background: c.tabActive, color: c.tabActiveText }}>
              Retake Exam
            </Button>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  // Pre-exam screen
  if (!started) {
    return (
      <div className="min-h-screen" style={{ background: c.bg }}>
        <AppHeader />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>

          <Card className="border-0 shadow-lg" style={{ background: c.card }}>
            <CardContent className="p-6 space-y-5 text-center">
              <Shield className="h-12 w-12 mx-auto" style={{ color: c.tabActive }} />
              <h1 className="font-display text-2xl font-bold" style={{ color: c.termHeading }}>
                Comprehensive State Board Exam
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                This exam pulls questions from <strong>every section</strong> you've studied — just like the real cosmetology state board.
                It's timed, challenging, and designed to test if you're truly ready.
              </p>
              <div className="grid grid-cols-3 gap-3 py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: c.termHeading }}>{questions.length}</div>
                  <div className="text-xs" style={{ color: c.subtext }}>Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: c.termHeading }}>{formatTime(questions.length * 75)}</div>
                  <div className="text-xs" style={{ color: c.subtext }}>Time Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: c.termHeading }}>70%</div>
                  <div className="text-xs" style={{ color: c.subtext }}>To Pass</div>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: c.tabInactive }}>
                <p className="text-xs italic" style={{ color: c.subtext }}>
                  💡 <strong>State Board Tip:</strong> Read the answer choices FIRST, then the question stem. Eliminate two wrong answers before choosing. Stay calm — your nervous system performs best when balanced.
                </p>
              </div>
              <Button onClick={startExam} className="w-full" style={{ background: c.tabActive, color: c.tabActiveText }}>
                <Target className="h-4 w-4 mr-2" /> Begin Exam
              </Button>
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="min-h-screen" style={{ background: c.bg }}>
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: c.bodyText }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: timeLeft < 60 ? "hsl(0 60% 50%)" : c.subtext }} />
            <span className="text-sm font-mono font-bold" style={{ color: timeLeft < 60 ? "hsl(0 60% 50%)" : c.bodyText }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />

        {currentQ && (
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-0 shadow-md" style={{ background: c.card }}>
                <CardContent className="p-5 space-y-4">
                  {currentQ.section_name && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: c.tabInactive, color: c.subtext }}>
                      {currentQ.section_name}
                    </span>
                  )}
                  <p className="text-base font-medium leading-relaxed" style={{ color: c.termHeading }}>
                    {currentQ.question_text}
                  </p>
                  <div className="space-y-2">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const optKey = `option_${letter.toLowerCase()}` as keyof Question;
                      const optText = currentQ[optKey] as string;
                      const isSelected = examAnswers.get(currentIndex) === letter;

                      return (
                        <button
                          key={letter}
                          onClick={() => handleAnswer(letter)}
                          className="w-full text-left p-3 rounded-lg text-sm transition-all"
                          style={{
                            background: isSelected ? c.tabActive : c.tabInactive,
                            color: isSelected ? c.tabActiveText : c.bodyText,
                            border: `2px solid ${isSelected ? c.tabActive : "transparent"}`,
                          }}
                        >
                          <span className="font-semibold mr-2">{letter})</span> {optText}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setSelectedAnswer(null); }}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => { setCurrentIndex((i) => i + 1); setSelectedAnswer(null); }}
              className="flex-1"
              style={{ background: c.tabActive, color: c.tabActiveText }}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={finishExam}
              className="flex-1"
              style={{ background: "hsl(145 40% 45%)", color: "white" }}
            >
              Submit Exam
            </Button>
          )}
        </div>

        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5 justify-center pt-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setSelectedAnswer(null); }}
              className="w-7 h-7 rounded-full text-xs font-medium transition-all"
              style={{
                background: i === currentIndex ? c.tabActive : examAnswers.has(i) ? "hsl(145 40% 90%)" : c.tabInactive,
                color: i === currentIndex ? c.tabActiveText : c.bodyText,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default ComprehensiveFinalExamPage;
