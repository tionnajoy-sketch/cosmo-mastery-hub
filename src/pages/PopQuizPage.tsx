import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

const PopQuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetchWrongQuestions = async () => {
      // Get unique question IDs the user got wrong
      const { data: wrongAnswers } = await supabase
        .from("wrong_answers")
        .select("question_id")
        .eq("user_id", user.id)
        .eq("section_id", id);

      if (!wrongAnswers || wrongAnswers.length === 0) {
        setLoading(false);
        return;
      }

      const uniqueIds = [...new Set(wrongAnswers.map((w) => w.question_id))];
      // Get up to 5 random questions from wrong answers
      const selectedIds = uniqueIds.sort(() => Math.random() - 0.5).slice(0, 5);

      const { data: questionData } = await supabase
        .from("questions")
        .select("*")
        .in("id", selectedIds);

      if (questionData) setQuestions(questionData);
      setLoading(false);
    };
    fetchWrongQuestions();
  }, [user, id]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_option;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isDone = currentIndex >= questions.length;

  const handleAnswer = async (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === currentQuestion.correct_option) {
      setScore((s) => s + 1);
      // Remove from wrong_answers since they got it right now
      if (user) {
        await supabase
          .from("wrong_answers")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", currentQuestion.id);
      }
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setCurrentIndex(questions.length); // trigger done state
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading pop quiz...</p></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(180deg, hsl(145 30% 92%), hsl(145 20% 96%))" }}>
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(145 60% 35%)" }} />
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(145 40% 25%)" }}>No Pop Quiz Needed!</h2>
            <p className="text-sm mb-6" style={{ color: "hsl(145 20% 40%)" }}>You don't have any missed questions to review. Keep going!</p>
            <Button onClick={() => navigate(`/section/${id}`)} style={{ background: "hsl(145 40% 40%)", color: "white" }}>Back to Section</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDone) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, hsl(270 30% 45%), hsl(270 25% 55%))" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Sparkles className="h-10 w-10 text-white/80 mx-auto mb-3" />
            <h1 className="font-display text-3xl font-bold text-white">Pop Quiz Complete!</h1>
          </div>
          <Card className="border-0 shadow-2xl" style={{ background: "white" }}>
            <CardContent className="p-8 text-center">
              <div className="font-display text-5xl font-bold mb-1" style={{ color: "hsl(270 35% 45%)" }}>
                {score}/{questions.length}
              </div>
              <p className="text-sm mb-4" style={{ color: "hsl(270 15% 50%)" }}>{percentage}% correct</p>
              <p className="text-base leading-relaxed mb-6" style={{ color: "hsl(270 15% 30%)" }}>
                {percentage >= 80
                  ? "Great job reviewing your weak spots! You're getting stronger. 💪"
                  : "Keep reviewing the terms you missed. Every attempt brings you closer to mastery."}
              </p>
              <Button className="w-full py-5" onClick={() => navigate(`/section/${id}`)} style={{ background: "hsl(270 35% 45%)", color: "white" }}>
                Back to Section
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(270 30% 20%), hsl(270 25% 28%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2" style={{ color: "hsl(270 20% 70%)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Section
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "hsl(270 40% 85%)" }}>
            Pop Quiz — Review Your Missed Questions
          </h1>
          <p className="text-sm" style={{ color: "hsl(270 20% 65%)" }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <Card className="border-0 shadow-lg mb-4" style={{ background: "hsl(270 15% 95%)" }}>
              <CardContent className="p-6">
                <p className="text-base leading-relaxed" style={{ color: "hsl(270 20% 15%)" }}>
                  {currentQuestion.question_text}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3 mb-4">
              {options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isRight = opt.key === currentQuestion.correct_option;
                let bg = "white";
                let border = "hsl(270 15% 80%)";
                if (selectedAnswer) {
                  if (isRight) { bg = "hsl(145 50% 92%)"; border = "hsl(145 50% 50%)"; }
                  else if (isSelected && !isRight) { bg = "hsl(0 50% 95%)"; border = "hsl(0 50% 60%)"; }
                }
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(opt.key)}
                    disabled={!!selectedAnswer}
                    className="w-full text-left rounded-xl p-4 transition-all border-2"
                    style={{ background: bg, borderColor: border }}
                  >
                    <span className="font-semibold mr-2" style={{ color: "hsl(270 30% 30%)" }}>{opt.key}.</span>
                    <span className="text-sm" style={{ color: "hsl(270 20% 20%)" }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-md mb-4" style={{ background: isCorrect ? "hsl(145 40% 94%)" : "hsl(0 30% 96%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} />
                          <span className="font-semibold" style={{ color: "hsl(145 60% 30%)" }}>You got it this time! 🌟</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" style={{ color: "hsl(0 60% 45%)" }} />
                          <span className="font-semibold" style={{ color: "hsl(0 50% 35%)" }}>Not yet. Keep studying this one.</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(270 15% 25%)" }}>
                      {currentQuestion.explanation}
                    </p>
                  </CardContent>
                </Card>

                <Button
                  className="w-full py-5 text-base"
                  style={{ background: "hsl(270 35% 50%)", color: "white" }}
                  onClick={handleNext}
                >
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

export default PopQuizPage;
