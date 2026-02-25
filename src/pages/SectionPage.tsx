import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain, CheckCircle2 } from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string;
}

interface BlockInfo {
  block_number: number;
  term_count: number;
  completed: boolean;
  bestScore: number | null;
  bestTotal: number | null;
}

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
        termsRes.data.forEach((t) => {
          blockMap.set(t.block_number, (blockMap.get(t.block_number) || 0) + 1);
        });

        const resultsByBlock = new Map<number, { score: number; total: number }>();
        if (resultsRes.data) {
          (resultsRes.data as any[]).forEach((r) => {
            const existing = resultsByBlock.get(r.block_number);
            if (!existing || r.score > existing.score) {
              resultsByBlock.set(r.block_number, { score: r.score, total: r.total_questions });
            }
          });
        }

        setBlocks(
          Array.from(blockMap.entries())
            .map(([block_number, term_count]) => {
              const result = resultsByBlock.get(block_number);
              return {
                block_number,
                term_count,
                completed: !!result,
                bestScore: result?.score ?? null,
                bestTotal: result?.total ?? null,
              };
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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(12 65% 92%), hsl(15 40% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(12 50% 25%)" }}>
            {section.name}
          </h1>
          <p className="text-base mb-4 leading-relaxed" style={{ color: "hsl(12 20% 40%)" }}>
            {section.description}
          </p>

          {/* Supportive message */}
          <Card className="border-0 shadow-sm mb-6" style={{ background: "hsl(42 60% 96%)" }}>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed" style={{ color: "hsl(42 30% 30%)" }}>
                ✨ Take your time with each block. Understanding is more important than speed. You are building something that will last, and every term you learn is a step closer to the professional you are becoming.
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          {blocks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: "hsl(12 30% 35%)" }}>
                  Progress: {completedCount} of {blocks.length} blocks completed
                </span>
                <span className="text-sm" style={{ color: "hsl(12 20% 50%)" }}>
                  {Math.round((completedCount / blocks.length) * 100)}%
                </span>
              </div>
              <Progress value={(completedCount / blocks.length) * 100} className="h-2" />
            </div>
          )}
        </motion.div>

        <div className="space-y-4">
          {blocks.map((block, i) => (
            <motion.div
              key={block.block_number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <Card className="border-0 shadow-md" style={{ background: "white" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold" style={{ color: "hsl(12 50% 25%)" }}>
                        Block {block.block_number}
                      </h3>
                      {block.completed && (
                        <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 50% 40%)" }} />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm" style={{ color: "hsl(12 20% 50%)" }}>
                        {block.term_count} terms
                      </span>
                      {block.bestScore !== null && block.bestTotal !== null && (
                        <p className="text-xs" style={{ color: "hsl(145 40% 40%)" }}>
                          Best: {block.bestScore}/{block.bestTotal}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2 py-5 text-sm"
                      style={{ background: "hsl(12 55% 50%)", color: "white" }}
                      onClick={() => navigate(`/section/${id}/study/${block.block_number}`)}
                    >
                      <BookOpen className="h-4 w-4" /> Study Block
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 py-5 text-sm"
                      style={{ borderColor: "hsl(12 55% 50%)", color: "hsl(12 55% 40%)" }}
                      onClick={() => navigate(`/section/${id}/quiz/${block.block_number}`)}
                    >
                      <Brain className="h-4 w-4" /> Quiz Block
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionPage;
