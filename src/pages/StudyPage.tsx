import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Gamepad2, GraduationCap } from "lucide-react";
import TermCard from "@/components/TermCard";
import AIMentorChat from "@/components/AIMentorChat";
import { pageColors } from "@/lib/colors";

const c = pageColors.study;

interface Term { id: string; term: string; definition: string; metaphor: string; affirmation: string; }

const blockObjectivesMap: Record<number, string[]> = {
  1: [
    "Explain the structure and function of the epidermis and dermis.",
    "Identify the role of key skin layers in protection and growth.",
  ],
  2: [
    "Recognize the sublayers of the epidermis and their functions.",
    "Match terms like stratum corneum and stratum germinativum with their descriptions.",
  ],
  3: [
    "Identify the components of the dermis including collagen and elastin.",
    "Explain how the dermis supports skin strength and flexibility.",
  ],
  4: [
    "Explain what sebaceous glands and sebum do for the skin and hair.",
    "Recognize where these glands are located and how over-cleansing affects them.",
  ],
  5: [
    "Identify the structure and function of sudoriferous (sweat) glands.",
    "Match terms like secretory coil and sweat duct with their correct descriptions.",
  ],
  6: [
    "Explain key skin functions including sensation, absorption, and secretion.",
    "Identify how the skin protects against environmental damage.",
  ],
  7: [
    "Recognize common skin conditions and growth patterns.",
    "Explain factors that affect skin health and regeneration.",
  ],
};

const StudyPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sectionName, setSectionName] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const blockNum = Number(block);
  const objectives = blockObjectivesMap[blockNum] || [];

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

  useEffect(() => {
    if (!user || terms.length === 0) return;
    const fetchBookmarks = async () => {
      const { data } = await supabase.from("bookmarks").select("term_id").eq("user_id", user.id).in("term_id", terms.map((t) => t.id));
      if (data) setBookmarkedIds(new Set(data.map((b) => b.term_id)));
    };
    fetchBookmarks();
  }, [user, terms]);

  const toggleBookmark = async (termId: string) => {
    if (!user) return;
    const isCurrentlyBookmarked = bookmarkedIds.has(termId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) next.delete(termId); else next.add(termId);
      return next;
    });
    if (isCurrentlyBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("term_id", termId);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, term_id: termId });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {sectionName || "Section"}
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: c.heading }}>
            {sectionName} — Block {block}
          </h1>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: c.subtext }}>
            Explore each term through five perspectives. Take your time.
          </p>

          {/* Block Learning Objectives */}
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
              <TermCard term={term} isBookmarked={bookmarkedIds.has(term.id)} onToggleBookmark={toggleBookmark} />
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
      />
    </div>
  );
};

export default StudyPage;
