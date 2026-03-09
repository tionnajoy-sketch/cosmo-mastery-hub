import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Brain, Heart } from "lucide-react";
import { pageColors } from "@/lib/colors";

const c = pageColors.quiz;

interface Question { id: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_option: string; explanation: string; related_term_id: string | null; }
interface RelatedTerm { term: string; metaphor: string; }
type QuizMode = "practice" | "confidence";

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
      setCurrentIndex((i) => i + 1); setSelectedAnswer(null); setRelatedTerm(null);
    }
  };

  // Mode selection
  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: c.gradient }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>{sectionName} — Block {block}</h1>
            <p className="text-base" style={{ color: c.subtext }}>Choose your quiz mode</p>
          </div>

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
          <p className="text-sm" style={{ color: c.subtext }}>Question {currentIndex + 1} of {questions.length} — {mode === "practice" ? "Practice Mode" : "Confidence Builder"}</p>
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
                        <><CheckCircle2 className="h-5 w-5" style={{ color: c.feedbackCorrectIcon }} /><span className="font-semibold" style={{ color: c.feedbackCorrectIcon }}>{mode === "confidence" ? "Yes! You got it! I knew you could. ✨" : "Correct!"}</span></>
                      ) : (
                        <><XCircle className="h-5 w-5" style={{ color: c.feedbackWrongIcon }} /><span className="font-semibold" style={{ color: c.feedbackWrongIcon }}>{getWrongFeedback()}</span></>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: c.cardText }}>{currentQuestion.explanation}</p>
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
