import { useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, ArrowLeft, Sparkles } from "lucide-react";

type QuizMode = "practice" | "confidence";

const ResultsPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const saved = useRef(false);

  const score = (location.state as any)?.score ?? 0;
  const total = (location.state as any)?.total ?? 0;
  const mode: QuizMode = (location.state as any)?.mode ?? "practice";
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  useEffect(() => {
    if (saved.current || !user || !id || !block) return;
    saved.current = true;
    supabase.from("quiz_results").insert({
      user_id: user.id,
      section_id: id,
      block_number: Number(block),
      score,
      total_questions: total,
    });
  }, [user, id, block, score, total]);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, hsl(346 40% 55%), hsl(25 55% 60%))" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Sparkles className="h-10 w-10 text-white/80 mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Block {block} Complete!
          </h1>
          {mode === "confidence" && (
            <p className="text-sm text-white/70">Confidence Builder Mode</p>
          )}
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: "white" }}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="font-display text-5xl font-bold mb-1" style={{ color: "hsl(346 45% 45%)" }}>
                {score}/{total}
              </div>
              <p className="text-sm" style={{ color: "hsl(346 15% 50%)" }}>
                {percentage}% correct
              </p>
            </div>

            <p className="text-base leading-relaxed mb-8" style={{ color: "hsl(346 15% 30%)" }}>
              {getMessage()}
            </p>

            <div className="space-y-3">
              <Button
                className="w-full py-5 text-base gap-2"
                style={{ background: "hsl(346 45% 50%)", color: "white" }}
                onClick={() => navigate(`/section/${id}/study/${block}`)}
              >
                <BookOpen className="h-4 w-4" /> Review This Block
              </Button>
              <Button
                variant="outline"
                className="w-full py-5 text-base gap-2"
                onClick={() => navigate(`/section/${id}`)}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Section
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResultsPage;
