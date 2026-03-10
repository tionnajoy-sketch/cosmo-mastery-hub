import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, CheckCircle2 } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { getBuildExercise } from "@/lib/buildExercises";
import BuildTheBody from "@/components/BuildTheBody";
import BrainNote from "@/components/BrainNote";

const c = pageColors.study;

const generateReflectionPrompt = (term: string, definition: string): string => {
  const prompts = [
    `Why is ${term} important in cosmetology, and how would you explain it to a fellow student?`,
    `In your own words, what role does ${term} play? How does it connect to what you already know?`,
    `If a client asked you about ${term}, how would you explain it simply and confidently?`,
    `Think about ${term}. Why does understanding this concept matter for your career?`,
    `How does ${term} relate to what you see or do in the salon? Describe the connection.`,
  ];
  // Deterministic selection based on term name length
  return prompts[term.length % prompts.length];
};

interface Term { id: string; term: string; definition: string; metaphor: string; affirmation: string; }
type TabType = "definition" | "picture" | "metaphor" | "affirmation" | "reflection" | "journal" | "build";

interface TermCardProps {
  term: Term;
  isBookmarked: boolean;
  onToggleBookmark: (termId: string) => void;
}

const TermCard = ({ term, isBookmarked, onToggleBookmark }: TermCardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("definition");
  const [journalNote, setJournalNote] = useState("");
  const [journalSaving, setJournalSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);

  const buildExercise = useMemo(() => getBuildExercise(term.term), [term.term]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "definition", label: "Definition" },
    { key: "picture", label: "Picture" },
    { key: "metaphor", label: "Metaphor" },
    { key: "affirmation", label: "Affirmation" },
    ...(buildExercise ? [{ key: "build" as TabType, label: "🧩 Build" }] : []),
    { key: "journal", label: "Journal" },
  ];

  useEffect(() => {
    if (!user) return;
    supabase.from("journal_notes").select("note").eq("user_id", user.id).eq("term_id", term.id).single().then(({ data }) => {
      if (data) setJournalNote(data.note);
    });
  }, [user, term.id]);

  useEffect(() => {
    supabase.from("term_images").select("image_url").eq("term_id", term.id).single().then(({ data }) => {
      if (data) setImageUrl(data.image_url);
    });
  }, [term.id]);

  const generateImage = useCallback(async () => {
    if (imageUrl || imageLoading) return;
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-term-image", {
        body: { termId: term.id, term: term.term, definition: term.definition, metaphor: term.metaphor },
      });
      if (data?.image_url) setImageUrl(data.image_url);
      if (error) console.error("Image generation error:", error);
    } catch (e) {
      console.error("Failed to generate image:", e);
    } finally {
      setImageLoading(false);
    }
  }, [term, imageUrl, imageLoading]);

  useEffect(() => {
    if (activeTab === "picture" && !imageUrl && !imageLoading) generateImage();
  }, [activeTab, imageUrl, imageLoading, generateImage]);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(async () => {
      if (journalNote === "") return;
      setJournalSaving(true);
      await supabase.from("journal_notes").upsert(
        { user_id: user.id, term_id: term.id, note: journalNote, updated_at: new Date().toISOString() },
        { onConflict: "user_id,term_id" }
      );
      setJournalSaving(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [journalNote, user, term.id]);

  const renderContent = () => {
    switch (activeTab) {
      case "definition":
        return <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{term.definition}</p>;
      case "picture":
        return (
          <div className="flex flex-col items-center">
            {imageLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: c.tabActive }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating your illustration...</p>
              </div>
            ) : imageUrl ? (
              <div className="w-full">
                <img src={imageUrl} alt={`Illustration for ${term.term}`} className="rounded-lg max-h-64 object-contain w-full" />
                <div className="mt-3 p-3 rounded-lg" style={{ background: c.tabInactive }}>
                  <p className="font-display text-sm font-semibold mb-1" style={{ color: c.termHeading }}>
                    {term.term}
                  </p>
                  <p className="text-xs leading-relaxed italic" style={{ color: c.subtext }}>
                    {term.metaphor}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: c.subtext }}>Image will generate automatically...</p>
              </div>
            )}
          </div>
        );
      case "metaphor":
        return <p className="text-base leading-relaxed italic" style={{ color: c.bodyText }}>{term.metaphor}</p>;
      case "affirmation":
        return <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{term.affirmation}</p>;
      case "build":
        return buildExercise ? <BuildTheBody exercise={buildExercise} /> : null;
      case "journal":
        return (
          <div>
            <Textarea
              placeholder="Write your notes about this term here... How does it connect to what you already know?"
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base"
              style={{ color: c.bodyText }}
            />
            {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving...</p>}
            {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </div>
        );
    }
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold" style={{ color: c.termHeading }}>{term.term}</h3>
          <button
            onClick={() => onToggleBookmark(term.id)}
            className="p-1.5 rounded-full transition-colors"
            style={{ background: isBookmarked ? c.bookmarkBg : "transparent" }}
          >
            <Bookmark
              className="h-5 w-5 transition-colors"
              style={{ color: isBookmarked ? c.bookmark : c.subtext, fill: isBookmarked ? c.bookmark : "none" }}
            />
          </button>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: activeTab === tab.key ? c.tabActive : c.tabInactive,
                color: activeTab === tab.key ? c.tabActiveText : c.tabInactiveText,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TermCard;
