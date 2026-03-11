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
  BookOpen, LogOut, ArrowRight, Target, TrendingUp,
  Info, CheckCircle2, Flame, BarChart3, Heart, Shield,
  Star, Brain, Sparkles, Eye, Award, Menu
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { pageColors, sectionAccentColors } from "@/lib/colors";
import PopUpReview from "@/components/PopUpReview";
import RandomQuizPopup from "@/components/RandomQuizPopup";
import DailyPopQuestion from "@/components/DailyPopQuestion";
import StudentContract from "@/components/StudentContract";
import AppFooter from "@/components/AppFooter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { icon: Shield, label: "Confidence to pass your state boards", color: "hsl(185 45% 42%)" },
  { icon: Brain, label: "Deep understanding of theory, not just memorization", color: "hsl(265 40% 55%)" },
  { icon: Target, label: "Test-taking strategies that actually work", color: "hsl(25 65% 50%)" },
  { icon: Heart, label: "Inner confidence that radiates outward", color: "hsl(346 45% 56%)" },
  { icon: Eye, label: "The feeling of being seen, supported, and understood", color: "hsl(145 40% 40%)" },
  { icon: Award, label: "Knowledge that stays with you for your entire career", color: "hsl(42 55% 48%)" },
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
  const { questionsToday, goalMet, currentStreak, longestStreak, loading: trackerLoading } = useStudyTracker();
  const [sections, setSections] = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, SectionProgress>>(new Map());
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase.from("sections").select("*").order("order");
      if (data) setSections(data);
    };
    fetchSections();
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

  const firstName = profile?.name?.split(" ")[0] || "Beautiful";
  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const status = getStatusLabel(overallPercent);

  const pieData = [
    { name: "Correct", value: totalCorrect || 0 },
    { name: "Remaining", value: Math.max((totalQuestions || 1) - (totalCorrect || 0), 0) },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.gradient }}>
      {/* ── Professional Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/30 backdrop-blur-md" style={{ background: "hsl(30 25% 97% / 0.9)" }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">CosmoPrep</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <BookOpen className="h-4 w-4 mr-2" /> Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/progress")}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/strategy")}>
                  <Target className="h-4 w-4 mr-2" /> Strategy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/terms")}>
                  <Shield className="h-4 w-4 mr-2" /> Terms of Use
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Hero Welcome ── */}
      <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold mb-2 text-foreground">
            Welcome back, {firstName} ✨
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            You are building something powerful. Every term you study, every question you answer, brings you closer to the professional you are becoming. We see you. We believe in you.
          </p>
        </motion.div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 px-4 pb-6 max-w-2xl mx-auto w-full space-y-8">

        {/* ── Student Contract ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <StudentContract />
        </motion.section>

        {/* ── What You'll Walk Away With ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            What You Will Walk Away With
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outcomes.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow" style={{ background: "hsl(30 30% 99%)" }}>
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

        {/* ── Daily Goal + Streak ── */}
        {!trackerLoading && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
                  <p className="text-sm" style={{ color: "hsl(145 30% 30%)" }}>
                    Goal complete for today. Beautiful work. ✓
                  </p>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ color: "hsl(42 25% 35%)" }}>
                      Complete one activity or answer 10 questions to meet today's goal.
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((questionsToday / 10) * 100, 100)} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium" style={{ color: "hsl(42 35% 40%)" }}>
                        {questionsToday}/10
                      </span>
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

        {/* ── Progress Dashboard with Pie Chart ── */}
        {totalQuestions > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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

        {/* ── Strategy Shortcut ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          <Card
            className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
            style={{ background: "hsl(185 30% 95%)" }}
            onClick={() => navigate("/strategy")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: "hsl(185 30% 88%)" }}>
                <Target className="h-5 w-5" style={{ color: "hsl(185 45% 35%)" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold" style={{ color: "hsl(185 35% 22%)" }}>
                  TJ Anderson Layer Method™
                </h3>
                <p className="text-xs" style={{ color: "hsl(185 20% 45%)" }}>
                  Learn the 5-layer framework for deep, lasting understanding
                </p>
              </div>
              <ArrowRight className="h-4 w-4" style={{ color: "hsl(185 35% 50%)" }} />
            </CardContent>
          </Card>
        </motion.section>

        {/* ── Study Sections ── */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Study Sections</h2>
          <div className="space-y-4">
            {sections.map((section, i) => {
              const progress = progressMap.get(section.id);
              const accent = sectionAccentColors[i % sectionAccentColors.length];
              const pct = progress && progress.totalBlocks > 0 ? Math.round((progress.completedBlocks / progress.totalBlocks) * 100) : 0;
              const sectionStatus = getStatusLabel(pct);
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                >
                  <Card
                    className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow overflow-hidden"
                    style={{ background: c.card }}
                    onClick={() => navigate(`/section/${section.id}`)}
                  >
                    <div className="flex">
                      <div className="w-2 flex-shrink-0" style={{ background: accent.bg }} />
                      <CardContent className="p-6 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-display text-xl font-semibold mb-1" style={{ color: accent.text }}>
                              {section.name}
                            </h3>
                            <p className="text-sm leading-relaxed mb-3 text-muted-foreground">
                              {section.description}
                            </p>
                            {progress && progress.totalBlocks > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">
                                    {progress.completedBlocks}/{progress.totalBlocks} blocks completed
                                  </span>
                                  <span className="text-xs font-medium" style={{ color: sectionStatus.color }}>
                                    {sectionStatus.label}
                                  </span>
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
            {sections.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Loading sections...</p>
            )}
          </div>
        </motion.section>

        {/* ── Coming Soon ── */}
        <Card className="border-2 border-dashed" style={{ borderColor: "hsl(42 40% 75%)", background: "hsl(42 50% 97%)" }}>
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 50% 45%)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "hsl(42 35% 28%)" }}>
                More sections coming soon
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "hsl(42 20% 45%)" }}>
                Hair, Nails, Safety &amp; Sanitation, and more. For now, master the foundation.
              </p>
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
