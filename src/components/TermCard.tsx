import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Loader2, CheckCircle2 } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { getBuildExercise } from "@/lib/buildExercises";
import BuildTheBody from "@/components/BuildTheBody";
import BrainNote from "@/components/BrainNote";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";

const c = pageColors.study;

const generateReflectionPrompt = (term: string, definition: string): string => {
  const prompts = [
    `Why is ${term} important in cosmetology, and how would you explain it to a fellow student?`,
    `In your own words, what role does ${term} play? How does it connect to what you already know?`,
    `If a client asked you about ${term}, how would you explain it simply and confidently?`,
    `Think about ${term}. Why does understanding this concept matter for your career?`,
    `How does ${term} relate to what you see or do in the salon? Describe the connection.`,
  ];
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
  const { addCoins } = useCoins();
  const [activeTab, setActiveTab] = useState<TabType>("definition");
  const [journalNote, setJournalNote] = useState("");
  const [journalSaving, setJournalSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const journalCoinAwarded = useRef(false);
  const reflectionCoinAwarded = useRef(false);
  const audioCoinAwarded = useRef<Set<string>>(new Set());

  const buildExercise = useMemo(() => getBuildExercise(term.term), [term.term]);
  const reflectionPrompt = useMemo(() => generateReflectionPrompt(term.term, term.definition), [term.term, term.definition]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "definition", label: "Definition" },
    { key: "picture", label: "Visualize" },
    { key: "metaphor", label: "Metaphor" },
    { key: "affirmation", label: "Affirmation" },
    { key: "reflection", label: "Reflection" },
    ...(buildExercise ? [{ key: "build" as TabType, label: "Practice" }] : []),
    { key: "journal", label: "Journal" },
  ];

  useEffect(() => {
    if (!user) return;
    supabase.from("journal_notes").select("note").eq("user_id", user.id).eq("term_id", term.id).single().then(({ data }) => {
      if (data) setJournalNote(data.note);
    });
    supabase.from("reflections").select("response").eq("user_id", user.id).eq("term_id", term.id).single().then(({ data }) => {
      if (data && data.response) {
        setReflectionText(data.response);
        setReflectionSubmitted(true);
      }
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

  const saveReflection = useCallback(async () => {
    if (!user || !reflectionText.trim()) return;
    setReflectionSaving(true);
    await supabase.from("reflections").upsert(
      { user_id: user.id, term_id: term.id, response: reflectionText, updated_at: new Date().toISOString() },
      { onConflict: "user_id,term_id" }
    );
    setReflectionSaving(false);
    setReflectionSubmitted(true);
  }, [user, term.id, reflectionText]);

  // Build full speak text for each tab
  const getSpeakText = () => {
    switch (activeTab) {
      case "definition": return `${term.term}. ${term.definition}`;
      case "metaphor": return `${term.term}. ${term.metaphor}`;
      case "affirmation": return term.affirmation;
      default: return term.term;
    }
  };

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
      case "reflection":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium leading-relaxed" style={{ color: c.termHeading }}>
              {reflectionPrompt}
            </p>
            <div className="relative">
              <Textarea
                placeholder="Take a moment to pause and reflect... Write 1–2 sentences."
                value={reflectionText}
                onChange={(e) => { setReflectionText(e.target.value); setReflectionSubmitted(false); }}
                disabled={reflectionSubmitted}
                className="min-h-[90px] text-sm resize-none pr-10"
                style={{ color: c.bodyText }}
              />
              {!reflectionSubmitted && (
                <div className="absolute right-1 bottom-1">
                  <SpeechToTextButton
                    onTranscript={(text) => {
                      setReflectionText((prev) => prev ? `${prev} ${text}` : text);
                      setReflectionSubmitted(false);
                    }}
                  />
                </div>
              )}
            </div>
            {!reflectionSubmitted ? (
              <Button
                size="sm"
                onClick={saveReflection}
                disabled={!reflectionText.trim() || reflectionSaving}
                className="w-full"
                style={{ background: c.tabActive, color: c.tabActiveText }}
              >
                {reflectionSaving ? "Saving..." : "Save My Reflection"}
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} />
                  <span className="text-sm font-medium" style={{ color: "hsl(145 40% 45%)" }}>Reflection saved</span>
                </div>
                <BrainNote text="Pausing to reflect activates your prefrontal cortex and helps move information from short-term to long-term memory. You are building real understanding." />
                <button
                  onClick={() => setReflectionSubmitted(false)}
                  className="text-xs underline"
                  style={{ color: c.subtext }}
                >
                  Edit my reflection
                </button>
              </motion.div>
            )}
          </div>
        );
      case "build":
        return buildExercise ? <BuildTheBody exercise={buildExercise} /> : null;
      case "journal":
        return (
          <div>
            <div className="relative">
              <Textarea
                placeholder="Write your notes about this term here... How does it connect to what you already know?"
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base pr-10"
                style={{ color: c.bodyText }}
              />
              <div className="absolute right-1 bottom-1">
                <SpeechToTextButton
                  onTranscript={(text) => setJournalNote((prev) => prev ? `${prev} ${text}` : text)}
                />
              </div>
            </div>
            {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving...</p>}
            {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </div>
        );
    }
  };

  const showSpeakButton = ["definition", "metaphor", "affirmation"].includes(activeTab);

  return (
    <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <h3 className="font-display text-xl font-semibold" style={{ color: c.termHeading }}>{term.term}</h3>
            <SpeakButton text={term.term} />
          </div>
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
            {showSpeakButton && (
              <div className="flex justify-end mb-2">
                <SpeakButton text={getSpeakText()} label="Listen" size="sm" />
              </div>
            )}
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default TermCard;
