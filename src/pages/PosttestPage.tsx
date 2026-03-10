import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Shield } from "lucide-react";
import AppFooter from "@/components/AppFooter";

interface Question {
  id: string;
  section_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

const EXAM_MINUTES = 90;

const PosttestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "exam" | "saving">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [timeLeft, setTimeLeft] = useState(EXAM_MINUTES * 60);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from("questions").select("*");
      if (data && data.length > 0) {
        const shuffled = data.sort(() => Math.random() - 0.5);
        setQuestions(shuffled as Question[]);
      }
    };
    fetchQuestions();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const submitExam = useCallback(async () => {
    setPhase("saving");
    if (!user) return;

    const sectionScores: Record<string, { correct: number; total: number }> = {};
    let totalCorrect = 0;

    questions.forEach((q) => {
      if (!sectionScores[q.section_id]) sectionScores[q.section_id] = { correct: 0, total: 0 };
      sectionScores[q.section_id].total++;
      const selected = answers.get(q.id);
      if (selected === q.correct_option) {
        totalCorrect++;
        sectionScores[q.section_id].correct++;
      }
    });

    await supabase.from("posttest_results").insert({
      user_id: user.id,
      overall_score: totalCorrect,
      total_questions: questions.length,
      section_scores: sectionScores,
    });

    navigate("/post-test-results");
  }, [user, questions, answers, navigate]);

  const handleSelect = (option: string) => {
    const q = questions[currentIdx];
    setAnswers((prev) => new Map(prev).set(q.id, option));
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
            <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Comprehensive Post-Test
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              This exam covers all sections and simulates the state board experience.
              You have {EXAM_MINUTES} minutes. No hints, no feedback during the exam.
              Trust everything you have learned.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              {questions.length} questions · {EXAM_MINUTES} minute time limit
            </p>
            <Button
              onClick={() => setPhase("exam")}
              disabled={questions.length === 0}
              className="px-8 py-6 text-base"
              style={{ background: "hsl(346 45% 56%)", color: "white" }}
            >
              Begin Exam <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Scoring your exam...</p>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  const options = [
    { key: "A", text: q.option_a },
    { key: "B", text: q.option_b },
    { key: "C", text: q.option_c },
    { key: "D", text: q.option_d },
  ];

  const currentAnswer = answers.get(q.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Timer bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" style={{ color: timeLeft < 300 ? "hsl(0 60% 50%)" : "hsl(0 0% 50%)" }} />
            <span className="text-xs font-mono font-medium" style={{ color: timeLeft < 300 ? "hsl(0 60% 50%)" : undefined }}>
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1 mt-2" />
      </div>

      <div className="flex-1 px-4 pt-6 pb-8 max-w-md mx-auto w-full">
        <p className="text-sm text-foreground leading-relaxed mb-6">{q.question_text}</p>

        <div className="space-y-2 mb-6">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className="w-full text-left p-3 rounded-lg border text-sm transition-colors"
              style={{
                background: currentAnswer === opt.key ? "hsl(346 30% 95%)" : "hsl(30 25% 97%)",
                borderColor: currentAnswer === opt.key ? "hsl(346 45% 56%)" : "hsl(30 20% 88%)",
              }}
            >
              <span className="font-semibold mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {currentIdx > 0 && (
            <Button variant="outline" onClick={() => setCurrentIdx((i) => i - 1)} className="flex-1">
              Previous
            </Button>
          )}
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx((i) => i + 1)} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={submitExam} className="flex-1" style={{ background: "hsl(346 45% 56%)", color: "white" }}>
              Submit Exam
            </Button>
          )}
        </div>

        {/* Question navigator */}
        <div className="mt-6 flex flex-wrap gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className="w-7 h-7 rounded text-xs font-medium border transition-colors"
              style={{
                background: answers.has(questions[i].id)
                  ? i === currentIdx ? "hsl(346 45% 56%)" : "hsl(346 30% 90%)"
                  : i === currentIdx ? "hsl(30 20% 90%)" : "transparent",
                color: i === currentIdx && answers.has(questions[i].id) ? "white" : undefined,
                borderColor: "hsl(30 20% 85%)",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PosttestPage;
