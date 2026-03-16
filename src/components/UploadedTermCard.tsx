import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, StickyNote, Loader2, BookOpen, Eye, Lightbulb, Heart, PenLine, Wrench, GraduationCap, Mic, HelpCircle, Fingerprint } from "lucide-react";
import { pageColors } from "@/lib/colors";
import { fireBlockCompleteConfetti } from "@/lib/confetti";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import BrainNote from "@/components/BrainNote";
import VideoPlayer from "@/components/VideoPlayer";

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
  concept_identity?: string[];
  image_url?: string;
  instructor_notes?: string;
  slide_type?: string;
  video_url?: string;
}

type TabType = "definition" | "identity" | "pronunciation" | "visualize" | "metaphor" | "affirmation" | "reflection" | "practice" | "quiz" | "journal";

interface UploadedTermCardProps {
  block: UploadedBlock;
  onNotesChange: (blockId: string, notes: string) => void;
}

const UploadedTermCard = ({ block, onNotesChange }: UploadedTermCardProps) => {
  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const [activeTab, setActiveTab] = useState<TabType>("definition");
  const [journalNote, setJournalNote] = useState(block.user_notes || "");
  const [journalSaving, setJournalSaving] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const reflectionCoinAwarded = useRef(false);
  const journalCoinAwarded = useRef(false);
  const audioCoinAwarded = useRef<Set<string>>(new Set());
  const blockCompleteAwarded = useRef(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["definition"]));

  // Personalized tab ordering based on learning style
  const uploadedTabIcons: Record<TabType, React.ReactNode> = {
    definition: <BookOpen className="h-3.5 w-3.5" />,
    identity: <Fingerprint className="h-3.5 w-3.5" />,
    pronunciation: <Mic className="h-3.5 w-3.5" />,
    visualize: <Eye className="h-3.5 w-3.5" />,
    metaphor: <Lightbulb className="h-3.5 w-3.5" />,
    affirmation: <Heart className="h-3.5 w-3.5" />,
    reflection: <PenLine className="h-3.5 w-3.5" />,
    practice: <Wrench className="h-3.5 w-3.5" />,
    quiz: <HelpCircle className="h-3.5 w-3.5" />,
    journal: <GraduationCap className="h-3.5 w-3.5" />,
  };

  const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
  const hasIdentity = identityItems.length > 0;

  const allTabs: { key: TabType; label: string }[] = [
    { key: "definition", label: "Define" },
    ...(hasIdentity ? [{ key: "identity" as TabType, label: "Identity" }] : []),
    { key: "pronunciation", label: "Pronounce" },
    { key: "visualize", label: "Visualize" },
    { key: "metaphor", label: "Metaphor" },
    { key: "affirmation", label: "Affirm" },
    { key: "reflection", label: "Reflect" },
    ...(block.practice_scenario ? [{ key: "practice" as TabType, label: "Practice" }] : []),
    { key: "quiz", label: "Quiz" },
    { key: "journal", label: "Journal" },
  ];

  const learningStyle = (profile as any)?.learning_style || "visual";
  const priorityMap: Record<string, TabType[]> = {
    visual: ["visualize", "metaphor", "definition"],
    reading: ["definition", "reflection", "journal"],
    kinesthetic: ["practice", "quiz", "definition"],
    auditory: ["metaphor", "affirmation", "definition"],
  };
  const priority = priorityMap[learningStyle] || priorityMap.visual;
  
  const tabs = [...allTabs].sort((a, b) => {
    const aIdx = priority.indexOf(a.key);
    const bIdx = priority.indexOf(b.key);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });

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

  // Award coins for journal (first meaningful save)
  useEffect(() => {
    if (journalNote.length >= 10 && !journalCoinAwarded.current) {
      journalCoinAwarded.current = true;
      addCoins(3, "reflection");
    }
  }, [journalNote, addCoins]);

  const handleAudioComplete = useCallback(() => {
    const key = `${block.id}-${activeTab}`;
    if (!audioCoinAwarded.current.has(key)) {
      audioCoinAwarded.current.add(key);
      addCoins(2, "audio");
    }
  }, [block.id, activeTab, addCoins]);

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
        return (
          <div>
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.definition}</p>
            {block.video_url && <VideoPlayer url={block.video_url} />}
          </div>
        );

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
            {imageUrl ? (
              <img src={imageUrl} alt={`Visual diagram for ${block.term_title}`} className="w-full rounded-lg mb-3" />
            ) : imageLoading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: c.tabActive }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating your illustration...</p>
              </div>
            ) : (
              <div className="flex justify-center mb-3">
                <Button size="sm" variant="outline" onClick={generateImage} disabled={imageLoading} className="gap-2">
                  Generate Visual Diagram
                </Button>
              </div>
            )}
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.visualization_desc}</p>
            {block.video_url && <VideoPlayer url={block.video_url} />}
            {videoSuggestions.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium" style={{ color: c.subtext }}>📹 Suggested Videos:</p>
                {videoSuggestions.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                    className="block text-sm underline" style={{ color: c.tabActive }}>
                    {v.label}
                  </a>
                ))}
              </div>
            )}
            {!videoSuggestions.length && !videoLoading && (
              <Button size="sm" variant="ghost" onClick={fetchVideoSuggestions} className="gap-1 text-xs" style={{ color: c.subtext }}>
                🎬 Find Related Videos
              </Button>
            )}
            {videoLoading && <p className="text-xs" style={{ color: c.subtext }}>Finding videos...</p>}
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
                onClick={() => {
                  setReflectionSubmitted(true);
                  if (!reflectionCoinAwarded.current) {
                    reflectionCoinAwarded.current = true;
                    addCoins(3, "reflection");
                  }
                }}
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

  const [imageUrl, setImageUrl] = useState(block.image_url || "");
  const [imageLoading, setImageLoading] = useState(false);
  const [videoSuggestions, setVideoSuggestions] = useState<{ label: string; url: string }[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  const generateImage = async () => {
    if (imageUrl || imageLoading) return;
    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-term-image", {
        body: { termId: block.id, term: block.term_title, definition: block.definition, metaphor: block.metaphor },
      });
      const url = data?.image_url || data?.imageUrl;
      if (url) {
        setImageUrl(url);
        await supabase.from("uploaded_module_blocks").update({ image_url: url }).eq("id", block.id);
      }
    } catch (e) {
      console.error("Image generation failed:", e);
    } finally {
      setImageLoading(false);
    }
  };

  const fetchVideoSuggestions = async () => {
    setVideoLoading(true);
    try {
      const { data } = await supabase.functions.invoke("suggest-video", {
        body: { term: block.term_title, definition: block.definition },
      });
      if (data?.videos) setVideoSuggestions(data.videos);
    } catch (e) {
      console.error("Video suggestion failed:", e);
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden" style={{ background: c.card }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-display text-xl font-semibold" style={{ color: c.termHeading }}>{block.term_title}</h3>
          <SpeakButton text={block.term_title} />
        </div>

        {block.instructor_notes && (
          <Collapsible className="mb-3">
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md hover:bg-muted/60 transition-colors" style={{ color: "hsl(42 55% 45%)" }}>
              <StickyNote className="h-3.5 w-3.5" />
              Instructor Notes
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 px-3 py-2 rounded-lg text-sm italic leading-relaxed" style={{ background: "hsl(42 50% 96%)", color: "hsl(42 30% 28%)" }}>
                {block.instructor_notes}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Icon grid tabs */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const isVisited = visitedTabs.has(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setVisitedTabs((prev) => {
                    const next = new Set(prev);
                    next.add(tab.key);
                    if (!blockCompleteAwarded.current && tabs.every((t) => next.has(t.key))) {
                      blockCompleteAwarded.current = true;
                      addCoins(15, "block_complete");
                      fireBlockCompleteConfetti();
                    }
                    return next;
                  });
                }}
                className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-medium transition-all relative"
                style={{
                  background: isActive ? c.tabActive : c.tabInactive,
                  color: isActive ? c.tabActiveText : c.tabInactiveText,
                  boxShadow: isActive ? "0 2px 8px hsla(42, 58%, 48%, 0.25)" : "none",
                }}
              >
                {uploadedTabIcons[tab.key]}
                {tab.label}
                {isVisited && !isActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(145 50% 50%)" }} />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {showSpeakButton && activeTab !== "pronunciation" && (
              <div className="flex justify-end mb-2">
                <SpeakButton text={getSpeakText()} label="Listen" size="sm" onComplete={handleAudioComplete} />
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
