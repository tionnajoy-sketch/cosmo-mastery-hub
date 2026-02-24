import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  related_term_id: string | null;
}

interface RelatedTerm {
  term: string;
  metaphor: string;
}

const QuizPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const [sectionName, setSectionName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [relatedTerm, setRelatedTerm] = useState<RelatedTerm | null>(null);

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
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(option);
    if (option === currentQuestion.correct_option) {
      setScore((s) => s + 1);
    }
    // Fetch related term
    if (currentQuestion.related_term_id) {
      const { data } = await supabase
        .from("terms")
        .select("term, metaphor")
        .eq("id", currentQuestion.related_term_id)
        .single();
      if (data) setRelatedTerm(data);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigate(`/section/${id}/results/${block}`, {
        state: { score: score, total: questions.length },
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRelatedTerm(null);
    }
  };

  if (!currentQuestion) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading quiz...</p></div>;
  }

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(174 45% 18%), hsl(174 35% 25%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2" style={{ color: "hsl(174 20% 70%)" }}>
          <ArrowLeft className="h-4 w-4" /> Back to Section
        </Button>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "hsl(40 60% 85%)" }}>
            {sectionName} — Block {block} Quiz
          </h1>
          <p className="text-sm" style={{ color: "hsl(174 20% 65%)" }}>
            Question {currentIndex + 1} of {questions.length} — choose the best answer.
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Question */}
            <Card className="border-0 shadow-lg mb-4" style={{ background: "hsl(174 20% 95%)" }}>
              <CardContent className="p-6">
                <p className="text-base leading-relaxed" style={{ color: "hsl(174 30% 15%)" }}>
                  {currentQuestion.question_text}
                </p>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="space-y-3 mb-4">
              {options.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isRight = opt.key === currentQuestion.correct_option;
                let bg = "white";
                let border = "hsl(174 15% 80%)";
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
                    <span className="font-semibold mr-2" style={{ color: "hsl(174 30% 30%)" }}>{opt.key}.</span>
                    <span className="text-sm" style={{ color: "hsl(174 20% 20%)" }}>{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {selectedAnswer && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-md mb-4" style={{ background: isCorrect ? "hsl(145 40% 94%)" : "hsl(0 30% 96%)" }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} /><span className="font-semibold" style={{ color: "hsl(145 60% 30%)" }}>Correct!</span></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: "hsl(0 60% 45%)" }} /><span className="font-semibold" style={{ color: "hsl(0 50% 35%)" }}>Not quite. Let's look at why.</span></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(174 15% 25%)" }}>
                      {currentQuestion.explanation}
                    </p>
                    {relatedTerm && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "hsl(174 15% 85%)" }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "hsl(174 30% 40%)" }}>
                          Related Term: {relatedTerm.term}
                        </p>
                        <p className="text-sm italic" style={{ color: "hsl(174 15% 35%)" }}>
                          {relatedTerm.metaphor}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  className="w-full py-5 text-base"
                  style={{ background: "hsl(42 55% 50%)", color: "white" }}
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

export default QuizPage;
