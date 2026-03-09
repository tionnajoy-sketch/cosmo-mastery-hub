import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BookOpen, LogOut, ArrowRight } from "lucide-react";
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

const Home = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, SectionProgress>>(new Map());

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
      const { data: terms } = await supabase.from("terms").select("section_id, block_number");
      const { data: results } = await supabase.from("quiz_results").select("section_id, block_number").eq("user_id", user.id);

      const map = new Map<string, SectionProgress>();
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
          });
        }

        blocksBySection.forEach((blocks, sectionId) => {
          const completed = completedBySection.get(sectionId)?.size ?? 0;
          map.set(sectionId, { totalBlocks: blocks.size, completedBlocks: completed });
        });
      }
      setProgressMap(map);
    };
    fetchProgress();
  }, [user, sections]);

  const firstName = profile?.name?.split(" ")[0] || "Beautiful";

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
          <p className="text-base leading-relaxed" style={{ color: c.subtext }}>
            Let's get you ready to pass your boards. Pick a section to start studying.
          </p>
        </motion.div>
      </div>

      <div className="px-4 pb-20 max-w-2xl mx-auto space-y-4">
        {sections.map((section, i) => {
          const progress = progressMap.get(section.id);
          const accent = sectionAccentColors[i % sectionAccentColors.length];
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
                  {/* Color accent stripe */}
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
                            </div>
                            <Progress value={(progress.completedBlocks / progress.totalBlocks) * 100} className="h-1.5" />
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
    </div>
  );
};

export default Home;
