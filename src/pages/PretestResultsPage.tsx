import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell } from "recharts";
import { Brain, ArrowRight, Sparkles, BookOpen, Eye, Headphones, Hand } from "lucide-react";
import AppFooter from "@/components/AppFooter";

const styleInfo: Record<string, { label: string; icon: any; color: string; tip: string }> = {
  visual: { label: "Visual Learner", icon: Eye, color: "hsl(265 40% 55%)", tip: "You learn best through images, diagrams, and metaphors. The Picture and Metaphor layers in the TJ Anderson Layer Method™: Core Cross Agent™ will be especially powerful for you." },
  reading: { label: "Reading/Writing Learner", icon: BookOpen, color: "hsl(185 45% 40%)", tip: "You retain information by reading and writing. The Definition layer and Journal will be your strongest tools." },
  kinesthetic: { label: "Hands-On Learner", icon: Hand, color: "hsl(25 65% 50%)", tip: "You learn by doing. Activities like Build the Body, Word Scramble, and Mnemonic Builder are designed for you." },
  auditory: { label: "Auditory Learner", icon: Headphones, color: "hsl(346 45% 56%)", tip: "You learn best through listening and speaking. Try reading the Affirmations out loud and discussing metaphors with a study partner." },
};

const PIE_COLORS = ["hsl(145 50% 45%)", "hsl(0 50% 65%)", "hsl(30 20% 88%)"];

const PretestResultsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [resResult, resSections] = await Promise.all([
        supabase.from("pretest_results").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("sections").select("*").order("order"),
      ]);
      if (resResult.data) setResult(resResult.data);
      if (resSections.data) setSections(resSections.data);
    };
    fetch();
  }, [user]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const style = styleInfo[result.learning_style] || styleInfo.visual;
  const StyleIcon = style.icon;
  const percent = result.total_questions > 0 ? Math.round((result.overall_score / result.total_questions) * 100) : 0;

  const pieData = [
    { name: "Correct", value: result.overall_score },
    { name: "Incorrect", value: result.total_questions - result.overall_score },
  ];

  const sectionScores = result.section_scores as Record<string, { correct: number; total: number }> || {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 px-4 pt-8 pb-8 max-w-md mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your Starting Point</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is not a grade. This is a map. Now we know exactly where to take you.
          </p>
        </motion.div>

        {/* Score Pie */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-6">
            <PieChart width={90} height={90}>
              <Pie data={pieData} innerRadius={28} outerRadius={40} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
            </PieChart>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">{percent}%</p>
              <p className="text-xs text-muted-foreground">{result.overall_score}/{result.total_questions} correct</p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Style */}
        <Card className="border-0 shadow-md" style={{ background: `${style.color}10` }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <StyleIcon className="h-6 w-6" style={{ color: style.color }} />
              <h2 className="font-display text-lg font-semibold text-foreground">{style.label}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{style.tip}</p>
          </CardContent>
        </Card>

        {/* Section Breakdown */}
        {Object.keys(sectionScores).length > 0 && (
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">Section Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(sectionScores).map(([sId, scores]) => {
                const section = sections.find((s) => s.id === sId);
                const pct = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                return (
                  <div key={sId} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{section?.name || "Section"}</p>
                      <p className="text-xs text-muted-foreground">{scores.correct}/{scores.total} correct</p>
                    </div>
                    <span className="font-display text-lg font-bold" style={{ color: pct >= 70 ? "hsl(145 50% 40%)" : "hsl(25 65% 50%)" }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={() => navigate("/welcome")}
          className="w-full py-6 text-base"
          style={{ background: "hsl(346 45% 56%)", color: "white" }}
        >
          Continue to CosmoPrep <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <AppFooter />
    </div>
  );
};

export default PretestResultsPage;
