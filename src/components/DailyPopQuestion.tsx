import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { shuffleOptions } from "@/lib/shuffleOptions";

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

const DailyPopQuestion = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const key = `daily_pop_${user.id}_${today}`;
    if (sessionStorage.getItem(key)) return;

    const fetchQuestion = async () => {
      // Try to get a question the user got wrong before
      const { data: wrongIds } = await supabase
        .from("wrong_answers")
        .select("question_id")
        .eq("user_id", user.id)
        .limit(20);

      let q: Question | null = null;

      if (wrongIds && wrongIds.length > 0) {
        const randomId = wrongIds[Math.floor(Math.random() * wrongIds.length)].question_id;
        const { data } = await supabase.from("questions").select("*").eq("id", randomId).single();
        if (data) q = data as Question;
      }

      if (!q) {
        const { data } = await supabase.from("questions").select("*").limit(50);
        if (data && data.length > 0) {
          q = data[Math.floor(Math.random() * data.length)] as Question;
        }
      }

      if (q) {
        setQuestion(q);
        setOpen(true);
      }
      sessionStorage.setItem(key, "shown");
    };

    // Show after a short delay so homepage loads first
    const timer = setTimeout(fetchQuestion, 1200);
    return () => clearTimeout(timer);
  }, [user]);

  const handleAnswer = async (option: string) => {
    if (answered || !question || !user) return;
    setSelected(option);
    setAnswered(true);

    // Track in study_activity
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("study_activity")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .maybeSingle();

    if (existing) {
      const newCount = (existing.questions_answered || 0) + 1;
      await supabase
        .from("study_activity")
        .update({ questions_answered: newCount, goal_met: newCount >= 10 || existing.goal_met })
        .eq("id", existing.id);
    } else {
      await supabase.from("study_activity").insert({
        user_id: user.id,
        activity_date: today,
        questions_answered: 1,
        goal_met: false,
      });
    }
  };

  if (!question) return null;

  const isCorrect = selected === question.correct_option;
  const options = [
    { key: "A", text: question.option_a },
    { key: "B", text: question.option_b },
    { key: "C", text: question.option_c },
    { key: "D", text: question.option_d },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Daily Brain Boost
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">
          Start your day with a quick recall. Take a breath and trust what you know.
        </p>
        <p className="text-sm text-foreground leading-relaxed mb-4">{question.question_text}</p>
        <div className="space-y-2">
          {options.map((opt) => {
            let bg = "hsl(30 25% 97%)";
            let border = "hsl(30 20% 88%)";
            if (answered) {
              if (opt.key === question.correct_option) {
                bg = "hsl(145 40% 92%)";
                border = "hsl(145 50% 60%)";
              } else if (opt.key === selected && !isCorrect) {
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} />
              ) : (
                <XCircle className="h-5 w-5" style={{ color: "hsl(0 60% 50%)" }} />
              )}
              <span className="font-display font-semibold text-sm text-foreground">
                {isCorrect ? "Beautiful! You knew that." : "Not quite, and that is okay."}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{question.explanation}</p>
            <Button onClick={() => setOpen(false)} className="w-full" variant="outline">
              Continue to Dashboard
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DailyPopQuestion;
