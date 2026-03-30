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
  CheckCircle2, Flame, Heart, Shield,
  Brain, Sparkles, Eye, Upload, Gamepad2,
  Pen, MessageSquare, GraduationCap, RefreshCw,
  Lightbulb, PenLine, Wrench, HelpCircle, Mic, Fingerprint,
} from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { pageColors } from "@/lib/colors";
import PopUpReview from "@/components/PopUpReview";
import RandomQuizPopup from "@/components/RandomQuizPopup";
import DailyPopQuestion from "@/components/DailyPopQuestion";
import StudentContract from "@/components/StudentContract";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { openTJChat } from "@/components/AskTJFullScreen";
import AppTutorialVideo from "@/components/AppTutorialVideo";

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
  { icon: Eye,         label: "Visualize",      desc: "See the concept before defining it.",                     color: "hsl(215 80% 42%)", neuro: "Visual cortex & pattern recognition" },
  { icon: BookOpen,    label: "Define",          desc: "Understand the concept in clear language.",               color: "hsl(45 90% 40%)",  neuro: "Language processing & labeling" },
  { icon: Mic,         label: "Break It Down",   desc: "Decode word roots and origins.",                         color: "hsl(30 85% 45%)",  neuro: "Analytical processing & decoding" },
  { icon: Fingerprint, label: "Recognize",       desc: "Identify the concept visually.",                         color: "hsl(275 70% 50%)", neuro: "Spatial memory & recall" },
  { icon: Lightbulb,   label: "Metaphor",        desc: "Connect the concept to real life.",                      color: "hsl(265 72% 48%)", neuro: "Limbic system & emotional association" },
  { icon: Heart,       label: "Information",     desc: "Expand understanding with deeper context.",              color: "hsl(180 60% 32%)", neuro: "Comprehension & deeper reasoning" },
  { icon: PenLine,     label: "Reflect",         desc: "Process the idea in your own words.",                    color: "hsl(220 20% 35%)", neuro: "Metacognition & self-awareness" },
  { icon: Wrench,      label: "Apply",           desc: "Use knowledge in real scenarios.",                       color: "hsl(145 65% 32%)", neuro: "Active recall & problem-solving" },
  { icon: HelpCircle,  label: "Assess",          desc: "Practice state board style questions.",                  color: "hsl(0 75% 45%)",   neuro: "Performance & test readiness" },
];

const howToSteps = [
  "Choose a Study Module",
  "Work Through Each Block's 9 Layers",
  "Follow the Guided Sequence",
  "Use Ask TJ Mentor for Help",
  "Practice Activities & Quizzes",
  "Track Your Progress",
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
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            {confidenceMessage}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button className="py-6 text-sm font-display font-semibold gap-2 shadow-lg" onClick={() => navigate("/learn")}>
              <BookOpen className="h-5 w-5" /> Start Learning
            </Button>
            <Button variant="secondary" className="py-6 text-sm font-display font-semibold gap-2 shadow-md" onClick={() => navigate("/practice-lab")}>
              <Gamepad2 className="h-5 w-5" /> Practice Lab
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <AppTutorialVideo variant="card" label="Watch Tutorial Video" />
            <button
              onClick={() => openTJChat(false)}
              className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40 hover:border-primary/30 transition-all group cursor-pointer"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground/80">Talk to TJ</span>
                <span className="text-[10px] text-muted-foreground">Ask anything</span>
              </div>
            </button>
          </div>
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
          <p className="text-sm text-muted-foreground mb-4">A neuroscience-based system — 9 layers that activate different parts of your brain.</p>
          <div className="space-y-2">
            {methodLayers.map((layer, i) => (
              <motion.div key={layer.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.03 }}>
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${layer.color}18` }}>
                      <layer.icon className="h-4 w-4" style={{ color: layer.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{i + 1}. {layer.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{layer.desc}</p>
                    </div>
                    <span className="text-[10px] italic flex-shrink-0 max-w-[120px] text-right" style={{ color: layer.color }}>
                      🧠 {layer.neuro}
                    </span>
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

      </div>

      <AppFooter />
      <PopUpReview />
      <RandomQuizPopup />
      <DailyPopQuestion />
    </div>
  );
};

export default Home;
