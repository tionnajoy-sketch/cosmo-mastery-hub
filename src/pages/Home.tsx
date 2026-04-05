import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  BookOpen, Target, TrendingUp,
  CheckCircle2, Flame, Gamepad2, Coffee, Brain,
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { pageColors } from "@/lib/colors";
import PopUpReview from "@/components/PopUpReview";
import RandomQuizPopup from "@/components/RandomQuizPopup";
import DailyPopQuestion from "@/components/DailyPopQuestion";
import StudentContract from "@/components/StudentContract";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { openTJCafe } from "@/hooks/useStudyBreak";
import { Eye, Mic, PenLine, BookOpen as BookOpenIcon2 } from "lucide-react";

const c = pageColors.home;

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  color_theme: string;
}

interface SectionProgress {
  totalBlocks: number;
  completedBlocks: number;
}

const getStatusLabel = (percent: number) => {
  if (percent === 0) return { label: "Just Starting", color: "hsl(200 50% 50%)" };
  if (percent < 40) return { label: "Building Foundation", color: "hsl(25 65% 50%)" };
  if (percent < 70) return { label: "Getting Stronger", color: "hsl(42 60% 48%)" };
  if (percent < 100) return { label: "Almost Ready", color: "hsl(145 50% 40%)" };
  return { label: "Mastered! ✨", color: "hsl(145 60% 35%)" };
};

const PIE_COLORS = ["hsl(346 45% 56%)", "hsl(30 20% 88%)"];

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { questionsToday, goalMet, currentStreak, longestStreak, dailyGoal, setDailyGoal, loading: trackerLoading } = useStudyTracker();
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, SectionProgress>>(new Map());
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  useEffect(() => {
    supabase.from("sections").select("*").order("order").then(({ data }) => {
      if (data) setSections(data);
    });
  }, []);

  useEffect(() => {
    if (!user || sections.length === 0) return;
    const fetchProgress = async () => {
      const [termsRes, resultsRes] = await Promise.all([
        supabase.from("terms").select("section_id, block_number"),
        supabase.from("quiz_results").select("section_id, block_number, score, total_questions").eq("user_id", user.id),
      ]);
      const terms = termsRes.data;
      const results = resultsRes.data;
      const map = new Map<string, SectionProgress>();
      let tq = 0, tc = 0;

      if (terms) {
        const blocksBySection = new Map<string, Set<number>>();
        terms.forEach((t) => {
          if (!blocksBySection.has(t.section_id)) blocksBySection.set(t.section_id, new Set());
          blocksBySection.get(t.section_id)!.add(t.block_number);
        });
        const completedBySection = new Map<string, Set<number>>();
        if (results) {
          results.forEach((r) => {
            if (!completedBySection.has(r.section_id)) completedBySection.set(r.section_id, new Set());
            completedBySection.get(r.section_id)!.add(r.block_number);
            tq += r.total_questions;
            tc += r.score;
          });
        }
        blocksBySection.forEach((blocks, sectionId) => {
          const completed = completedBySection.get(sectionId)?.size ?? 0;
          map.set(sectionId, { totalBlocks: blocks.size, completedBlocks: completed });
        });
      }

      setProgressMap(map);
      setTotalQuestions(tq);
      setTotalCorrect(tc);
    };
    fetchProgress();
  }, [user, sections]);

  // Cafe countdown
  const [cafeMinutesLeft, setCafeMinutesLeft] = useState<number | null>(null);
  useEffect(() => {
    const update = () => {
      const start = Number(sessionStorage.getItem("tj_study_start_time") || 0);
      if (!start) { setCafeMinutesLeft(null); return; }
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 60 - Math.floor(elapsed / 60000));
      setCafeMinutesLeft(remaining);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Student";

  // DNA-driven confidence message
  const dnaConfidence = profile?.dna_confidence;
  const confidenceMessage = (() => {
    if (!dnaConfidence) return "Every step you take builds something real. Let's keep going.";
    const code = dnaConfidence.charCodeAt(0);
    if (code <= 104) return "You're doing better than you think. Let's take it one step at a time — I'm right here with you.";
    if (code <= 113) return "You're building real knowledge. Trust the process — it's working.";
    return "You're showing real confidence. Let's push even further today.";
  })();
  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const status = getStatusLabel(overallPercent);
  const pieData = [
    { name: "Correct", value: totalCorrect || 0 },
    { name: "Remaining", value: Math.max((totalQuestions || 1) - (totalCorrect || 0), 0) },
  ];

  // Learning style info
  const learningStyle = profile?.learning_style || "visual";
  const styleInfo: Record<string, { label: string; icon: any; color: string; description: string; howWeUseIt: string }> = {
    visual: {
      label: "Visual Learner",
      icon: Eye,
      color: "hsl(215 80% 42%)",
      description: "You learn best by seeing — images, diagrams, and visual patterns help you understand and remember.",
      howWeUseIt: "We'll prioritize the Visualize and Metaphor layers, showing you concepts through images and visual connections before diving into definitions.",
    },
    reading: {
      label: "Reading/Writing Learner",
      icon: BookOpenIcon2,
      color: "hsl(45 90% 40%)",
      description: "You learn best through written words — reading definitions, writing reflections, and journaling deepen your understanding.",
      howWeUseIt: "We'll emphasize the Define, Reflect, and Journal layers, giving you structured text and space to process concepts in your own words.",
    },
    kinesthetic: {
      label: "Kinesthetic Learner",
      icon: PenLine,
      color: "hsl(145 65% 32%)",
      description: "You learn best by doing — hands-on activities, practice scenarios, and interactive exercises make concepts stick.",
      howWeUseIt: "We'll focus on the Apply and Practice layers, putting you in real scenarios and interactive activities as early as possible.",
    },
    auditory: {
      label: "Auditory Learner",
      icon: Mic,
      color: "hsl(275 70% 50%)",
      description: "You learn best by hearing — spoken explanations, voice guidance, and verbal repetition help you absorb information.",
      howWeUseIt: "We'll activate TJ's voice guidance on every step and emphasize the Metaphor and Affirmation layers with audio-first delivery.",
    },
  };
  const currentStyle = styleInfo[learningStyle] || styleInfo.visual;
  const StyleIcon = currentStyle.icon;

   return (
    <div className="min-h-screen flex flex-col" style={{ background: c.gradient }}>
      <AppHeader />

      {/* ── Hero Welcome ── */}
      <div className="px-4 pt-10 pb-4 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold mb-3 text-foreground">
            Welcome back, {firstName} ✨
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {confidenceMessage}
          </p>

          {/* TWO Primary Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button className="py-7 text-base font-display font-semibold gap-2 shadow-lg rounded-xl" onClick={() => navigate("/learn")}>
              <BookOpen className="h-5 w-5" /> Start Learning
            </Button>
            <Button variant="secondary" className="py-7 text-base font-display font-semibold gap-2 shadow-md rounded-xl" onClick={() => navigate("/practice-lab")}>
              <Gamepad2 className="h-5 w-5" /> Practice Lab
            </Button>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              className="w-full py-5 text-sm font-display font-semibold gap-2 rounded-xl shadow-md border-2 animate-pulse hover:animate-none"
              style={{ borderColor: "hsl(265 60% 50%)", color: "hsl(265 60% 50%)", background: "hsl(265 60% 98%)" }}
              onClick={() => navigate("/learning-dna")}
            >
              <Brain className="h-5 w-5" /> My TJ DNA Code
            </Button>
          </div>

          {/* Cafe countdown indicator */}
          {cafeMinutesLeft !== null && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={
                cafeMinutesLeft === 0
                  ? { opacity: 1, scale: [1, 1.03, 1] }
                  : cafeMinutesLeft !== null && cafeMinutesLeft <= 5
                    ? { opacity: 1, scale: [1, 1.02, 1] }
                    : { opacity: 1 }
              }
              transition={
                cafeMinutesLeft === 0
                  ? { opacity: { delay: 0.6 }, scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }
                  : cafeMinutesLeft !== null && cafeMinutesLeft <= 5
                    ? { opacity: { delay: 0.6 }, scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                    : { delay: 0.6 }
              }
              onClick={() => openTJCafe()}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl w-full transition-all hover:scale-[1.01]"
              style={{
                background: cafeMinutesLeft === 0
                  ? "linear-gradient(135deg, hsl(0 75% 50%), hsl(45 90% 55%))"
                  : cafeMinutesLeft !== null && cafeMinutesLeft <= 5
                    ? "hsl(42 40% 92%)"
                    : "hsl(30 15% 94%)",
                color: cafeMinutesLeft === 0 ? "white" : "hsl(30 10% 35%)",
              }}
            >
              <Coffee className={`h-4 w-4 flex-shrink-0 ${cafeMinutesLeft !== null && cafeMinutesLeft <= 5 ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium">
                {cafeMinutesLeft === 0
                  ? "☕ Your TJ Cafe break is ready — take a moment"
                  : `☕ TJ Cafe in ${cafeMinutesLeft} min`}
              </span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* ── Minimal Content ── */}
      <div className="flex-1 px-4 pb-6 max-w-2xl mx-auto w-full space-y-6">

        {/* ── Your Learning Style ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md bg-card overflow-hidden">
            <div className="flex">
              <div className="w-2 flex-shrink-0" style={{ background: currentStyle.color }} />
              <CardContent className="p-5 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${currentStyle.color}18` }}>
                    <StyleIcon className="h-5 w-5" style={{ color: currentStyle.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Learning Style</p>
                    <h3 className="font-display text-base font-semibold text-foreground">{currentStyle.label}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {currentStyle.description}
                </p>
                <div className="p-3 rounded-lg" style={{ background: `${currentStyle.color}08` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: currentStyle.color }}>
                    How we'll use this to teach you:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {currentStyle.howWeUseIt}
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.section>

        {/* ── Daily Goal + Streak ── */}
        {!trackerLoading && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-md" style={{ background: goalMet ? "hsl(145 40% 96%)" : "hsl(42 60% 96%)" }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {goalMet ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} />
                  ) : (
                    <Target className="h-5 w-5" style={{ color: "hsl(42 58% 48%)" }} />
                  )}
                  <h3 className="font-display text-sm font-semibold" style={{ color: goalMet ? "hsl(145 40% 22%)" : "hsl(42 35% 25%)" }}>
                    Today's Study Goal
                  </h3>
                </div>
                {goalMet ? (
                  <p className="text-sm" style={{ color: "hsl(145 30% 30%)" }}>Goal complete for today. Beautiful work. ✓</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs" style={{ color: "hsl(42 25% 35%)" }}>
                        Complete one activity or answer {dailyGoal} questions to meet today's goal.
                      </p>
                      <button onClick={() => setShowGoalPicker(!showGoalPicker)} className="text-xs font-medium underline ml-2 flex-shrink-0" style={{ color: "hsl(42 50% 45%)" }}>Edit</button>
                    </div>
                    {showGoalPicker && (
                      <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "hsl(42 40% 92%)" }}>
                        <span className="text-xs" style={{ color: "hsl(42 25% 35%)" }}>Daily question goal:</span>
                        {[5, 10, 15, 20, 25].map(g => (
                          <button key={g} onClick={() => { setDailyGoal(g); setShowGoalPicker(false); }}
                            className="px-2 py-1 rounded-full text-xs font-medium transition-all"
                            style={{ background: dailyGoal === g ? "hsl(42 55% 48%)" : "white", color: dailyGoal === g ? "white" : "hsl(42 30% 35%)" }}>{g}</button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((questionsToday / dailyGoal) * 100, 100)} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium" style={{ color: "hsl(42 35% 40%)" }}>{questionsToday}/{dailyGoal}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: goalMet ? "hsl(145 30% 85%)" : "hsl(42 30% 88%)" }}>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" style={{ color: currentStreak > 0 ? "hsl(25 70% 50%)" : "hsl(0 0% 65%)" }} />
                    <span className="text-xs text-muted-foreground">Streak: {currentStreak} day{currentStreak !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Best: {longestStreak} day{longestStreak !== 1 ? "s" : ""}</span>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ── Progress Summary (compact) ── */}
        {totalQuestions > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-md bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5" style={{ color: c.accent }} />
                  <h3 className="font-display text-sm font-semibold text-foreground">Your Progress</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <PieChart width={80} height={80}>
                      <Pie data={pieData} innerRadius={24} outerRadius={36} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-xl font-bold text-primary">{overallPercent}%</p>
                      <p className="text-[10px] text-muted-foreground">Correct</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-xl font-bold text-primary">{totalQuestions}</p>
                      <p className="text-[10px] text-muted-foreground">Questions</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
                      <p className="text-[10px] text-muted-foreground">Status</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ── Student Contract ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <StudentContract />
        </motion.section>
      </div>

      <AppFooter />
      <PopUpReview />
      <RandomQuizPopup />
      <DailyPopQuestion />
    </div>
  );
};

export default Home;
