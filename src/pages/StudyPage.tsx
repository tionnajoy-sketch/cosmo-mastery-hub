import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";

interface Term {
  id: string;
  term: string;
  definition: string;
  metaphor: string;
  affirmation: string;
}

type TabType = "definition" | "metaphor" | "affirmation";

const TermCard = ({ term }: { term: Term }) => {
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
        <h3 className="font-display text-xl font-semibold mb-4" style={{ color: "hsl(42 50% 25%)" }}>
          {term.term}
        </h3>

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
  const [sectionName, setSectionName] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);

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
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "hsl(42 20% 45%)" }}>
            Tap through Definition, Metaphor, and Affirmation for each term. Take your time.
          </p>
        </motion.div>

        <div className="space-y-5">
          {terms.map((term, i) => (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.08 }}
            >
              <TermCard term={term} />
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
