import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BookOpen, LogOut, ArrowRight, Target, Sparkles, TrendingUp, Info } from "lucide-react";
import { pageColors, sectionAccentColors } from "@/lib/colors";

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

const motivationalMessages = [
  "Remember: everyone learns differently. Take your time. 💛",
  "You are building something powerful — one concept at a time.",
  "Every question you practice gets you closer to passing. Keep going!",
  "Confidence comes from preparation, and you are preparing right now.",
  "You were made for this. Trust the process.",
];

const getStatusLabel = (percent: number) => {
  if (percent === 0) return { label: "Just Starting", color: "hsl(200 50% 50%)" };
  if (percent < 40) return { label: "Building Foundation", color: "hsl(25 65% 50%)" };
  if (percent < 70) return { label: "Getting Stronger", color: "hsl(42 60% 48%)" };
  if (percent < 100) return { label: "Almost Ready", color: "hsl(145 50% 40%)" };
  return { label: "Mastered! ✨", color: "hsl(145 60% 35%)" };
};

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, SectionProgress>>(new Map());
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [motivationalMessage] = useState(() => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);

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

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <header className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" style={{ color: c.icon }} />
          <span className="font-display text-lg font-bold" style={{ color: c.heading }}>CosmoPrep</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </header>

      <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>
            Welcome, {firstName} ✨
          </h1>
          <p className="text-base leading-relaxed mb-4" style={{ color: c.subtext }}>
            Let's get you ready to pass your boards. Pick a section to start studying.
          </p>

          {/* Motivational message */}
          <Card className="border-0 shadow-md mb-4" style={{ background: "hsl(42 60% 96%)" }}>
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 58% 48%)" }} />
              <p className="text-sm italic leading-relaxed" style={{ color: "hsl(42 30% 30%)" }}>
                {motivationalMessage}
              </p>
            </CardContent>
          </Card>

          {/* Progress Dashboard */}
          {totalQuestions > 0 && (
            <Card className="border-0 shadow-md mb-4" style={{ background: c.card }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5" style={{ color: c.accent }} />
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.cardHeading }}>Your Progress</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg" style={{ background: "hsl(18 40% 95%)" }}>
                    <p className="font-display text-2xl font-bold" style={{ color: c.accent }}>{overallPercent}%</p>
                    <p className="text-xs" style={{ color: c.subtext }}>Correct</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: "hsl(18 40% 95%)" }}>
                    <p className="font-display text-2xl font-bold" style={{ color: c.accent }}>{totalQuestions}</p>
                    <p className="text-xs" style={{ color: c.subtext }}>Questions</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: "hsl(18 40% 95%)" }}>
                    <p className="font-display text-sm font-bold" style={{ color: status.color }}>{status.label}</p>
                    <p className="text-xs" style={{ color: c.subtext }}>Status</p>
                  </div>
                </div>
                <Progress value={overallPercent} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Strategy shortcut */}
          <Card
            className="border-0 shadow-md mb-4 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ background: "hsl(185 30% 95%)" }}
            onClick={() => navigate("/strategy")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: "hsl(185 30% 88%)" }}>
                <Target className="h-5 w-5" style={{ color: "hsl(185 45% 35%)" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-semibold" style={{ color: "hsl(185 35% 22%)" }}>
                  TJ Anderson Layer Method
                </h3>
                <p className="text-xs" style={{ color: "hsl(185 20% 45%)" }}>
                  Learn the 4-step strategy for answering state board questions
                </p>
              </div>
              <ArrowRight className="h-4 w-4" style={{ color: "hsl(185 35% 50%)" }} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="px-4 pb-6 max-w-2xl mx-auto">
        <h2 className="font-display text-lg font-semibold mb-3" style={{ color: c.cardHeading }}>Study Sections</h2>
      </div>

      <div className="px-4 pb-4 max-w-2xl mx-auto space-y-4">
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
              transition={{ delay: 0.1 + i * 0.1 }}
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
                        <p className="text-sm leading-relaxed mb-3" style={{ color: c.cardText }}>
                          {section.description}
                        </p>
                        {progress && progress.totalBlocks > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs" style={{ color: c.subtext }}>
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

      {/* Coming soon banner */}
      <div className="px-4 pb-20 max-w-2xl mx-auto">
        <Card className="border-2 border-dashed" style={{ borderColor: "hsl(42 40% 75%)", background: "hsl(42 50% 97%)" }}>
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(42 50% 45%)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "hsl(42 35% 28%)" }}>
                More sections coming soon
              </p>
              <p className="text-xs leading-relaxed mt-1" style={{ color: "hsl(42 20% 45%)" }}>
                Hair, Nails, Safety &amp; Sanitation, and more. For now, we're starting with Skin so you can master the foundation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
