import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Target, BookOpen, Brain, Gamepad2, Sparkles } from "lucide-react";

const c = {
  gradient: "linear-gradient(180deg, hsl(220 35% 92%), hsl(230 25% 95%), hsl(240 20% 97%))",
  heading: "hsl(220 40% 22%)",
  subtext: "hsl(220 15% 48%)",
  card: "hsl(0 0% 100%)",
  accent: "hsl(220 50% 50%)",
};

interface BlockScore { block_number: number; correct: number; total: number; }

const ProgressPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sectionName, setSectionName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [blockScores, setBlockScores] = useState<BlockScore[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizzesCompleted, setQuizzesCompleted] = useState(0);
  const [activitiesCompleted, setActivitiesCompleted] = useState(0);
  const [popQuizzesCompleted, setPopQuizzesCompleted] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // Get first section
      const { data: sections } = await supabase.from("sections").select("*").order("order").limit(1);
      if (!sections || sections.length === 0) return;
      const section = sections[0];
      setSectionName(section.name);
      setSectionId(section.id);

      // Get all quiz results for this section
      const { data: results } = await supabase
        .from("quiz_results")
        .select("block_number, score, total_questions")
        .eq("section_id", section.id)
        .eq("user_id", user.id);

      if (results) {
        setQuizzesCompleted(results.length);
        let tq = 0;
        const scoreMap = new Map<number, { correct: number; total: number }>();
        results.forEach((r) => {
          tq += r.total_questions;
          const existing = scoreMap.get(r.block_number) || { correct: 0, total: 0 };
          existing.correct += r.score;
          existing.total += r.total_questions;
          scoreMap.set(r.block_number, existing);
        });
        setTotalQuestions(tq);
        setBlockScores(
          Array.from(scoreMap.entries())
            .map(([block_number, data]) => ({ block_number, ...data }))
            .sort((a, b) => a.block_number - b.block_number)
        );
      }

      // Get activity count
      const { data: activity } = await supabase
        .from("study_activity")
        .select("activities_completed")
        .eq("user_id", user.id);
      if (activity) {
        setActivitiesCompleted(activity.reduce((sum, a) => sum + (a as any).activities_completed, 0));
      }

      // Get pop quiz count (wrong_answers used as proxy)
      const { count } = await supabase
        .from("wrong_answers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("section_id", section.id);
      setPopQuizzesCompleted(count ? Math.floor(count / 5) : 0);
    };
    fetchAll();
  }, [user]);

  const overallCorrect = blockScores.reduce((s, b) => s + b.correct, 0);
  const overallTotal = blockScores.reduce((s, b) => s + b.total, 0);
  const readiness = overallTotal > 0 ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  const strongBlocks = blockScores.filter((b) => b.total > 0 && (b.correct / b.total) >= 0.75);
  const weakBlocks = blockScores.filter((b) => b.total > 0 && (b.correct / b.total) < 0.75);

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-7 w-7" style={{ color: c.accent }} />
            <h1 className="font-display text-3xl font-bold" style={{ color: c.heading }}>Your Progress</h1>
          </div>
          <p className="text-sm mb-6" style={{ color: c.subtext }}>
            See how far you've come. Every step matters.
          </p>
        </motion.div>

        {/* Section Readiness */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md mb-4" style={{ background: c.card }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5" style={{ color: "hsl(145 50% 40%)" }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.heading }}>
                  {sectionName || "Section"} Readiness
                </h3>
              </div>
              <div className="text-center mb-3">
                <div className="font-display text-4xl font-bold" style={{ color: readiness >= 75 ? "hsl(145 50% 40%)" : readiness >= 50 ? "hsl(42 60% 48%)" : "hsl(25 60% 50%)" }}>
                  {readiness}%
                </div>
                <p className="text-xs" style={{ color: c.subtext }}>estimated readiness</p>
              </div>
              <Progress value={readiness} className="h-2.5 mb-3" />
              <p className="text-xs leading-relaxed" style={{ color: c.subtext }}>
                This is an estimate based on your quizzes and the Final Check. Use it as a guide, not a judgment.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Block Scores */}
        {blockScores.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md mb-4" style={{ background: c.card }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5" style={{ color: c.accent }} />
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.heading }}>Strengths & Focus Areas</h3>
                </div>
                <div className="space-y-2 mb-4">
                  {blockScores.map((b) => {
                    const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
                    return (
                      <div key={b.block_number} className="flex items-center gap-3">
                        <span className="text-xs w-16" style={{ color: c.subtext }}>Block {b.block_number}</span>
                        <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                        <span className="text-xs font-medium w-10 text-right" style={{ color: pct >= 75 ? "hsl(145 50% 40%)" : "hsl(25 60% 50%)" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                {strongBlocks.length > 0 && (
                  <p className="text-sm mb-1" style={{ color: "hsl(145 40% 35%)" }}>
                    ✨ You're strongest in: {strongBlocks.map((b) => `Block ${b.block_number}`).join(", ")}
                  </p>
                )}
                {weakBlocks.length > 0 && (
                  <p className="text-sm" style={{ color: "hsl(25 50% 45%)" }}>
                    📖 Review these next: {weakBlocks.map((b) => `Block ${b.block_number}`).join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Activity Summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-md mb-6" style={{ background: c.card }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5" style={{ color: "hsl(42 58% 48%)" }} />
                <h3 className="font-display text-lg font-semibold" style={{ color: c.heading }}>Activity Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BookOpen, label: "Questions answered", value: totalQuestions },
                  { icon: Brain, label: "Quizzes completed", value: quizzesCompleted },
                  { icon: Gamepad2, label: "Practice activities", value: activitiesCompleted },
                  { icon: Target, label: "Pop quizzes", value: popQuizzesCompleted },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg text-center" style={{ background: "hsl(220 25% 96%)" }}>
                    <item.icon className="h-5 w-5 mx-auto mb-1" style={{ color: c.accent }} />
                    <p className="font-display text-2xl font-bold" style={{ color: c.heading }}>{item.value}</p>
                    <p className="text-xs" style={{ color: c.subtext }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {sectionId && (
          <Button className="w-full py-5 text-base gap-2" style={{ background: c.accent, color: "white" }} onClick={() => navigate(`/section/${sectionId}`)}>
            <BookOpen className="h-4 w-4" /> Continue Studying
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
