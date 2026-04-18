import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Sparkles, AlertTriangle, Heart } from "lucide-react";
import { pageColors } from "@/lib/colors";
import SpeakButton from "@/components/SpeakButton";

const c = pageColors.results;
type QuizMode = "practice" | "confidence";

const reflectionOptions = [
  { key: "terms", label: "I didn't fully know the terms", tip: "Tip: Next time, spend 2–3 minutes in Practice Activities first. A quick warm-up helps your brain recognize the terms before the questions appear." },
  { key: "rushed", label: "I rushed and skipped the steps", tip: "Tip: On your next quiz, say the four steps out loud on the first question. Slowing down for one question helps your brain stay with the plan." },
  { key: "second_guessed", label: "I second-guessed myself", tip: "Tip: If your first choice matches the key words in the question, practice trusting it. Your brain is often right the first time when you've prepared." },
];

const ResultsPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { trackQuestions } = useStudyTracker();
  const saved = useRef(false);

  const score = (location.state as any)?.score ?? 0;
  const total = (location.state as any)?.total ?? 0;
  const mode: QuizMode = (location.state as any)?.mode ?? "practice";
  const wrongCount = (location.state as any)?.wrongCount ?? 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const [totalWrongForSection, setTotalWrongForSection] = useState(0);
  const [needsPopQuiz, setNeedsPopQuiz] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);

  useEffect(() => {
    if (saved.current || !user || !id || !block) return;
    saved.current = true;
    supabase.from("quiz_results").insert({ user_id: user.id, section_id: id, block_number: Number(block), score, total_questions: total });
    // Track questions for daily goal
    if (total > 0) trackQuestions(total);
  }, [user, id, block, score, total]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchWrongCount = async () => {
      const { count } = await supabase.from("wrong_answers").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("section_id", id);
      const t = count ?? 0;
      setTotalWrongForSection(t);
      setNeedsPopQuiz(t >= 3);
    };
    fetchWrongCount();
  }, [user, id]);

  const getMessage = () => {
    if (mode === "confidence") {
      if (percentage === 100) return "Look at you! Every single one correct. You studied, you showed up, and it paid off. I am so proud of you. 💛";
      if (percentage >= 80) return "You did beautifully. A few slipped by, but your understanding is clear. Review the ones you missed and you will have this locked down.";
      if (percentage >= 60) return "You are making real progress. Some of these terms are tricky, and the fact that you are here working through them says everything about who you are. Keep going.";
      return "This is not a setback. This is information. Now you know exactly what to review. Go back through the block slowly, sit with each term, and try again when you are ready. You are capable of this.";
    }
    if (percentage === 100) return "Perfect score! You really know your stuff. 💅";
    if (percentage >= 80) return "Amazing work! You are building real understanding. Keep going!";
    if (percentage >= 60) return "Good effort! Review any terms that felt shaky, then try again.";
    return "Every attempt makes you stronger. Review the block and give it another go. You have got this!";
  };

  const selectedReflection = reflectionOptions.find((r) => r.key === reflection);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: c.gradient }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: c.heading }} />
          <h1 className="font-display text-3xl font-bold" style={{ color: c.heading }}>Block {block} Complete!</h1>
          {mode === "confidence" && <p className="text-sm" style={{ color: c.subtext }}>Confidence Builder Mode</p>}
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: c.card }}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="font-display text-5xl font-bold mb-1" style={{ color: c.scoreColor }}>{score}/{total}</div>
              <p className="text-sm" style={{ color: c.scoreSubtext }}>{percentage}% correct</p>
              {wrongCount > 0 && <p className="text-xs mt-1" style={{ color: c.wrongText }}>{wrongCount} wrong {wrongCount === 1 ? "answer" : "answers"} tracked</p>}
            </div>

            <div className="flex items-center justify-center gap-2">
              <p className="text-base leading-relaxed mb-4" style={{ color: c.bodyText }}>{getMessage()}</p>
              <SpeakButton text={getMessage()} size="icon" className="flex-shrink-0 mb-4" />
            </div>

            {/* You're Not Alone for low scores */}
            {percentage < 60 && (
              <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ background: "hsl(346 35% 96%)" }}>
                <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(346 45% 55%)" }} />
                <p className="text-xs leading-relaxed italic" style={{ color: "hsl(346 25% 35%)" }}>
                  You are not the only one who finds this tough. That's why this app exists—to walk through it with you.
                </p>
              </div>
            )}

            {/* Post-Quiz Reflection */}
            <Card className="border-0 shadow-sm mb-6 text-left" style={{ background: "hsl(42 50% 97%)" }}>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3" style={{ color: "hsl(42 30% 28%)" }}>
                  Quick check-in: What made this quiz feel hardest?
                </p>
                {!reflection ? (
                  <div className="space-y-2">
                    {reflectionOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setReflection(opt.key)}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm border-2 transition-all hover:shadow-sm"
                        style={{ background: "white", borderColor: "hsl(42 30% 85%)", color: "hsl(42 25% 30%)" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed p-3 rounded-lg" style={{ background: "hsl(42 40% 94%)", color: "hsl(42 25% 30%)" }}>
                    {selectedReflection?.tip}
                  </motion.p>
                )}
              </CardContent>
            </Card>

            {needsPopQuiz && (
              <Card className="border-2 mb-6" style={{ borderColor: c.popQuizBorder, background: c.popQuizBg }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" style={{ color: c.popQuizIcon }} />
                    <span className="font-semibold text-sm" style={{ color: c.popQuizHeading }}>Pop Quiz Required</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: c.popQuizText }}>
                    You have {totalWrongForSection} missed questions in this section. Complete a pop quiz on your missed terms before moving to the next section.
                  </p>
                  <Button className="w-full mt-3 py-4 text-sm gap-2" style={{ background: c.popQuizButton, color: "white" }} onClick={() => navigate(`/section/${id}/pop-quiz`)}>
                    <AlertTriangle className="h-4 w-4" /> Take Pop Quiz
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Button className="w-full py-5 text-base gap-2" style={{ background: c.reviewButton, color: "white" }} onClick={() => navigate(`/learn?section=${id}`)}>
                <BookOpen className="h-4 w-4" /> Review This Block
              </Button>
              <Button variant="outline" className="w-full py-5 text-base gap-2" onClick={() => navigate(`/learn?section=${id}`)}>
                <ArrowLeft className="h-4 w-4" /> Back to Learn
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResultsPage;
