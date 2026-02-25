import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Bookmark } from "lucide-react";

interface Term {
  id: string;
  term: string;
  definition: string;
  metaphor: string;
  affirmation: string;
}

type TabType = "definition" | "metaphor" | "affirmation";

const TermCard = ({
  term,
  isBookmarked,
  onToggleBookmark,
}: {
  term: Term;
  isBookmarked: boolean;
  onToggleBookmark: (termId: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("definition");

  const tabs: { key: TabType; label: string }[] = [
    { key: "definition", label: "Definition" },
    { key: "metaphor", label: "Metaphor" },
    { key: "affirmation", label: "Affirmation" },
  ];

  const content = {
    definition: term.definition,
    metaphor: term.metaphor,
    affirmation: term.affirmation,
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden" style={{ background: "white" }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold" style={{ color: "hsl(42 50% 25%)" }}>
            {term.term}
          </h3>
          <button
            onClick={() => onToggleBookmark(term.id)}
            className="p-1.5 rounded-full transition-colors"
            style={{
              background: isBookmarked ? "hsl(42 60% 92%)" : "transparent",
            }}
          >
            <Bookmark
              className="h-5 w-5 transition-colors"
              style={{
                color: isBookmarked ? "hsl(42 55% 48%)" : "hsl(42 15% 70%)",
                fill: isBookmarked ? "hsl(42 55% 48%)" : "none",
              }}
            />
          </button>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "hsl(42 55% 48%)" : "hsl(42 30% 92%)",
                color: activeTab === tab.key ? "white" : "hsl(42 30% 35%)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-base leading-relaxed"
            style={{ color: "hsl(42 15% 30%)" }}
          >
            {content[activeTab]}
          </motion.p>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

const StudyPage = () => {
  const { id, block } = useParams<{ id: string; block: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sectionName, setSectionName] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id || !block) return;
    const fetchData = async () => {
      const [sectionRes, termsRes] = await Promise.all([
        supabase.from("sections").select("name").eq("id", id).single(),
        supabase.from("terms").select("*").eq("section_id", id).eq("block_number", Number(block)).order("order"),
      ]);
      if (sectionRes.data) setSectionName(sectionRes.data.name);
      if (termsRes.data) setTerms(termsRes.data);
    };
    fetchData();
  }, [id, block]);

  useEffect(() => {
    if (!user || terms.length === 0) return;
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("term_id")
        .eq("user_id", user.id)
        .in("term_id", terms.map((t) => t.id));
      if (data) setBookmarkedIds(new Set(data.map((b) => b.term_id)));
    };
    fetchBookmarks();
  }, [user, terms]);

  const toggleBookmark = async (termId: string) => {
    if (!user) return;
    const isCurrentlyBookmarked = bookmarkedIds.has(termId);

    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) next.delete(termId);
      else next.add(termId);
      return next;
    });

    if (isCurrentlyBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("term_id", termId);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, term_id: termId });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(42 50% 92%), hsl(170 25% 94%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(`/section/${id}`)} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {sectionName || "Section"}
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: "hsl(42 50% 22%)" }}>
            {sectionName} — Block {block}
          </h1>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(42 20% 45%)" }}>
            Tap through Definition, Metaphor, and Affirmation for each term. Take your time.
          </p>

          {/* Supportive message */}
          <Card className="border-0 shadow-sm mb-6" style={{ background: "hsl(42 60% 96%)" }}>
            <CardContent className="p-4">
              <p className="text-sm leading-relaxed" style={{ color: "hsl(42 30% 30%)" }}>
                🌱 There is no rush here. Read each definition slowly, let the metaphor connect to something real in your life, and sit with the affirmation for a moment. This is your time to learn and grow at your own pace.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-5">
          {terms.map((term, i) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.08 }}
            >
              <TermCard
                term={term}
                isBookmarked={bookmarkedIds.has(term.id)}
                onToggleBookmark={toggleBookmark}
              />
            </motion.div>
          ))}
        </div>

        {terms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pb-8"
          >
            <Button
              className="w-full py-6 text-base gap-2"
              style={{ background: "hsl(170 40% 35%)", color: "white" }}
              onClick={() => navigate(`/section/${id}/quiz/${block}`)}
            >
              <Brain className="h-5 w-5" /> Quiz Me on This Block
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudyPage;
