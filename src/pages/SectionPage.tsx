import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Brain, CheckCircle2, Target, GraduationCap, Circle } from "lucide-react";
import { pageColors, blockAccentColors } from "@/lib/colors";
import AIMentorChat from "@/components/AIMentorChat";
import { sectionObjectivesMap, blockObjectivesMap } from "@/lib/sectionObjectives";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
  const totalBlocks = blocks.length;
  const totalTerms = blocks.reduce((sum, b) => sum + b.term_count, 0);

  const pieData = [
    { name: "Completed", value: completedCount },
    { name: "Remaining", value: Math.max(totalBlocks - completedCount, 0) },
  ];
  const PIE_COLORS = ["hsl(145 50% 42%)", "hsl(5 25% 88%)"];

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Button>

        {/* ───── HEADER ───── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>{section.name}</h1>
          <p className="text-base mb-6 leading-relaxed" style={{ color: c.subtext }}>{section.description}</p>
        </motion.div>

        {/* ───── PROGRESS PIE + STATS ───── */}
        {totalBlocks > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-0 shadow-sm mb-8" style={{ background: "hsl(0 0% 100%)" }}>
              <CardContent className="p-5">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: c.subtext }}>
                  Your Progress
                </h2>
                <div className="flex items-center gap-6">
                  {/* Pie Chart */}
                  <div className="w-24 h-24 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={42}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          strokeWidth={0}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Stats Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-display text-2xl font-bold" style={{ color: c.heading }}>{completedCount}</p>
                      <p className="text-xs" style={{ color: c.subtext }}>Blocks Done</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold" style={{ color: c.heading }}>{totalBlocks}</p>
                      <p className="text-xs" style={{ color: c.subtext }}>Total Blocks</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold" style={{ color: c.heading }}>{totalTerms}</p>
                      <p className="text-xs" style={{ color: c.subtext }}>Total Terms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ───── LEARNING OBJECTIVES ───── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm mb-8" style={{ background: "hsl(195 30% 96%)" }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5" style={{ color: "hsl(195 45% 38%)" }} />
                <span className="font-display text-sm font-semibold" style={{ color: "hsl(195 35% 25%)" }}>Learning Objectives</span>
              </div>
              <ul className="space-y-2">
                {(sectionObjectivesMap[id!] || []).map((obj, i) => (
                  <li key={i} className="text-sm leading-relaxed flex items-start gap-2.5" style={{ color: "hsl(195 18% 32%)" }}>
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(195 45% 55%)" }} />
                    {obj}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* ───── TJ METHOD FLOW ───── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm mb-8" style={{ background: c.tipBg }}>
            <CardContent className="p-5">
              <p className="font-display text-sm font-semibold mb-3" style={{ color: c.tipText }}>
                The TJ Anderson Layer Method™
              </p>
              <div className="flex items-center justify-between gap-1">
                {[
                  { label: "Definition", emoji: "📖" },
                  { label: "Metaphor", emoji: "🌉" },
                  { label: "Affirmation", emoji: "💛" },
                  { label: "Reflection", emoji: "🪞" },
                  { label: "Quiz", emoji: "🧠" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <span className="text-lg">{step.emoji}</span>
                      <span className="text-[10px] font-medium mt-0.5" style={{ color: c.tipText }}>{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-xs mx-0.5" style={{ color: c.subtext }}>→</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 leading-relaxed" style={{ color: c.tipText }}>
                Each block follows this sequence so you learn through logic, imagery, emotion, and active recall. Take your time. Understanding always matters more than speed.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ───── BLOCK OVERVIEW TABLE ───── */}
        {totalBlocks > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-sm mb-8 overflow-hidden" style={{ background: "hsl(0 0% 100%)" }}>
              <CardContent className="p-0">
                <div className="px-5 pt-5 pb-3">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide" style={{ color: c.subtext }}>
                    Block Overview
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "hsl(5 15% 96%)" }}>
                        <th className="text-left px-5 py-2.5 font-medium text-xs" style={{ color: c.subtext }}>Block</th>
                        <th className="text-center px-3 py-2.5 font-medium text-xs" style={{ color: c.subtext }}>Terms</th>
                        <th className="text-center px-3 py-2.5 font-medium text-xs" style={{ color: c.subtext }}>Status</th>
                        <th className="text-center px-5 py-2.5 font-medium text-xs" style={{ color: c.subtext }}>Best Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocks.map((block, i) => (
                        <tr
                          key={block.block_number}
                          className="border-t transition-colors hover:bg-muted/30 cursor-pointer"
                          style={{ borderColor: "hsl(5 10% 92%)" }}
                          onClick={() => navigate(`/section/${id}/study/${block.block_number}`)}
                        >
                          <td className="px-5 py-3 font-medium" style={{ color: c.cardHeading }}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: blockAccentColors[i % blockAccentColors.length].stripe }} />
                              Block {block.block_number}
                            </div>
                          </td>
                          <td className="text-center px-3 py-3" style={{ color: c.cardText }}>{block.term_count}</td>
                          <td className="text-center px-3 py-3">
                            {block.completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 50% 32%)" }}>
                                <CheckCircle2 className="h-3 w-3" /> Done
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(5 20% 93%)", color: c.subtext }}>
                                <Circle className="h-3 w-3" /> Open
                              </span>
                            )}
                          </td>
                          <td className="text-center px-5 py-3 font-medium" style={{ color: block.bestScore !== null ? "hsl(145 45% 35%)" : c.subtext }}>
                            {block.bestScore !== null && block.bestTotal !== null ? `${block.bestScore}/${block.bestTotal}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ───── BLOCK CARDS ───── */}
        <div className="space-y-6">
          {blocks.map((block, i) => {
            const accent = blockAccentColors[i % blockAccentColors.length];
            const objectives = blockObjectivesMap[id!]?.[block.block_number] || [];
            return (
              <motion.div key={block.block_number} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
                <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
                  <div className="flex">
                    <div className="w-1.5 flex-shrink-0" style={{ background: accent.stripe }} />
                    <CardContent className="p-6 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: accent.bg || accent.stripe + "22", color: accent.stripe }}>
                            {block.block_number}
                          </div>
                          <h3 className="font-display text-lg font-semibold" style={{ color: c.cardHeading }}>Block {block.block_number}</h3>
                          {block.completed && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 50% 40%)" }} />}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium" style={{ color: c.cardText }}>{block.term_count} terms</span>
                          {block.bestScore !== null && block.bestTotal !== null && (
                            <p className="text-xs mt-0.5" style={{ color: "hsl(145 40% 40%)" }}>Best: {block.bestScore}/{block.bestTotal}</p>
                          )}
                        </div>
                      </div>

                      {objectives.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg" style={{ background: "hsl(195 25% 96%)" }}>
                          <p className="text-xs font-medium mb-1.5" style={{ color: "hsl(195 30% 35%)" }}>In this block, you will be able to:</p>
                          <ul className="space-y-1">
                            {objectives.map((obj, j) => (
                              <li key={j} className="text-xs leading-relaxed flex items-start gap-2" style={{ color: "hsl(195 15% 40%)" }}>
                                <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "hsl(195 45% 55%)" }} />
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

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

        {/* ───── FINAL EXAM ───── */}
        {blocks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + blocks.length * 0.06 }}>
            <Card
              className="border-2 cursor-pointer hover:shadow-lg transition-all mt-8 mb-6"
              style={{ background: "hsl(42 50% 97%)", borderColor: "hsl(42 40% 75%)" }}
              onClick={() => navigate(`/section/${id}/final-exam`)}
            >
              <CardContent className="p-6 flex items-center gap-4">
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
