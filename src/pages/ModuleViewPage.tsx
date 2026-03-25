import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Dumbbell, Library, CheckCircle2 } from "lucide-react";
import { pageColors, blockAccentColors } from "@/lib/colors";
import AIMentorChat from "@/components/AIMentorChat";
import { type UploadedBlock } from "@/components/UploadedTermCard";
import AppHeader from "@/components/AppHeader";
import TermListItem from "@/components/TermListItem";
import LearningOrbDialog from "@/components/LearningOrbDialog";
import tjBackground from "@/assets/tj-background.jpg";

const c = pageColors.study;

const ModuleViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleTitle, setModuleTitle] = useState("");
  const [blocks, setBlocks] = useState<UploadedBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [quizBankCount, setQuizBankCount] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<UploadedBlock | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [completedTerms, setCompletedTerms] = useState<Set<string>>(new Set());

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

  const blockGroups: Record<number, UploadedBlock[]> = {};
  blocks.forEach((b) => {
    if (!blockGroups[b.block_number]) blockGroups[b.block_number] = [];
    blockGroups[b.block_number].push(b);
  });

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const sortedGroups = Object.entries(blockGroups).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/my-modules")} className="mb-4 gap-2" style={{ color: c.subtext }}>
            <ArrowLeft className="h-4 w-4" /> My Modules
          </Button>

          {/* Split layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Left: TJ Photo */}
            <motion.div
              className="hidden lg:block lg:w-2/5 rounded-2xl overflow-hidden relative"
              style={{ minHeight: 500 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <img src={tjBackground} alt="TJ Anderson" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.6) 0%, hsl(0 0% 0% / 0.1) 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="font-display text-2xl font-bold text-white mb-1">{moduleTitle}</h2>
                <p className="text-sm text-white/80">{blocks.length} terms across {sortedGroups.length} block{sortedGroups.length !== 1 ? "s" : ""}</p>
              </div>
            </motion.div>

            {/* Right: Whiteboard */}
            <motion.div
              className="flex-1 lg:w-3/5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Mobile header */}
              <div className="lg:hidden mb-4">
                <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
                  <img src={tjBackground} alt="TJ Anderson" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.7) 0%, hsl(0 0% 0% / 0.2) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h1 className="font-display text-xl font-bold text-white">{moduleTitle}</h1>
                    <p className="text-xs text-white/80">{blocks.length} terms · {sortedGroups.length} blocks</p>
                  </div>
                </div>
              </div>

              {/* Whiteboard container */}
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{
                  background: "hsl(0 0% 99% / 0.95)",
                  border: "2px solid hsl(0 0% 88%)",
                  boxShadow: "0 4px 24px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100%)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Whiteboard header dots */}
                <div className="flex items-center gap-3 mb-5 pb-3" style={{ borderBottom: "2px dashed hsl(0 0% 88%)" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(145 60% 45%)" }} />
                  <h2 className="font-display text-lg font-bold ml-2 hidden lg:block" style={{ color: c.heading }}>
                    {moduleTitle}
                  </h2>
                  <span className="text-xs ml-auto" style={{ color: c.subtext }}>
                    {completedTerms.size}/{blocks.length} mastered
                  </span>
                </div>

                {sortedGroups.map(([blockNum, groupBlocks], groupIdx) => {
                  const accent = blockAccentColors[groupIdx % blockAccentColors.length];
                  const hasCompletedQuiz = completedBlocks.has(Number(blockNum));

                  return (
                    <div key={blockNum} className="mb-6 last:mb-0">
                      {/* Block header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1 h-8 rounded-full" style={{ background: accent.stripe }} />
                        <h3 className="font-display text-base font-semibold" style={{ color: c.heading }}>
                          Block {blockNum}
                        </h3>
                        {hasCompletedQuiz && <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 50% 42%)" }} />}
                      </div>

                      {/* Term list */}
                      <div className="space-y-3">
                        {groupBlocks.map((block, blockIdx) => (
                          <TermListItem
                            key={block.id}
                            termTitle={block.term_title}
                            pronunciation={block.pronunciation}
                            definition={block.definition}
                            index={blockIdx}
                            isCompleted={completedTerms.has(block.id)}
                            onContinue={() => {
                              setSelectedBlock(block);
                              setSelectedIndex(blockIdx);
                            }}
                          />
                        ))}
                      </div>

                      {/* Block action buttons */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Button
                          className="w-full gap-2 py-5"
                          variant="outline"
                          onClick={() => navigate(`/module/${id}/activity/${blockNum}`)}
                          style={{ borderColor: accent.stripe, color: accent.stripe }}
                        >
                          <Dumbbell className="h-4 w-4" /> Practice
                        </Button>
                        <Button
                          className="w-full gap-2 py-5"
                          onClick={() => navigate(`/module/${id}/quiz/${blockNum}`)}
                          style={{ background: accent.stripe, color: "hsl(0 0% 100%)" }}
                        >
                          <Sparkles className="h-4 w-4" /> Quiz Me
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quiz Bank */}
              {quizBankCount > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <Card className="border-2 shadow-md" style={{ borderColor: "hsl(var(--primary))", background: "hsl(var(--card) / 0.95)" }}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <Library className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
                        <div>
                          <h3 className="font-display text-lg font-semibold" style={{ color: c.heading }}>Quiz Bank</h3>
                          <p className="text-xs" style={{ color: c.subtext }}>{quizBankCount} exam-style questions</p>
                        </div>
                      </div>
                      <Button className="w-full mt-3 gap-2" onClick={() => navigate(`/module/${id}/quiz-bank`)}>
                        <Library className="h-4 w-4" /> Practice Quiz Bank
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        <AIMentorChat sectionName={moduleTitle} sectionId={id!} />
      </div>

      {/* Full-screen Learning Dialog */}
      <LearningOrbDialog
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
