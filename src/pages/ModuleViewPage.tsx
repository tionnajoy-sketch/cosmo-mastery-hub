import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudyTracker } from "@/hooks/useStudyTracker";
import { useCoins } from "@/hooks/useCoins";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Dumbbell, Library, CheckCircle2, BookOpen, Flame, Trophy, Target, ChevronRight, ChevronDown, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type UploadedBlock } from "@/components/UploadedTermCard";
import AppHeader from "@/components/AppHeader";
import LearningOrchestrator from "@/components/LearningOrchestrator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TILE_COLORS = [
  { bg: "hsl(346 55% 50%)", glow: "hsl(346 55% 50% / 0.4)" },
  { bg: "hsl(265 60% 52%)", glow: "hsl(265 60% 52% / 0.4)" },
  { bg: "hsl(215 70% 48%)", glow: "hsl(215 70% 48% / 0.4)" },
  { bg: "hsl(145 55% 38%)", glow: "hsl(145 55% 38% / 0.4)" },
  { bg: "hsl(25 65% 50%)", glow: "hsl(25 65% 50% / 0.4)" },
  { bg: "hsl(185 50% 42%)", glow: "hsl(185 50% 42% / 0.4)" },
  { bg: "hsl(320 50% 48%)", glow: "hsl(320 50% 48% / 0.4)" },
  { bg: "hsl(45 80% 45%)", glow: "hsl(45 80% 45% / 0.4)" },
];

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "mastered") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(45 85% 48% / 0.2)", color: "hsl(45 85% 90%)" }}>Mastered</span>
  );
  if (status === "completed") return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(145 45% 38% / 0.25)", color: "hsl(145 50% 80%)" }}>Complete</span>
  );
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.4)" }}>New</span>
  );
};

const ModuleViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const studyTracker = useStudyTracker();
  const { stats: coinStats } = useCoins();
  const [moduleTitle, setModuleTitle] = useState("");
  const [blocks, setBlocks] = useState<UploadedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [quizBankCount, setQuizBankCount] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<UploadedBlock | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [completedTerms, setCompletedTerms] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [overview, setOverview] = useState<any>(null);
  const [overviewOpen, setOverviewOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [modRes, blocksRes, overviewRes] = await Promise.all([
        supabase.from("uploaded_modules").select("title, detected_subject, document_type, total_chapters").eq("id", id).single(),
        supabase.from("uploaded_module_blocks").select("*").eq("module_id", id).order("block_number").order("created_at"),
        supabase.from("module_document_overview").select("*").eq("module_id", id).maybeSingle(),
      ]);
      if (modRes.data) setModuleTitle(modRes.data.title);
      if (overviewRes.data) setOverview(overviewRes.data);
      if (blocksRes.data) {
        setBlocks(blocksRes.data.map((b: any) => ({
          ...b,
          quiz_options: b.quiz_options || [],
          quiz_options_2: b.quiz_options_2 || [],
          quiz_options_3: b.quiz_options_3 || [],
          pronunciation: b.pronunciation || "",
          practice_scenario: b.practice_scenario || "",
          quiz_question_2: b.quiz_question_2 || "",
          quiz_answer_2: b.quiz_answer_2 || "",
          quiz_question_3: b.quiz_question_3 || "",
          quiz_answer_3: b.quiz_answer_3 || "",
          concept_identity: Array.isArray(b.concept_identity) ? b.concept_identity : [],
        })));
      }

      if (user) {
        const [quizRes, qbRes] = await Promise.all([
          supabase.from("uploaded_quiz_results").select("block_number").eq("module_id", id).eq("user_id", user.id),
          supabase.from("uploaded_module_quiz_bank").select("id", { count: "exact", head: true }).eq("module_id", id),
        ]);
        if (quizRes.data) setCompletedBlocks(new Set(quizRes.data.map((r) => r.block_number)));
        setQuizBankCount(qbRes.count || 0);
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleNotesChange = useCallback((blockId: string, notes: string) => {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, user_notes: notes } : b));
  }, []);

  const toggleGroup = useCallback((blockNum: number) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(blockNum)) next.delete(blockNum);
      else next.add(blockNum);
      return next;
    });
  }, []);

  const blockGroups: Record<number, UploadedBlock[]> = {};
  blocks.forEach((b) => {
    if (!blockGroups[b.block_number]) blockGroups[b.block_number] = [];
    blockGroups[b.block_number].push(b);
  });

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center" style={{ background: "hsl(240 15% 8%)" }}><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>;
  }

  const sortedGroups = Object.entries(blockGroups).sort(([a], [b]) => Number(a) - Number(b));
  let globalIndex = 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(240 15% 8%) 0%, hsl(260 20% 12%) 50%, hsl(240 15% 10%) 100%)" }}>
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 pt-5 pb-3">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/my-modules")} className="mb-3 gap-2 text-white/60 hover:text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> My Modules
        </Button>

        {/* Module Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{moduleTitle}</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            {blocks.length} terms across {sortedGroups.length} block{sortedGroups.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { icon: Flame, label: "Streak", value: studyTracker.currentStreak, color: "hsl(25 80% 55%)" },
            { icon: Sparkles, label: "Coins", value: coinStats.coins, color: "hsl(45 80% 55%)" },
            { icon: Trophy, label: "Mastered", value: completedTerms.size, color: "hsl(45 90% 50%)" },
            { icon: Target, label: "Progress", value: `${blocks.length > 0 ? Math.round((completedTerms.size / blocks.length) * 100) : 0}%`, color: "hsl(145 55% 50%)" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-2.5 text-center" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <stat.icon className="h-4 w-4 mx-auto mb-1" style={{ color: stat.color }} />
              <p className="text-lg font-bold text-white leading-tight">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Colorful Grid grouped by block ─── */}
      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
        {sortedGroups.map(([blockNum, groupBlocks]) => {
          const blockNumInt = Number(blockNum);
          const hasCompletedQuiz = completedBlocks.has(blockNumInt);
          const groupCompleted = groupBlocks.filter(b => completedTerms.has(b.id)).length;
          const groupPercent = groupBlocks.length > 0 ? Math.round((groupCompleted / groupBlocks.length) * 100) : 0;
          const isCollapsed = collapsedGroups.has(blockNumInt);

          return (
            <div key={blockNum}>
              {/* Block divider */}
              <button onClick={() => toggleGroup(blockNumInt)} className="flex items-center gap-3 mb-4 w-full group cursor-pointer">
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
                  style={{ color: "hsl(45 80% 70%)", background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                  <motion.div animate={{ rotate: isCollapsed ? 0 : 90 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.div>
                  <h2 className="font-display text-sm sm:text-base font-semibold uppercase tracking-widest">
                    Block {blockNum}
                  </h2>
                  {hasCompletedQuiz && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "hsl(145 50% 55%)" }} />}
                  <span className="text-[10px] opacity-60">{groupCompleted}/{groupBlocks.length}</span>
                </div>
                <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)" }} />
              </button>

              {/* Block progress bar */}
              {!isCollapsed && (
                <div className="mb-3 px-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${groupPercent}%`, background: "linear-gradient(90deg, hsl(145 55% 45%), hsl(45 80% 50%))" }} />
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    {/* Tile grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {groupBlocks.map((block) => {
                        const i = globalIndex++;
                        const isCompleted = completedTerms.has(block.id);
                        const isMastered = isCompleted && hasCompletedQuiz;
                        const status = isMastered ? "mastered" : isCompleted ? "completed" : "new";
                        const tileColor = TILE_COLORS[i % TILE_COLORS.length];

                        return (
                          <motion.button
                            key={block.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (i % 10) * 0.02 }}
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedBlock(block);
                              setSelectedIndex(groupBlocks.indexOf(block));
                            }}
                            className="relative rounded-2xl p-4 text-left transition-all overflow-hidden group"
                            style={{
                              background: isMastered
                                ? "linear-gradient(135deg, hsl(45 85% 48%), hsl(38 90% 42%))"
                                : isCompleted
                                  ? "linear-gradient(135deg, hsl(145 45% 38%), hsl(155 50% 32%))"
                                  : `linear-gradient(135deg, ${tileColor.bg}, ${tileColor.bg})`,
                              border: isMastered
                                ? "2px solid hsl(45 85% 60%)"
                                : isCompleted
                                  ? "2px solid hsl(145 45% 50%)"
                                  : "1px solid hsl(0 0% 100% / 0.1)",
                              boxShadow: isMastered
                                ? "0 4px 24px hsl(45 85% 48% / 0.4)"
                                : `0 4px 20px ${tileColor.glow}`,
                              minHeight: "120px",
                            }}
                          >
                            {/* Status icon */}
                            <div className="absolute top-2.5 right-2.5">
                              {isMastered && (
                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                                  <Trophy className="h-5 w-5 text-yellow-100" />
                                </motion.div>
                              )}
                              {isCompleted && !isMastered && <CheckCircle2 className="h-4 w-4 text-white/80" />}
                            </div>

                            <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight pr-6">
                              {block.term_title}
                            </h3>

                            <div className="mt-2">
                              <StatusBadge status={status} />
                            </div>

                            {/* Hover glow */}
                            {!isCompleted && (
                              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                style={{ boxShadow: `inset 0 0 30px ${tileColor.glow}` }} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Block action buttons */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <Button
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setSelectedBlock(groupBlocks[0]);
                          setSelectedIndex(0);
                        }}
                        style={{ background: "hsl(215 70% 48%)", color: "white" }}
                      >
                        <BookOpen className="h-4 w-4" /> Learn
                      </Button>
                      <Button
                        className="gap-1.5 text-xs"
                        variant="outline"
                        onClick={() => navigate(`/module/${id}/activity/${blockNum}`)}
                        style={{ borderColor: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100% / 0.7)", background: "transparent" }}
                      >
                        <Dumbbell className="h-4 w-4" /> Practice
                      </Button>
                      <Button
                        className="gap-1.5 text-xs"
                        variant="outline"
                        onClick={() => navigate(`/module/${id}/quiz/${blockNum}`)}
                        style={{ borderColor: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100% / 0.7)", background: "transparent" }}
                      >
                        <Sparkles className="h-4 w-4" /> Quiz
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Quiz Bank */}
        {quizBankCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl p-5" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.12)" }}>
              <div className="flex items-center gap-3 mb-3">
                <Library className="h-6 w-6" style={{ color: "hsl(45 80% 55%)" }} />
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">Quiz Bank</h3>
                  <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{quizBankCount} exam-style questions</p>
                </div>
              </div>
              <Button className="w-full mt-1 gap-2" onClick={() => navigate(`/module/${id}/quiz-bank`)}
                style={{ background: "hsl(45 80% 50%)", color: "hsl(240 15% 8%)" }}>
                <Library className="h-4 w-4" /> Practice Quiz Bank
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Full-screen Learning Dialog */}
      <LearningOrchestrator
        open={!!selectedBlock}
        onOpenChange={(open) => { if (!open) setSelectedBlock(null); }}
        block={selectedBlock}
        onNotesChange={handleNotesChange}
        blockIndex={selectedIndex}
      />
    </div>
  );
};

export default ModuleViewPage;
