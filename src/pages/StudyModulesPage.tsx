import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Lock, Bell, Sparkles } from "lucide-react";
import { sectionAccentColors } from "@/lib/colors";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { toast } from "@/hooks/use-toast";

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  color_theme: string;
}

const comingSoon = [
  { name: "Product Knowledge", color: "hsl(25 70% 55%)" },
  { name: "Chemical Services", color: "hsl(200 65% 48%)" },
  { name: "Haircutting & Styling", color: "hsl(48 75% 50%)" },
  { name: "Business & Professionalism", color: "hsl(270 50% 52%)" },
];

const StudyModulesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, { total: number; completed: number }>>(new Map());

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
        supabase.from("quiz_results").select("section_id, block_number").eq("user_id", user.id),
      ]);
      const map = new Map<string, { total: number; completed: number }>();
      if (termsRes.data) {
        const blocksBySection = new Map<string, Set<number>>();
        termsRes.data.forEach((t) => {
          if (!blocksBySection.has(t.section_id)) blocksBySection.set(t.section_id, new Set());
          blocksBySection.get(t.section_id)!.add(t.block_number);
        });
        const completedBySection = new Map<string, Set<number>>();
        if (resultsRes.data) {
          resultsRes.data.forEach((r) => {
            if (!completedBySection.has(r.section_id)) completedBySection.set(r.section_id, new Set());
            completedBySection.get(r.section_id)!.add(r.block_number);
          });
        }
        blocksBySection.forEach((blocks, sectionId) => {
          map.set(sectionId, { total: blocks.size, completed: completedBySection.get(sectionId)?.size ?? 0 });
        });
      }
      setProgressMap(map);
    };
    fetchProgress();
  }, [user, sections]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">Study Modules</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You're in a safe place to learn, not to be perfect. Choose a section and take your time.
          </p>
        </motion.div>

        {/* Available Now */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Available Now
          </h2>
          {sections.map((section, i) => {
            const accent = sectionAccentColors[i % sectionAccentColors.length];
            const prog = progressMap.get(section.id);
            const pct = prog && prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
            return (
              <motion.div key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card
                  className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow overflow-hidden bg-card"
                  onClick={() => navigate(`/section/${section.id}`)}
                >
                  <div className="flex">
                    <div className="w-2 flex-shrink-0" style={{ background: accent.bg }} />
                    <CardContent className="p-5 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-semibold mb-1" style={{ color: accent.text }}>{section.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                          {prog && prog.total > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">{prog.completed}/{prog.total} blocks</span>
                                <span className="text-xs font-medium" style={{ color: accent.bg }}>{pct}%</span>
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
        </section>

        {/* Coming Soon */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" /> Coming Soon
          </h2>
          {comingSoon.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
              <Card className="border-0 shadow-sm bg-muted/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <Lock className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-semibold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">This section is being developed.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast({ title: "We'll let you know! 🔔", description: `You'll be notified when ${item.name} is available.` });
                    }}
                  >
                    <Bell className="h-3.5 w-3.5" /> Notify me
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Uploaded Modules shortcut */}
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" style={{ background: "hsl(270 20% 96%)" }} onClick={() => navigate("/my-modules")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: "hsl(270 25% 90%)" }}>
              <Sparkles className="h-5 w-5" style={{ color: "hsl(270 40% 52%)" }} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold" style={{ color: "hsl(270 30% 25%)" }}>My TJ Study Modules</h3>
              <p className="text-xs" style={{ color: "hsl(270 15% 50%)" }}>View your uploaded and converted study blocks</p>
            </div>
            <ArrowRight className="h-4 w-4" style={{ color: "hsl(270 25% 55%)" }} />
          </CardContent>
        </Card>
      </div>
      <AppFooter />
    </div>
  );
};

export default StudyModulesPage;
