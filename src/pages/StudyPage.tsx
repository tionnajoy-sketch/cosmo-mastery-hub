import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Gamepad2, GraduationCap } from "lucide-react";
import LearningOrb from "@/components/LearningOrb";
import AIMentorChat from "@/components/AIMentorChat";
import AppHeader from "@/components/AppHeader";
import { pageColors } from "@/lib/colors";
import { blockObjectivesMap } from "@/lib/sectionObjectives";
import type { UploadedBlock } from "@/components/UploadedTermCard";

const c = pageColors.study;

interface Term { id: string; term: string; definition: string; metaphor: string; affirmation: string; concept_identity?: any; }

/** Convert a built-in Term into UploadedBlock shape so LearningOrb can render it */
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
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {sectionName || "Section"}
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: c.heading }}>
            {sectionName} — Block {block}
          </h1>
          {terms.length > 0 && (
            <p className="text-xs font-medium mb-1" style={{ color: c.subtext }}>
              {terms.map(t => t.term).join(", ")}
            </p>
          )}
          <p className="text-sm mb-4 leading-relaxed" style={{ color: c.subtext }}>
            Explore each term through five perspectives. Take your time.
          </p>

          {objectives.length > 0 && (
            <Card className="border-0 shadow-sm mb-4" style={{ background: "hsl(195 30% 96%)" }}>
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

          <Card className="border-0 shadow-sm mb-6" style={{ background: c.tipBg }}>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed" style={{ color: c.tipText }}>
                🌱 Read the definition, view the picture, feel the metaphor, embrace the affirmation, and journal your thoughts. This is your time to learn and grow at your own pace.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-5">
          {terms.map((term, i) => (
            <motion.div key={term.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.08 }}>
              <LearningOrb block={termToBlock(term, blockNum)} onNotesChange={handleNotesChange} mode="builtin" />
            </motion.div>
          ))}
        </div>

        {terms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 pb-8 space-y-3">
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
  );
};

export default StudyPage;
