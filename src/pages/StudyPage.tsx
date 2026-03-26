import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Gamepad2, GraduationCap } from "lucide-react";
import AskTJFullScreen from "@/components/AskTJFullScreen";
import AppHeader from "@/components/AppHeader";
import TermListItem from "@/components/TermListItem";
import LearningOrbDialog from "@/components/LearningOrbDialog";
import { pageColors } from "@/lib/colors";
import { blockObjectivesMap } from "@/lib/sectionObjectives";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";

const c = pageColors.study;

interface Term { id: string; term: string; definition: string; metaphor: string; affirmation: string; concept_identity?: any; }

const termToBlock = (t: Term, blockNum: number): UploadedBlock => ({
  id: t.id,
  block_number: blockNum,
  term_title: t.term,
  pronunciation: "",
  definition: t.definition,
  visualization_desc: "",
  metaphor: t.metaphor,
  affirmation: t.affirmation,
  reflection_prompt: `In your own words, explain what ${t.term} means and why it matters.`,
  practice_scenario: "",
  quiz_question: "",
  quiz_options: [],
  quiz_answer: "",
  quiz_question_2: "",
  quiz_options_2: [],
  quiz_answer_2: "",
  quiz_question_3: "",
  quiz_options_3: [],
  quiz_answer_3: "",
  user_notes: "",
  concept_identity: Array.isArray(t.concept_identity) ? t.concept_identity : [],
});

const StudyPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sectionName, setSectionName] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<UploadedBlock | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [completedTerms, setCompletedTerms] = useState<Set<string>>(new Set());

  const blockNum = Number(block);
  const objectives = blockObjectivesMap[id!]?.[blockNum] || [];

  useEffect(() => {
    if (!id || !block) return;
    const fetchData = async () => {
      const [sectionRes, termsRes] = await Promise.all([
        supabase.from("sections").select("name").eq("id", id).single(),
        supabase.from("terms").select("*").eq("section_id", id).eq("block_number", blockNum).order("order"),
      ]);
      if (sectionRes.data) setSectionName(sectionRes.data.name);
      if (termsRes.data) setTerms(termsRes.data);
    };
    fetchData();
  }, [id, block]);

  const handleNotesChange = useCallback(() => {}, []);

  const handleTermComplete = useCallback((termId: string) => {
    setCompletedTerms(prev => new Set(prev).add(termId));
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to {sectionName || "Section"}
          </Button>

          {/* Split layout: TJ photo left, whiteboard right */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Left: TJ Photo */}
            <motion.div
              className="hidden lg:block lg:w-2/5 rounded-2xl overflow-hidden relative"
              style={{ minHeight: 500 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <img
                src={tjBackground}
                alt="TJ Anderson"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.6) 0%, hsl(0 0% 0% / 0.1) 60%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="font-display text-2xl font-bold text-white mb-1">
                  {sectionName}
                </h2>
                <p className="text-sm text-white/80">Block {block} · {terms.length} terms</p>
                {objectives.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-white/90" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">Learning Objectives</span>
                    </div>
                    {objectives.map((obj, i) => (
                      <p key={i} className="text-xs text-white/75 leading-relaxed">• {obj}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Whiteboard with terms */}
            <motion.div
              className="flex-1 lg:w-3/5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Mobile header (no photo on mobile) */}
              <div className="lg:hidden mb-4">
                <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
                  <img src={tjBackground} alt="TJ Anderson" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 0% / 0.7) 0%, hsl(0 0% 0% / 0.2) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h1 className="font-display text-xl font-bold text-white">{sectionName} — Block {block}</h1>
                    <p className="text-xs text-white/80">{terms.length} terms to study</p>
                  </div>
                </div>
              </div>

              {/* Whiteboard */}
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{
                  background: "hsl(0 0% 99% / 0.95)",
                  border: "2px solid hsl(0 0% 88%)",
                  boxShadow: "0 4px 24px hsl(0 0% 0% / 0.06), inset 0 1px 0 hsl(0 0% 100%)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Whiteboard header */}
                <div className="flex items-center gap-3 mb-5 pb-3" style={{ borderBottom: "2px dashed hsl(0 0% 88%)" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 70% 55%)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(145 60% 45%)" }} />
                  <h2 className="font-display text-lg font-bold ml-2 hidden lg:block" style={{ color: c.heading }}>
                    {sectionName} — Block {block}
                  </h2>
                  <span className="text-xs ml-auto" style={{ color: c.subtext }}>
                    {completedTerms.size}/{terms.length} mastered
                  </span>
                </div>

                {/* Term list */}
                <div className="space-y-3">
                  {terms.map((term, i) => (
                    <TermListItem
                      key={term.id}
                      termTitle={term.term}
                      definition={term.definition}
                      index={i}
                      isCompleted={completedTerms.has(term.id)}
                      onContinue={() => {
                        setSelectedBlock(termToBlock(term, blockNum));
                        setSelectedIndex(i);
                      }}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                {terms.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <Button className="w-full py-5 text-base gap-2" style={{ background: c.buttonPrimary, color: "white" }} onClick={() => navigate(`/section/${id}/activity/${block}`)}>
                      <Gamepad2 className="h-5 w-5" /> Practice Activities
                    </Button>
                    <Button className="w-full py-5 text-base gap-2" style={{ background: c.buttonSecondary, color: "white" }} onClick={() => navigate(`/section/${id}/quiz/${block}`)}>
                      <Brain className="h-5 w-5" /> Quiz Me on This Block
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <AIMentorChat
          sectionName={sectionName}
          sectionId={id!}
          blockNumber={block}
          terms={terms.map((t) => ({ term: t.term, definition: t.definition }))}
          learningStyle={profile?.learning_style}
        />
      </div>

      {/* Full-screen Learning Dialog */}
      <LearningOrbDialog
        open={!!selectedBlock}
        onOpenChange={(open) => { if (!open) setSelectedBlock(null); }}
        block={selectedBlock}
        onNotesChange={handleNotesChange}
        mode="builtin"
        blockIndex={selectedIndex}
      />
    </div>
  );
};

export default StudyPage;
