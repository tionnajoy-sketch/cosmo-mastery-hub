import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Shield, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import AppFooter from "@/components/AppFooter";

const PIE_COLORS = ["hsl(145 50% 45%)", "hsl(0 50% 65%)"];
const BAR_COLORS = { pre: "hsl(265 40% 60%)", post: "hsl(145 50% 45%)" };

const PosttestResultsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postResult, setPostResult] = useState<any>(null);
  const [preResult, setPreResult] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [post, pre, secs] = await Promise.all([
        supabase.from("posttest_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("pretest_results").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("sections").select("*").order("order"),
      ]);
      if (post.data) setPostResult(post.data);
      if (pre.data) setPreResult(pre.data);
      if (secs.data) setSections(secs.data);
    };
    fetch();
  }, [user]);

  if (!postResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const percent = postResult.total_questions > 0 ? Math.round((postResult.overall_score / postResult.total_questions) * 100) : 0;
  const passed = percent >= 75;

  const prePercent = preResult && preResult.total_questions > 0
    ? Math.round((preResult.overall_score / preResult.total_questions) * 100)
    : null;

  const growth = prePercent !== null ? percent - prePercent : null;

  const pieData = [
    { name: "Correct", value: postResult.overall_score },
    { name: "Incorrect", value: postResult.total_questions - postResult.overall_score },
  ];

  // Comparison bar chart data
  const postScores = postResult.section_scores as Record<string, { correct: number; total: number }> || {};
  const preScores = preResult?.section_scores as Record<string, { correct: number; total: number }> || {};

  const barData = sections
    .filter((s) => postScores[s.id])
    .map((s) => {
      const postPct = postScores[s.id] ? Math.round((postScores[s.id].correct / postScores[s.id].total) * 100) : 0;
      const prePct = preScores[s.id] ? Math.round((preScores[s.id].correct / preScores[s.id].total) * 100) : 0;
      return { name: s.name.substring(0, 12), pre: prePct, post: postPct };
    });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 px-4 pt-8 pb-8 max-w-md mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Shield className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {passed ? "You Are Ready ✨" : "Keep Going, You Are Growing"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {passed
              ? "Your preparation is showing. You have built something real."
              : "Every question you studied brought you closer. This is not the end, it is information."}
          </p>
        </motion.div>

        {/* Score */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex items-center gap-6">
            <PieChart width={90} height={90}>
              <Pie data={pieData} innerRadius={28} outerRadius={40} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
            </PieChart>
            <div>
              <p className="font-display text-3xl font-bold text-foreground">{percent}%</p>
              <p className="text-xs text-muted-foreground">{postResult.overall_score}/{postResult.total_questions} correct</p>
              {passed ? (
                <span className="text-xs font-medium" style={{ color: "hsl(145 50% 40%)" }}>Passing Score ✓</span>
              ) : (
                <span className="text-xs font-medium" style={{ color: "hsl(25 65% 50%)" }}>75% needed to pass</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Growth */}
        {growth !== null && (
          <Card className="border-0 shadow-md" style={{ background: growth > 0 ? "hsl(145 40% 96%)" : "hsl(42 50% 97%)" }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" style={{ color: growth > 0 ? "hsl(145 50% 40%)" : "hsl(42 50% 45%)" }} />
                <h3 className="font-display text-sm font-semibold text-foreground">Your Growth</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pre-test: {prePercent}% → Post-test: {percent}%.{" "}
                {growth > 0
                  ? `You grew ${growth} percentage points. That growth is real.`
                  : "Keep studying. Every review session builds your foundation."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comparison Chart */}
        {barData.length > 0 && preResult && (
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-3">Pre-Test vs Post-Test</h3>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="pre" fill={BAR_COLORS.pre} name="Pre-Test" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="post" fill={BAR_COLORS.post} name="Post-Test" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ background: BAR_COLORS.pre }} />
                    <span className="text-xs text-muted-foreground">Pre-Test</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm" style={{ background: BAR_COLORS.post }} />
                    <span className="text-xs text-muted-foreground">Post-Test</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Button
          onClick={() => navigate("/")}
          className="w-full py-6 text-base"
          style={{ background: "hsl(346 45% 56%)", color: "white" }}
        >
          Return to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <AppFooter />
    </div>
  );
};

export default PosttestResultsPage;
