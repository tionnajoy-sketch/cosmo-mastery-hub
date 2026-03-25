import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Gamepad2, GraduationCap } from "lucide-react";
import AIMentorChat from "@/components/AIMentorChat";
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

  return (
    <div className="min-h-screen relative">
      {/* TJ Background */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.12, filter: "brightness(1.1)" }}
      />
      <div className="fixed inset-0" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.88) 0%, hsl(0 0% 98% / 0.92) 100%)" }} />

      <div className="relative z-10">
        <AppHeader />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to {sectionName || "Section"}
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold mb-1" style={{ color: c.heading }}>
              {sectionName} — Block {block}
            </h1>
            <p className="text-sm mb-5" style={{ color: c.subtext }}>
              Tap any term to begin the 9-layer learning journey.
            </p>

            {objectives.length > 0 && (
              <Card className="border-0 shadow-sm mb-5" style={{ background: "hsl(195 30% 96% / 0.9)", backdropFilter: "blur(6px)" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4" style={{ color: "hsl(195 45% 38%)" }} />
                    <span className="text-xs font-semibold" style={{ color: "hsl(195 35% 25%)" }}>In this block, you will be able to:</span>
                  </div>
                  {objectives.map((obj, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: "hsl(195 15% 38%)" }}>• {obj}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Term List */}
          <div className="space-y-3">
            {terms.map((term, i) => (
              <TermListItem
                key={term.id}
                termTitle={term.term}
                definition={term.definition}
                index={i}
                onClick={() => {
                  setSelectedBlock(termToBlock(term, blockNum));
                  setSelectedIndex(i);
                }}
              />
            ))}
          </div>

          {terms.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 pb-8 space-y-3">
              <Button className="w-full py-6 text-base gap-2" style={{ background: c.buttonPrimary, color: "white" }} onClick={() => navigate(`/section/${id}/activity/${block}`)}>
                <Gamepad2 className="h-5 w-5" /> Practice Activities
              </Button>
              <Button className="w-full py-6 text-base gap-2" style={{ background: c.buttonSecondary, color: "white" }} onClick={() => navigate(`/section/${id}/quiz/${block}`)}>
                <Brain className="h-5 w-5" /> Quiz Me on This Block
              </Button>
            </motion.div>
          )}
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
