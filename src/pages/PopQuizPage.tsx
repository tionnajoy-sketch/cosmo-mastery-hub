import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { shuffleOptions } from "@/lib/shuffleOptions";

const c = pageColors.popQuiz;

interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; explanation: string; }

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
      const { data: wrongAnswers } = await supabase.from("wrong_answers").select("question_id").eq("user_id", user.id).eq("section_id", id);
      if (!wrongAnswers || wrongAnswers.length === 0) { setLoading(false); return; }
      const uniqueIds = [...new Set(wrongAnswers.map((w) => w.question_id))];
      const selectedIds = uniqueIds.sort(() => Math.random() - 0.5).slice(0, 5);
      const { data: questionData } = await supabase.from("questions").select("*").in("id", selectedIds);
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
      if (user) await supabase.from("wrong_answers").delete().eq("user_id", user.id).eq("question_id", currentQuestion.id);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) setCurrentIndex(questions.length);
    else { setCurrentIndex((i) => i + 1); setSelectedAnswer(null); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading pop quiz...</p></div>;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: c.emptyBg }}>
        <Card className="border-0 shadow-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: c.emptyIcon }} />
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: c.emptyHeading }}>No Pop Quiz Needed!</h2>
            <p className="text-sm mb-6" style={{ color: c.emptyText }}>You don't have any missed questions to review. Keep going!</p>
            <Button onClick={() => navigate(`/section/${id}`)} style={{ background: c.emptyButton, color: "white" }}>Back to Section</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDone) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: c.resultGradient }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.8)" }} />
            <h1 className="font-display text-3xl font-bold" style={{ color: "hsl(0 0% 100%)" }}>Pop Quiz Complete!</h1>
          </div>
          <Card className="border-0 shadow-2xl" style={{ background: "white" }}>
            <CardContent className="p-8 text-center">
              <div className="font-display text-5xl font-bold mb-1" style={{ color: c.resultScore }}>{score}/{questions.length}</div>
              <p className="text-sm mb-4" style={{ color: c.resultSubtext }}>{percentage}% correct</p>
              <p className="text-base leading-relaxed mb-6" style={{ color: c.resultBody }}>
                {percentage >= 80 ? "Great job reviewing your weak spots! You're getting stronger. 💪" : "Keep reviewing the terms you missed. Every attempt brings you closer to mastery."}
              </p>
              <Button className="w-full py-5" onClick={() => navigate(`/section/${id}`)} style={{ background: c.nextButton, color: "white" }}>Back to Section</Button>
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
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2" style={{ color: c.backButton }}>
          <ArrowLeft className="h-4 w-4" /> Back to Section
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: c.heading }}>Pop Quiz — Review Your Missed Questions</h1>
          <p className="text-sm" style={{ color: c.subtext }}>Question {currentIndex + 1} of {questions.length}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <Card className="border-0 shadow-lg mb-4" style={{ background: c.card }}>
              <CardContent className="p-6">
                <p className="text-base leading-relaxed" style={{ color: c.cardText }}>{currentQuestion.question_text}</p>
              </CardContent>
            </Card>

            <div className="space-y-3 mb-4">
              {options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isRight = opt.key === currentQuestion.correct_option;
                let bg = c.optionBg;
                let border = c.optionBorder;
                if (selectedAnswer) {
                  if (isRight) { bg = c.correctBg; border = c.correctBorder; }
                  else if (isSelected && !isRight) { bg = c.wrongBg; border = c.wrongBorder; }
                }
                return (
                  <button key={opt.key} onClick={() => handleAnswer(opt.key)} disabled={!!selectedAnswer} className="w-full text-left rounded-xl p-4 transition-all border-2" style={{ background: bg, borderColor: border }}>
                    <span className="font-semibold mr-2" style={{ color: c.optionLabel }}>{opt.key}.</span>
                    <span className="text-sm" style={{ color: c.optionText }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-md mb-4" style={{ background: isCorrect ? c.feedbackCorrectBg : c.feedbackWrongBg }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} /><span className="font-semibold" style={{ color: "hsl(145 60% 30%)" }}>You got it this time! 🌟</span></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: "hsl(0 60% 45%)" }} /><span className="font-semibold" style={{ color: "hsl(0 50% 35%)" }}>Not yet. Keep studying this one.</span></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: c.feedbackText }}>{currentQuestion.explanation}</p>
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

export default PopQuizPage;
