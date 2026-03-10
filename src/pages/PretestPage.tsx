import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Brain, ArrowRight, CheckCircle2, XCircle, Sparkles } from "lucide-react";
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
  explanation: string;
}

const learningStyleQuestions = [
  {
    question: "When learning something new, I prefer to...",
    options: [
      { label: "See a picture or diagram", style: "visual" },
      { label: "Read about it in detail", style: "reading" },
      { label: "Try it hands-on right away", style: "kinesthetic" },
      { label: "Hear someone explain it", style: "auditory" },
    ],
  },
  {
    question: "I remember things best when I...",
    options: [
      { label: "Visualize them in my mind", style: "visual" },
      { label: "Write them down", style: "reading" },
      { label: "Practice or do them", style: "kinesthetic" },
      { label: "Say them out loud", style: "auditory" },
    ],
  },
  {
    question: "When studying for an exam, I usually...",
    options: [
      { label: "Use color-coded notes and highlights", style: "visual" },
      { label: "Re-read the textbook or notes", style: "reading" },
      { label: "Create practice scenarios", style: "kinesthetic" },
      { label: "Record and listen to summaries", style: "auditory" },
    ],
  },
  {
    question: "I feel most engaged when...",
    options: [
      { label: "Looking at images and charts", style: "visual" },
      { label: "Reading detailed explanations", style: "reading" },
      { label: "Doing hands-on activities", style: "kinesthetic" },
      { label: "Having a conversation about the topic", style: "auditory" },
    ],
  },
  {
    question: "If I had to explain a concept, I would...",
    options: [
      { label: "Draw a picture or create a metaphor", style: "visual" },
      { label: "Write it out step by step", style: "reading" },
      { label: "Demonstrate it physically", style: "kinesthetic" },
      { label: "Talk it through verbally", style: "auditory" },
    ],
  },
];

const PretestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "knowledge" | "style" | "saving">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { selected: string; correct: boolean }>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Learning style
  const [styleIdx, setStyleIdx] = useState(0);
  const [styleTally, setStyleTally] = useState<Record<string, number>>({ visual: 0, reading: 0, kinesthetic: 0, auditory: 0 });

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from("questions").select("*").limit(25);
      if (data && data.length > 0) {
        // Shuffle and take up to 20
        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 20);
        setQuestions(shuffled as Question[]);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    const q = questions[currentIdx];
    setAnswers((prev) => new Map(prev).set(q.id, { selected: option, correct: option === q.correct_option }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setPhase("style");
    }
  };

  const handleStyleAnswer = (style: string) => {
    setStyleTally((prev) => ({ ...prev, [style]: prev[style] + 1 }));
    if (styleIdx < learningStyleQuestions.length - 1) {
      setStyleIdx((i) => i + 1);
    } else {
      saveResults(style);
    }
  };

  const saveResults = async (lastStyle?: string) => {
    setPhase("saving");
    if (!user) return;

    const finalTally = lastStyle
      ? { ...styleTally, [lastStyle]: styleTally[lastStyle] + 1 }
      : styleTally;

    const learningStyle = Object.entries(finalTally).sort((a, b) => b[1] - a[1])[0][0];

    // Section scores
    const sectionScores: Record<string, { correct: number; total: number }> = {};
    answers.forEach((ans, qId) => {
      const q = questions.find((qq) => qq.id === qId);
      if (q) {
        if (!sectionScores[q.section_id]) sectionScores[q.section_id] = { correct: 0, total: 0 };
        sectionScores[q.section_id].total++;
        if (ans.correct) sectionScores[q.section_id].correct++;
      }
    });

    const totalCorrect = Array.from(answers.values()).filter((a) => a.correct).length;

    await supabase.from("pretest_results").insert({
      user_id: user.id,
      overall_score: totalCorrect,
      total_questions: questions.length,
      learning_style: learningStyle,
      section_scores: sectionScores,
    });

    // Insert individual answers
    const answerRows = Array.from(answers.entries()).map(([qId, ans]) => ({
      user_id: user.id,
      question_id: qId,
      selected_option: ans.selected,
      is_correct: ans.correct,
    }));
    if (answerRows.length > 0) {
      await supabase.from("pretest_answers").insert(answerRows);
    }

    await supabase.from("profiles").update({ has_completed_pretest: true }).eq("id", user.id);

    navigate("/pretest-results");
  };

  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
            <Brain className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Let's See Where You Are
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              This is not a test you can fail. It is a starting point. We want to understand where you are right now so we can guide you to where you are going.
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              Part 1: Knowledge Assessment ({questions.length} questions) · Part 2: Learning Style Discovery (5 questions)
            </p>
            <Button
              onClick={() => setPhase("knowledge")}
              disabled={questions.length === 0}
              className="px-8 py-6 text-base"
              style={{ background: "hsl(346 45% 56%)", color: "white" }}
            >
              Begin Assessment <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (phase === "style") {
    const sq = learningStyleQuestions[styleIdx];
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="px-4 pt-6 max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">Part 2: Learning Style</span>
            <span className="text-xs text-muted-foreground">{styleIdx + 1}/{learningStyleQuestions.length}</span>
          </div>
          <Progress value={((styleIdx + 1) / learningStyleQuestions.length) * 100} className="h-1.5 mb-6" />
          <Sparkles className="h-8 w-8 mb-4" style={{ color: "hsl(265 40% 55%)" }} />
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">{sq.question}</h2>
          <div className="space-y-3">
            {sq.options.map((opt, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStyleAnswer(opt.style)}
                className="w-full text-left p-4 rounded-xl border border-border bg-card text-sm hover:shadow-md transition-shadow"
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Analyzing your results...</p>
        </div>
      </div>
    );
  }

  // Knowledge phase
  const q = questions[currentIdx];
  if (!q) return null;

  const options = [
    { key: "A", text: q.option_a },
    { key: "B", text: q.option_b },
    { key: "C", text: q.option_c },
    { key: "D", text: q.option_d },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-4 pt-6 pb-8 max-w-md mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">Part 1: Knowledge Assessment</span>
          <span className="text-xs text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
        </div>
        <Progress value={((currentIdx + 1) / questions.length) * 100} className="h-1.5 mb-6" />

        <p className="text-sm text-foreground leading-relaxed mb-6">{q.question_text}</p>

        <div className="space-y-2">
          {options.map((opt) => {
            let bg = "hsl(30 25% 97%)";
            let border = "hsl(30 20% 88%)";
            if (answered) {
              if (opt.key === q.correct_option) {
                bg = "hsl(145 40% 92%)";
                border = "hsl(145 50% 60%)";
              } else if (opt.key === selected && selected !== q.correct_option) {
                bg = "hsl(0 40% 95%)";
                border = "hsl(0 50% 65%)";
              }
            }
            return (
              <motion.button
                key={opt.key}
                whileTap={!answered ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(opt.key)}
                disabled={answered}
                className="w-full text-left p-3 rounded-lg border text-sm transition-colors"
                style={{ background: bg, borderColor: border }}
              >
                <span className="font-semibold mr-2">{opt.key}.</span>
                {opt.text}
              </motion.button>
            );
          })}
        </div>

        {answered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              {selected === q.correct_option ? (
                <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 60% 35%)" }} />
              ) : (
                <XCircle className="h-4 w-4" style={{ color: "hsl(0 60% 50%)" }} />
              )}
              <span className="text-xs text-muted-foreground">{q.explanation}</span>
            </div>
            <Button onClick={handleNext} className="w-full mt-2">
              {currentIdx < questions.length - 1 ? "Next Question" : "Continue to Learning Style →"}
            </Button>
          </motion.div>
        )}
      </div>
      <AppFooter />
    </div>
  );
};

export default PretestPage;
