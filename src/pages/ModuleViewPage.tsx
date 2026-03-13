import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Brain, CheckCircle2, XCircle, Sparkles, Dumbbell, Library } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pageColors } from "@/lib/colors";
import { blockAccentColors } from "@/lib/colors";
import AIMentorChat from "@/components/AIMentorChat";
import UploadedTermCard, { type UploadedBlock } from "@/components/UploadedTermCard";

const c = pageColors.study;

const ModuleViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [moduleTitle, setModuleTitle] = useState("");
  const [blocks, setBlocks] = useState<UploadedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [miniQuizBlock, setMiniQuizBlock] = useState<number | null>(null);
  const [miniQuizIdx, setMiniQuizIdx] = useState(0);
  const [miniQuizSelected, setMiniQuizSelected] = useState<string | null>(null);
  const [miniQuizRevealed, setMiniQuizRevealed] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [modRes, blocksRes] = await Promise.all([
        supabase.from("uploaded_modules").select("title").eq("id", id).single(),
        supabase.from("uploaded_module_blocks").select("*").eq("module_id", id).order("block_number").order("created_at"),
      ]);
      if (modRes.data) setModuleTitle(modRes.data.title);
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
        })));
      }

      // Fetch completed quiz blocks
      if (user) {
        const { data: quizResults } = await supabase
          .from("uploaded_quiz_results")
          .select("block_number")
          .eq("module_id", id)
          .eq("user_id", user.id);
        if (quizResults) {
          setCompletedBlocks(new Set(quizResults.map((r) => r.block_number)));
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const handleNotesChange = useCallback((blockId: string, notes: string) => {
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, user_notes: notes } : b));
  }, []);

  const blockGroups: Record<number, UploadedBlock[]> = {};
  blocks.forEach((b) => {
    if (!blockGroups[b.block_number]) blockGroups[b.block_number] = [];
    blockGroups[b.block_number].push(b);
  });

  const getMiniQuizQuestions = (groupBlocks: UploadedBlock[]) => {
    const questions: { question: string; options: string[]; answer: string; term: string }[] = [];
    groupBlocks.forEach((b) => {
      if (b.quiz_question_2 && b.quiz_options_2.length > 0)
        questions.push({ question: b.quiz_question_2, options: b.quiz_options_2, answer: b.quiz_answer_2, term: b.term_title });
      if (b.quiz_question_3 && b.quiz_options_3.length > 0)
        questions.push({ question: b.quiz_question_3, options: b.quiz_options_3, answer: b.quiz_answer_3, term: b.term_title });
    });
    return questions;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const sortedGroups = Object.entries(blockGroups).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/my-modules")} className="mb-4 gap-2" style={{ color: c.subtext }}>
          <ArrowLeft className="h-4 w-4" /> My Modules
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: c.heading }}>{moduleTitle}</h1>
          <p className="text-sm mb-6" style={{ color: c.subtext }}>
            {blocks.length} terms across {sortedGroups.length} block{sortedGroups.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {sortedGroups.map(([blockNum, groupBlocks], groupIdx) => {
          const accent = blockAccentColors[groupIdx % blockAccentColors.length];
          const miniQuestions = getMiniQuizQuestions(groupBlocks);
          const isQuizOpen = miniQuizBlock === Number(blockNum);
          const hasCompletedQuiz = completedBlocks.has(Number(blockNum));

          return (
            <motion.div key={blockNum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 rounded-full" style={{ background: accent.stripe }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold" style={{ color: c.heading }}>
                      Block {blockNum}
                    </h2>
                    {hasCompletedQuiz && (
                      <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 50% 42%)" }} />
                    )}
                  </div>
                  <p className="text-xs" style={{ color: c.subtext }}>
                    {groupBlocks.map((b) => b.term_title).join(" · ")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {groupBlocks.map((block) => (
                  <UploadedTermCard key={block.id} block={block} onNotesChange={handleNotesChange} />
                ))}
              </div>

              {/* Block Navigation Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  className="w-full gap-2 py-5"
                  variant="outline"
                  onClick={() => navigate(`/module/${id}/activity/${blockNum}`)}
                  style={{ borderColor: accent.stripe, color: accent.stripe }}
                >
                  <Dumbbell className="h-4 w-4" /> Practice Activities
                </Button>
                <Button
                  className="w-full gap-2 py-5"
                  onClick={() => navigate(`/module/${id}/quiz/${blockNum}`)}
                  style={{ background: accent.stripe, color: "hsl(0 0% 100%)" }}
                >
                  <Sparkles className="h-4 w-4" /> Quiz Me
                </Button>
              </div>

              {/* Mini Block Quiz */}
              {miniQuestions.length > 0 && (
                <div className="mt-3">
                  {!isQuizOpen ? (
                    <Button
                      onClick={() => { setMiniQuizBlock(Number(blockNum)); setMiniQuizIdx(0); setMiniQuizSelected(null); setMiniQuizRevealed(false); }}
                      className="w-full gap-2"
                      variant="outline"
                      style={{ borderColor: accent.stripe, color: accent.stripe }}
                    >
                      <Brain className="h-4 w-4" /> Quick Review ({miniQuestions.length} questions)
                    </Button>
                  ) : (
                    <Card className="border-0 shadow-md" style={{ background: accent.bg }}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent.stripe }}>
                            Question {miniQuizIdx + 1} of {miniQuestions.length}
                          </p>
                          <button onClick={() => setMiniQuizBlock(null)} className="text-xs underline" style={{ color: c.subtext }}>Close</button>
                        </div>
                        <p className="text-sm font-medium mb-3" style={{ color: c.termHeading }}>
                          {miniQuestions[miniQuizIdx].question}
                        </p>
                        <div className="space-y-2">
                          {miniQuestions[miniQuizIdx].options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isSelected = miniQuizSelected === letter;
                            const isCorrect = opt === miniQuestions[miniQuizIdx].answer;
                            let bg = "hsl(0 0% 100%)";
                            let border = "transparent";
                            if (miniQuizRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                            else if (miniQuizRevealed && isSelected && !isCorrect) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
                            else if (miniQuizRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }

                            return (
                              <button
                                key={i}
                                onClick={() => { if (!miniQuizRevealed) { setMiniQuizSelected(letter); setMiniQuizRevealed(true); } }}
                                className="w-full text-left p-3 rounded-lg text-sm transition-all"
                                style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                                disabled={miniQuizRevealed}
                              >
                                <span className="font-semibold mr-2">{letter})</span> {opt}
                                {miniQuizRevealed && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 40% 45%)" }} />}
                                {miniQuizRevealed && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />}
                              </button>
                            );
                          })}
                        </div>
                        {miniQuizRevealed && (
                          <div className="mt-3 flex justify-end">
                            {miniQuizIdx < miniQuestions.length - 1 ? (
                              <Button size="sm" onClick={() => { setMiniQuizIdx((i) => i + 1); setMiniQuizSelected(null); setMiniQuizRevealed(false); }} style={{ background: accent.stripe, color: "hsl(0 0% 100%)" }}>
                                Next Question
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => setMiniQuizBlock(null)} style={{ background: accent.stripe, color: "hsl(0 0% 100%)" }}>
                                Done!
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AIMentorChat sectionName={moduleTitle} sectionId={id!} />
    </div>
  );
};

export default ModuleViewPage;
