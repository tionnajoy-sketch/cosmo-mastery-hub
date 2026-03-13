import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, StickyNote, Loader2 } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import BrainNote from "@/components/BrainNote";

const c = pageColors.study;

export interface UploadedBlock {
  id: string;
  block_number: number;
  term_title: string;
  pronunciation: string;
  definition: string;
  visualization_desc: string;
  metaphor: string;
  affirmation: string;
  reflection_prompt: string;
  practice_scenario: string;
  quiz_question: string;
  quiz_options: string[];
  quiz_answer: string;
  quiz_question_2: string;
  quiz_options_2: string[];
  quiz_answer_2: string;
  quiz_question_3: string;
  quiz_options_3: string[];
  quiz_answer_3: string;
  user_notes: string;
  image_url?: string;
  instructor_notes?: string;
  slide_type?: string;
}

type TabType = "definition" | "pronunciation" | "visualize" | "metaphor" | "affirmation" | "reflection" | "practice" | "quiz" | "journal";

interface UploadedTermCardProps {
  block: UploadedBlock;
  onNotesChange: (blockId: string, notes: string) => void;
}

const UploadedTermCard = ({ block, onNotesChange }: UploadedTermCardProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("definition");
  const [journalNote, setJournalNote] = useState(block.user_notes || "");
  const [journalSaving, setJournalSaving] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  const tabs: { key: TabType; label: string }[] = [
    { key: "definition", label: "Definition" },
    { key: "pronunciation", label: "Pronounce" },
    { key: "visualize", label: "Visualize" },
    { key: "metaphor", label: "Metaphor" },
    { key: "affirmation", label: "Affirmation" },
    { key: "reflection", label: "Reflection" },
    ...(block.practice_scenario ? [{ key: "practice" as TabType, label: "Practice" }] : []),
    { key: "quiz", label: "Quiz" },
    { key: "journal", label: "Journal" },
  ];

  // Auto-save journal notes
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (journalNote === block.user_notes) return;
      setJournalSaving(true);
      await supabase.from("uploaded_module_blocks").update({ user_notes: journalNote }).eq("id", block.id);
      onNotesChange(block.id, journalNote);
      setJournalSaving(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [journalNote, block.id, block.user_notes, onNotesChange]);

  const getSpeakText = () => {
    switch (activeTab) {
      case "definition": return `${block.term_title}. ${block.definition}`;
      case "pronunciation": return block.term_title;
      case "metaphor": return `${block.term_title}. ${block.metaphor}`;
      case "affirmation": return block.affirmation;
      default: return block.term_title;
    }
  };

  const showSpeakButton = ["definition", "pronunciation", "metaphor", "affirmation"].includes(activeTab);

  const renderQuizQuestion = (question: string, options: string[], answer: string, key: string) => {
    if (!question) return null;
    const isThisRevealed = quizRevealed && quizSelected !== null;
    return (
      <div className="space-y-3 mb-4" key={key}>
        <p className="text-sm font-medium leading-relaxed" style={{ color: c.termHeading }}>{question}</p>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isSelected = quizSelected === `${key}-${letter}`;
            const isCorrect = opt === answer;
            let bg = c.tabInactive;
            let border = "transparent";
            if (isThisRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
            else if (isThisRevealed && isSelected && !isCorrect) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
            else if (isThisRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }

            return (
              <button
                key={i}
                onClick={() => { if (!quizRevealed) { setQuizSelected(`${key}-${letter}`); setQuizRevealed(true); } }}
                className="w-full text-left p-3 rounded-lg text-sm transition-all"
                style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                disabled={quizRevealed}
              >
                <span className="font-semibold mr-2">{letter})</span> {opt}
                {isThisRevealed && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 40% 45%)" }} />}
                {isThisRevealed && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "definition":
        return <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.definition}</p>;

      case "pronunciation":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display font-bold" style={{ color: c.termHeading }}>{block.term_title}</span>
              <SpeakButton text={block.term_title} size="default" label="Hear it" />
            </div>
            {block.pronunciation && (
              <p className="text-lg italic" style={{ color: c.subtext }}>/{block.pronunciation}/</p>
            )}
            <BrainNote text="Hearing and saying a term out loud activates your auditory memory pathway. Try saying it three times!" />
          </div>
        );

      case "visualize":
        return (
          <div className="space-y-3">
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.visualization_desc}</p>
            <BrainNote text="Visualizing a concept creates a mental picture that strengthens recall. Close your eyes and imagine this image." />
          </div>
        );

      case "metaphor":
        return <p className="text-base leading-relaxed italic" style={{ color: c.bodyText }}>{block.metaphor}</p>;

      case "affirmation":
        return (
          <div className="space-y-3">
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.affirmation}</p>
            <BrainNote text="Affirmations activate your limbic system and build emotional confidence around what you're learning." />
          </div>
        );

      case "reflection":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium leading-relaxed" style={{ color: c.termHeading }}>{block.reflection_prompt}</p>
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
                  <SpeechToTextButton onTranscript={(text) => { setReflectionText((prev) => prev ? `${prev} ${text}` : text); setReflectionSubmitted(false); }} />
                </div>
              )}
            </div>
            {!reflectionSubmitted ? (
              <Button
                size="sm"
                onClick={() => setReflectionSubmitted(true)}
                disabled={!reflectionText.trim()}
                className="w-full"
                style={{ background: c.tabActive, color: c.tabActiveText }}
              >
                Save My Reflection
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} />
                  <span className="text-sm font-medium" style={{ color: "hsl(145 40% 45%)" }}>Reflection saved</span>
                </div>
                <BrainNote text="Pausing to reflect activates your prefrontal cortex and helps move information from short-term to long-term memory." />
                <button onClick={() => setReflectionSubmitted(false)} className="text-xs underline" style={{ color: c.subtext }}>Edit my reflection</button>
              </motion.div>
            )}
          </div>
        );

      case "practice":
        return (
          <div className="space-y-3">
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.practice_scenario}</p>
            <BrainNote text="Applying concepts to real scenarios builds the neural connections you'll need in the salon and on your state board exam." />
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            {renderQuizQuestion(block.quiz_question, block.quiz_options, block.quiz_answer, "q1")}
            {quizRevealed && (
              <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>
                Try Again
              </Button>
            )}
          </div>
        );

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
                <SpeechToTextButton onTranscript={(text) => setJournalNote((prev) => prev ? `${prev} ${text}` : text)} />
              </div>
            </div>
            {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving...</p>}
            {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </div>
        );
    }
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-1 mb-4">
          <h3 className="font-display text-xl font-semibold" style={{ color: c.termHeading }}>{block.term_title}</h3>
          <SpeakButton text={block.term_title} />
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
            {showSpeakButton && activeTab !== "pronunciation" && (
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

export default UploadedTermCard;
