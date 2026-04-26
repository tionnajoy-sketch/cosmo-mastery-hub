import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, CheckCircle2, XCircle } from "lucide-react";
import { shuffleOptions } from "@/lib/shuffleOptions";
import ConfidenceRatingPrompt from "./ConfidenceRatingPrompt";
import { saveConfidenceRating } from "@/lib/confidence/saveConfidenceRating";
import type { UnderstandingStatus } from "@/lib/confidence/understanding";

interface PopupQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

const POPUP_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
const LAST_POPUP_KEY = "random_quiz_last_shown";

const RandomQuizPopup = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState<PopupQuestion | null>(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confidenceStatus, setConfidenceStatus] = useState<UnderstandingStatus | null>(null);

  const fetchRandomWrongQuestion = useCallback(async () => {
    if (!user) return;

    // Check if enough time has passed
    const lastShown = sessionStorage.getItem(LAST_POPUP_KEY);
    if (lastShown && Date.now() - Number(lastShown) < POPUP_INTERVAL_MS) return;

    const { data: wrongAnswers } = await supabase
      .from("wrong_answers")
      .select("question_id")
      .eq("user_id", user.id)
      .limit(20);

    if (!wrongAnswers || wrongAnswers.length === 0) return;

    const uniqueIds = [...new Set(wrongAnswers.map(w => w.question_id))];
    const randomId = uniqueIds[Math.floor(Math.random() * uniqueIds.length)];

    const { data: q } = await supabase
      .from("questions")
      .select("id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation")
      .eq("id", randomId)
      .single();

    if (q) {
      setQuestion(q);
      setVisible(true);
      sessionStorage.setItem(LAST_POPUP_KEY, String(Date.now()));
    }
  }, [user]);

  useEffect(() => {
    // Initial check after 2 minutes
    const initialTimer = setTimeout(fetchRandomWrongQuestion, 2 * 60 * 1000);
    // Then check every 5 minutes
    const interval = setInterval(fetchRandomWrongQuestion, POPUP_INTERVAL_MS);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchRandomWrongQuestion]);

  const handleAnswer = (option: string) => {
    if (submitted) return;
    setSelected(option);
    setSubmitted(true);
  };

  const handleDismiss = () => {
    setVisible(false);
    setQuestion(null);
    setSelected(null);
    setSubmitted(false);
  };

  if (!visible || !question) return null;

  const sh = shuffleOptions(
    { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d },
    question.correct_option,
    question.id,
  );
  const isCorrect = selected === sh.correctLetter;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="border-0 shadow-2xl" style={{ background: "white" }}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" style={{ color: "hsl(350 55% 48%)" }} />
                <h4 className="font-display text-sm font-semibold" style={{ color: "hsl(220 30% 25%)" }}>Quick Check-In</h4>
              </div>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(220 15% 30%)" }}>
              {question.question_text}
            </p>

            <div className="space-y-2 mb-3">
              {sh.options.map(opt => {
                const isThis = selected === opt.letter;
                const isRight = opt.letter === sh.correctLetter;
                let bg = "hsl(220 30% 97%)";
                let border = "hsl(220 20% 90%)";
                if (submitted && isRight) { bg = "hsl(145 40% 92%)"; border = "hsl(145 45% 65%)"; }
                else if (submitted && isThis && !isCorrect) { bg = "hsl(350 40% 94%)"; border = "hsl(350 50% 70%)"; }

                return (
                  <button
                    key={opt.letter}
                    onClick={() => handleAnswer(opt.letter)}
                    disabled={submitted}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm border transition-all"
                    style={{ background: bg, borderColor: border }}
                  >
                    <span className="font-medium mr-2">{opt.letter}.</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <><CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 50% 40%)" }} /><span className="text-sm font-medium" style={{ color: "hsl(145 40% 30%)" }}>You got it! That memory is getting stronger.</span></>
                  ) : (
                    <><XCircle className="h-5 w-5" style={{ color: "hsl(350 55% 48%)" }} /><span className="text-sm font-medium" style={{ color: "hsl(350 40% 30%)" }}>Not quite — seeing it again helps your brain lock it in.</span></>
                  )}
                </div>
                <p className="text-xs mb-3" style={{ color: "hsl(220 15% 45%)" }}>{question.explanation}</p>
                <Button size="sm" onClick={handleDismiss} className="w-full text-xs" style={{ background: "hsl(220 50% 55%)", color: "white" }}>
                  Continue Studying
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default RandomQuizPopup;
