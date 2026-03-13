import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  BookOpen, ArrowRight, Target, TrendingUp,
  Info, CheckCircle2, Flame, BarChart3, Heart, Shield,
  Star, Brain, Sparkles, Eye, Award, Upload,
  Pen, MessageSquare, GraduationCap,
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { pageColors, sectionAccentColors } from "@/lib/colors";
import PopUpReview from "@/components/PopUpReview";
import RandomQuizPopup from "@/components/RandomQuizPopup";
import DailyPopQuestion from "@/components/DailyPopQuestion";
import StudentContract from "@/components/StudentContract";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

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

const outcomes = [
  { icon: Shield, label: "Confidence to pass your state board exam", color: "hsl(185 45% 42%)" },
  { icon: Brain, label: "Deep understanding of cosmetology theory", color: "hsl(265 40% 55%)" },
  { icon: Target, label: "Test taking strategies that work", color: "hsl(25 65% 50%)" },
  { icon: Heart, label: "Knowledge that stays with you throughout your career", color: "hsl(346 45% 56%)" },
];

const methodLayers = [
  { icon: BookOpen, label: "Definition", desc: "Understand the concept in clear language.", color: "hsl(200 55% 48%)" },
  { icon: Eye, label: "Visualize", desc: "See the structure or process in a simple image.", color: "hsl(270 45% 55%)" },
  { icon: Sparkles, label: "Metaphor", desc: "Connect the concept to something familiar.", color: "hsl(25 65% 52%)" },
  { icon: Heart, label: "Affirmation", desc: "Train your brain to believe you can master it.", color: "hsl(346 45% 56%)" },
  { icon: MessageSquare, label: "Reflection", desc: "Process the idea in your own words.", color: "hsl(145 45% 40%)" },
  { icon: Pen, label: "Journal", desc: "Strengthen memory through writing.", color: "hsl(195 50% 42%)" },
  { icon: GraduationCap, label: "Quiz", desc: "Practice state board style questions.", color: "hsl(42 55% 48%)" },
];

const howToSteps = [
  "Start a Study Block",
  "Review the Definition and Visualization",
  "Connect the Metaphor",
  "Repeat the Affirmation",
  "Write your Reflection",
  "Take the Quiz",
];

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
  const [uploadedModules, setUploadedModules] = useState<{id: string; title: string; status: string; created_at: string}[]>([]);

  useEffect(() => {
    supabase.from("sections").select("*").order("order").then(({ data }) => {
      if (data) setSections(data);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("uploaded_modules").select("id, title, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3).then(({ data }) => {
      if (data) setUploadedModules(data);
    });
  }, [user]);

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

  const firstName = profile?.name?.split(" ")[0] || "Beautiful";
  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const status = getStatusLabel(overallPercent);
  const pieData = [
    { name: "Correct", value: totalCorrect || 0 },
    { name: "Remaining", value: Math.max((totalQuestions || 1) - (totalCorrect || 0), 0) },
  ];

  // Learning style tip
  const learningStyle = profile?.learning_style || "visual";
  const styleTips: Record<string, string> = {
    visual: "Based on your learning style, you may benefit most from the Visualize and Metaphor sections inside each study block.",
    reading: "Based on your learning style, you may benefit most from the Definition, Reflection, and Journal sections inside each study block.",
    kinesthetic: "Based on your learning style, you may benefit most from the Practice activities and Quiz sections inside each study block.",
    auditory: "Based on your learning style, you may benefit most from the Metaphor and Affirmation sections inside each study block.",
  };
  const styleTip = styleTips[learningStyle] || styleTips.visual;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.gradient }}>
      <AppHeader />

      {/* ── Hero Welcome ── */}
      <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold mb-2 text-foreground">
            Welcome back, {firstName} ✨
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            You are building something powerful. Every concept you study brings you closer to the professional you are becoming.
          </p>
        </motion.div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 px-4 pb-6 max-w-2xl mx-auto w-full space-y-8">

        {/* ── Learning Style Tip ── */}
        {profile?.has_completed_pretest && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-sm" style={{ background: "hsl(270 20% 96%)" }}>
              <CardContent className="p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(270 40% 52%)" }} />
                <p className="text-sm leading-relaxed" style={{ color: "hsl(270 25% 30%)" }}>
                  {styleTip}
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ── Student Contract ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <StudentContract />
        </motion.section>

        {/* ── Daily Goal + Streak ── */}
        {!trackerLoading && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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

        {/* ── What You Will Walk Away With ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">What You Will Walk Away With</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outcomes.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-card">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${item.color}15` }}>
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <p className="text-sm text-foreground/80 leading-snug">{item.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── The TJ Anderson Layer Method™ ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-2">The TJ Anderson Layer Method™</h2>
          <p className="text-sm text-muted-foreground mb-4">Each concept is studied through multiple layers so the information stays in your memory.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {methodLayers.map((layer, i) => (
              <motion.div key={layer.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                <Card className="border-0 shadow-sm h-full bg-card">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${layer.color}15` }}>
                      <layer.icon className="h-5 w-5" style={{ color: layer.color }} />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">{layer.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{layer.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── How to Use the App ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">How to Use the App</h2>
          <div className="space-y-3">
            {howToSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-primary-foreground">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground/80">{step}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Progress Dashboard ── */}
        {totalQuestions > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            <Card className="border-0 shadow-md" style={{ background: c.card }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5" style={{ color: c.accent }} />
                  <h3 className="font-display text-lg font-semibold text-foreground">Your Progress</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <PieChart width={90} height={90}>
                      <Pie data={pieData} innerRadius={28} outerRadius={40} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-2xl font-bold text-primary">{overallPercent}%</p>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-2xl font-bold text-primary">{totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="font-display text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
                      <p className="text-xs text-muted-foreground">Status</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ── Continue Studying ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Button
            className="w-full py-6 text-base font-display font-semibold gap-2 shadow-lg"
            onClick={() => document.getElementById("study-sections")?.scrollIntoView({ behavior: "smooth" })}
          >
            <BookOpen className="h-5 w-5" /> Continue Learning
          </Button>
        </motion.section>

        {/* ── Study Sections ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <h2 id="study-sections" className="font-display text-lg font-semibold text-foreground mb-4">Study Modules</h2>
          <div className="space-y-4">
            {sections.map((section, i) => {
              const progress = progressMap.get(section.id);
              const accent = sectionAccentColors[i % sectionAccentColors.length];
              const pct = progress && progress.totalBlocks > 0 ? Math.round((progress.completedBlocks / progress.totalBlocks) * 100) : 0;
              const sectionStatus = getStatusLabel(pct);
              return (
                <motion.div key={section.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.08 }}>
                  <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow overflow-hidden bg-card" onClick={() => navigate(`/section/${section.id}`)}>
                    <div className="flex">
                      <div className="w-2 flex-shrink-0" style={{ background: accent.bg }} />
                      <CardContent className="p-6 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-display text-xl font-semibold mb-1" style={{ color: accent.text }}>{section.name}</h3>
                            <p className="text-sm leading-relaxed mb-3 text-muted-foreground">{section.description}</p>
                            {progress && progress.totalBlocks > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">{progress.completedBlocks}/{progress.totalBlocks} blocks completed</span>
                                  <span className="text-xs font-medium" style={{ color: sectionStatus.color }}>{sectionStatus.label}</span>
                                </div>
                                <Progress value={pct} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 ml-4 flex-shrink-0" style={{ color: accent.bg }} />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            {sections.length === 0 && <p className="text-center text-muted-foreground py-12">Loading sections...</p>}
          </div>
        </motion.section>

        {/* ── My TJ Study Modules ── */}
        {uploadedModules.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-semibold text-foreground">My TJ Study Modules</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-modules")} className="text-xs">View All</Button>
            </div>
            <div className="space-y-2">
              {uploadedModules.map((mod) => (
                <Card key={mod.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => mod.status === "ready" ? navigate(`/module/${mod.id}`) : null}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "hsl(270 25% 94%)" }}>
                      <Sparkles className="h-4 w-4" style={{ color: "hsl(270 40% 52%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(mod.created_at).toLocaleDateString()}</p>
                    </div>
                    {mod.status === "ready" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Upload Shortcut ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" style={{ background: "hsl(270 20% 96%)" }} onClick={() => navigate("/upload")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: "hsl(270 25% 90%)" }}>
                <Upload className="h-5 w-5" style={{ color: "hsl(270 40% 52%)" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold" style={{ color: "hsl(270 30% 25%)" }}>Upload to TJ Blocks</h3>
                <p className="text-xs" style={{ color: "hsl(270 15% 50%)" }}>Convert your notes and slides into structured learning blocks</p>
              </div>
              <ArrowRight className="h-4 w-4" style={{ color: "hsl(270 25% 55%)" }} />
            </CardContent>
          </Card>
        </motion.section>

        {/* ── Coming Soon ── */}
        <Card className="border-2 border-dashed" style={{ borderColor: "hsl(42 40% 75%)", background: "hsl(42 50% 97%)" }}>
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 50% 45%)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "hsl(42 35% 28%)" }}>More sections coming soon</p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "hsl(42 20% 45%)" }}>Hair, Nails, Safety &amp; Sanitation, and more. For now, master the foundation.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AppFooter />
      <PopUpReview />
      <RandomQuizPopup />
      <DailyPopQuestion />
    </div>
  );
};

export default Home;
