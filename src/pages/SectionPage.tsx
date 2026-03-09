import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain, CheckCircle2, Target } from "lucide-react";
import { pageColors, blockAccentColors } from "@/lib/colors";
import AIMentorChat from "@/components/AIMentorChat";

const c = pageColors.section;

interface Section { id: string; name: string; description: string; }
interface BlockInfo { block_number: number; term_count: number; completed: boolean; bestScore: number | null; bestTotal: number | null; }

const SectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [section, setSection] = useState<Section | null>(null);
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [sectionRes, termsRes, resultsRes] = await Promise.all([
        supabase.from("sections").select("*").eq("id", id).single(),
        supabase.from("terms").select("block_number").eq("section_id", id),
        user
          ? supabase.from("quiz_results").select("block_number, score, total_questions").eq("section_id", id).eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);
      if (sectionRes.data) setSection(sectionRes.data);
      if (termsRes.data) {
        const blockMap = new Map<number, number>();
        termsRes.data.forEach((t) => blockMap.set(t.block_number, (blockMap.get(t.block_number) || 0) + 1));

        const resultsByBlock = new Map<number, { score: number; total: number }>();
        if (resultsRes.data) {
          (resultsRes.data as any[]).forEach((r) => {
            const existing = resultsByBlock.get(r.block_number);
            if (!existing || r.score > existing.score) resultsByBlock.set(r.block_number, { score: r.score, total: r.total_questions });
          });
        }

        setBlocks(
          Array.from(blockMap.entries())
            .map(([block_number, term_count]) => {
              const result = resultsByBlock.get(block_number);
              return { block_number, term_count, completed: !!result, bestScore: result?.score ?? null, bestTotal: result?.total ?? null };
            })
            .sort((a, b) => a.block_number - b.block_number)
        );
      }
    };
    fetchData();
  }, [id, user]);

  if (!section) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const completedCount = blocks.filter((b) => b.completed).length;

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>{section.name}</h1>
          <p className="text-base mb-4 leading-relaxed" style={{ color: c.subtext }}>{section.description}</p>

          <Card className="border-0 shadow-sm mb-6" style={{ background: c.tipBg }}>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed" style={{ color: c.tipText }}>
                ✨ Take your time with each block. Understanding is more important than speed. You are building something that will last, and every term you learn is a step closer to the professional you are becoming.
              </p>
            </CardContent>
          </Card>

          {blocks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: c.progress }}>
                  Progress: {completedCount} of {blocks.length} blocks completed
                </span>
                <span className="text-sm" style={{ color: c.subtext }}>
                  {Math.round((completedCount / blocks.length) * 100)}%
                </span>
              </div>
              <Progress value={(completedCount / blocks.length) * 100} className="h-2" />
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          {blocks.map((block, i) => {
            const accent = blockAccentColors[i % blockAccentColors.length];
            return (
              <motion.div key={block.block_number} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
                  <div className="flex">
                    <div className="w-1.5 flex-shrink-0" style={{ background: accent.stripe }} />
                    <CardContent className="p-5 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold" style={{ color: c.cardHeading }}>Block {block.block_number}</h3>
                          {block.completed && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 50% 40%)" }} />}
                        </div>
                        <div className="text-right">
                          <span className="text-sm" style={{ color: c.cardText }}>{block.term_count} terms</span>
                          {block.bestScore !== null && block.bestTotal !== null && (
                            <p className="text-xs" style={{ color: "hsl(145 40% 40%)" }}>Best: {block.bestScore}/{block.bestTotal}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button className="flex-1 gap-2 py-5 text-sm" style={{ background: accent.stripe, color: "white" }} onClick={() => navigate(`/section/${id}/study/${block.block_number}`)}>
                          <BookOpen className="h-4 w-4" /> Study Block
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 py-5 text-sm" style={{ borderColor: accent.stripe, color: accent.stripe }} onClick={() => navigate(`/section/${id}/quiz/${block.block_number}`)}>
                          <Brain className="h-4 w-4" /> Quiz Block
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Final Exam entry */}
        {blocks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + blocks.length * 0.08 }}>
            <Card
              className="border-2 cursor-pointer hover:shadow-lg transition-all mt-4 mb-6"
              style={{ background: "hsl(42 50% 97%)", borderColor: "hsl(42 40% 75%)" }}
              onClick={() => navigate(`/section/${id}/final-exam`)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full" style={{ background: "hsl(42 40% 90%)" }}>
                  <Target className="h-6 w-6" style={{ color: "hsl(42 50% 40%)" }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(42 35% 25%)" }}>
                    {section.name} Final Check
                  </h3>
                  <p className="text-sm" style={{ color: "hsl(42 20% 45%)" }}>
                    Test yourself on all {blocks.length} blocks at once with a full-length quiz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <AIMentorChat sectionName={section.name} sectionId={id!} />
    </div>
  );
};

export default SectionPage;
