import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeft, Gamepad2, Brain, GraduationCap, Target,
  Shuffle, BookOpen, PenLine, Puzzle, Timer, Zap, ChevronRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";

interface Section {
  id: string;
  name: string;
  order: number;
}

const activityTypes = [
  { icon: Shuffle, label: "Matching Game", desc: "Pair terms with definitions", color: "hsl(346 55% 50%)" },
  { icon: BookOpen, label: "Flashcards", desc: "Review terms front and back", color: "hsl(215 70% 48%)" },
  { icon: PenLine, label: "Fill in the Blank", desc: "Type the missing term", color: "hsl(145 55% 38%)" },
  { icon: Puzzle, label: "Word Scramble", desc: "Unscramble term letters", color: "hsl(265 60% 52%)" },
  { icon: Timer, label: "Timed Quiz", desc: "Beat the clock", color: "hsl(25 65% 50%)" },
  { icon: Zap, label: "Drill Mode", desc: "Rapid-fire practice", color: "hsl(185 50% 42%)" },
];

const PracticeLabPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [blocksBySection, setBlocksBySection] = useState<Map<string, number[]>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      const [sectionsRes, termsRes] = await Promise.all([
        supabase.from("sections").select("id, name, order").order("order"),
        supabase.from("terms").select("section_id, block_number"),
      ]);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (termsRes.data) {
        const map = new Map<string, Set<number>>();
        termsRes.data.forEach(t => {
          if (!map.has(t.section_id)) map.set(t.section_id, new Set());
          map.get(t.section_id)!.add(t.block_number);
        });
        const result = new Map<string, number[]>();
        map.forEach((blocks, sid) => result.set(sid, Array.from(blocks).sort((a, b) => a - b)));
        setBlocksBySection(result);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Gamepad2 className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Practice Lab</h1>
            <p className="text-sm text-muted-foreground">Reinforce your learning with interactive activities and quizzes.</p>
          </div>

          {/* Activity Types Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {activityTypes.map((act, i) => (
              <motion.div key={act.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center">
                    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${act.color}15` }}>
                      <act.icon className="h-5 w-5" style={{ color: act.color }} />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{act.label}</p>
                    <p className="text-[10px] text-muted-foreground">{act.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Sections with Activities & Quizzes */}
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Choose a Section</h2>
          <div className="space-y-4">
            {sections.map((section, i) => {
              const blocks = blocksBySection.get(section.id) || [];
              return (
                <motion.div key={section.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                  <Card className="border-0 shadow-sm bg-card">
                    <CardContent className="p-4">
                      <h3 className="font-display text-base font-semibold text-foreground mb-3">{section.name}</h3>
                      <div className="space-y-2">
                        {blocks.map(bn => (
                          <div key={bn} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground min-w-[60px]">Block {bn}</span>
                            <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"
                              onClick={() => navigate(`/section/${section.id}/activity/${bn}`)}>
                              <Gamepad2 className="h-3 w-3" /> Activities
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"
                              onClick={() => navigate(`/section/${section.id}/quiz/${bn}`)}>
                              <Brain className="h-3 w-3" /> Quiz
                            </Button>
                          </div>
                        ))}
                        <Button size="sm" className="w-full mt-2 gap-1 text-xs" variant="secondary"
                          onClick={() => navigate(`/section/${section.id}/final-exam`)}>
                          <GraduationCap className="h-3.5 w-3.5" /> Section Final Exam
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Test Strategy */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
            <Card className="border-0 shadow-sm bg-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/strategy")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Test Taking Strategy</p>
                  <p className="text-xs text-muted-foreground">Learn the TJ Anderson 4-step method</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PracticeLabPage;
