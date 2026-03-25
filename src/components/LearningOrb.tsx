import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, StickyNote, Loader2, BookOpen, Eye,
  Lightbulb, Heart, PenLine, Wrench, GraduationCap, Mic,
  HelpCircle, Fingerprint, X, Volume2, VolumeX,
} from "lucide-react";
import { pageColors } from "@/lib/colors";
import { fireBlockCompleteConfetti } from "@/lib/confetti";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import BrainNote from "@/components/BrainNote";
import VideoPlayer from "@/components/VideoPlayer";
import type { UploadedBlock } from "@/components/UploadedTermCard";

const c = pageColors.study;

const playChimeSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

const playCelebrationSound = () => {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {}
};

type TabType = "definition" | "identity" | "pronunciation" | "visualize" | "metaphor" | "affirmation" | "reflection" | "practice" | "quiz" | "journal";

interface OrbNode {
  key: TabType;
  label: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const nodeStyles: Record<TabType, { color: string; glow: string }> = {
  definition:    { color: "hsl(45 80% 55%)",  glow: "hsl(45 80% 55% / 0.4)" },
  identity:      { color: "hsl(280 50% 55%)", glow: "hsl(280 50% 55% / 0.4)" },
  pronunciation: { color: "hsl(20 70% 55%)",  glow: "hsl(20 70% 55% / 0.4)" },
  visualize:     { color: "hsl(210 65% 55%)", glow: "hsl(210 65% 55% / 0.4)" },
  metaphor:      { color: "hsl(270 55% 60%)", glow: "hsl(270 55% 60% / 0.4)" },
  affirmation:   { color: "hsl(346 45% 56%)", glow: "hsl(346 45% 56% / 0.4)" },
  reflection:    { color: "hsl(220 10% 55%)", glow: "hsl(220 10% 55% / 0.4)" },
  practice:      { color: "hsl(160 50% 45%)", glow: "hsl(160 50% 45% / 0.4)" },
  quiz:          { color: "hsl(0 65% 55%)",   glow: "hsl(0 65% 55% / 0.4)" },
  journal:       { color: "hsl(25 60% 50%)",  glow: "hsl(25 60% 50% / 0.4)" },
};

const tabIcons: Record<TabType, React.ReactNode> = {
  definition: <BookOpen className="h-4 w-4" />,
  identity: <Fingerprint className="h-4 w-4" />,
  pronunciation: <Mic className="h-4 w-4" />,
  visualize: <Eye className="h-4 w-4" />,
  metaphor: <Lightbulb className="h-4 w-4" />,
  affirmation: <Heart className="h-4 w-4" />,
  reflection: <PenLine className="h-4 w-4" />,
  practice: <Wrench className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  journal: <GraduationCap className="h-4 w-4" />,
};

interface LearningOrbProps {
  block: UploadedBlock;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
}

const LearningOrb = ({ block, onNotesChange, mode = "uploaded" }: LearningOrbProps) => {
  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled, toggleSounds } = useSoundsEnabled();
  const [expandedNode, setExpandedNode] = useState<TabType | null>(null);
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
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState(block.image_url || "");
  const [imageLoading, setImageLoading] = useState(false);
  const [videoSuggestions, setVideoSuggestions] = useState<{ label: string; url: string }[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [completionPulse, setCompletionPulse] = useState(false);

  // Load saved data for builtin terms
  useEffect(() => {
    if (mode !== "builtin" || !user) return;
    supabase.from("journal_notes").select("note").eq("user_id", user.id).eq("term_id", block.id).single().then(({ data }) => {
      if (data) setJournalNote(data.note);
    });
    supabase.from("reflections").select("response").eq("user_id", user.id).eq("term_id", block.id).single().then(({ data }) => {
      if (data?.response) { setReflectionText(data.response); setReflectionSubmitted(true); }
    });
    supabase.from("term_images").select("image_url").eq("term_id", block.id).single().then(({ data }) => {
      if (data) setImageUrl(data.image_url);
    });
  }, [mode, user, block.id]);

  const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
  const hasIdentity = identityItems.length > 0;

  const allTabs: { key: TabType; label: string }[] = useMemo(() => [
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
  ], [hasIdentity, block.practice_scenario]);

  const orbNodes: OrbNode[] = useMemo(() =>
    allTabs.map(t => ({
      ...t,
      icon: tabIcons[t.key],
      color: nodeStyles[t.key].color,
      glowColor: nodeStyles[t.key].glow,
    })),
  [allTabs]);

  // Auto-save journal
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(async () => {
      if (mode === "uploaded") {
        if (journalNote === block.user_notes) return;
        setJournalSaving(true);
        await supabase.from("uploaded_module_blocks").update({ user_notes: journalNote }).eq("id", block.id);
        onNotesChange(block.id, journalNote);
      } else {
        if (!journalNote) return;
        setJournalSaving(true);
        await supabase.from("journal_notes").upsert(
          { user_id: user.id, term_id: block.id, note: journalNote, updated_at: new Date().toISOString() },
          { onConflict: "user_id,term_id" }
        );
      }
      setJournalSaving(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [journalNote, block.id, block.user_notes, onNotesChange, user, mode]);

  useEffect(() => {
    if (journalNote.length >= 10 && !journalCoinAwarded.current) {
      journalCoinAwarded.current = true;
      addCoins(3, "reflection");
    }
  }, [journalNote, addCoins]);

  const handleAudioComplete = useCallback(() => {
    const key = `${block.id}-${expandedNode}`;
    if (!audioCoinAwarded.current.has(key)) {
      audioCoinAwarded.current.add(key);
      addCoins(2, "audio");
    }
  }, [block.id, expandedNode, addCoins]);

  const handleNodeClick = (key: TabType) => {
    if (soundsEnabled) playChimeSound();
    setExpandedNode(key);
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(key);
      if (!blockCompleteAwarded.current && allTabs.every(t => next.has(t.key))) {
        blockCompleteAwarded.current = true;
        setCompletionPulse(true);
        addCoins(15, "block_complete");
        fireBlockCompleteConfetti();
        if (soundsEnabled) playCelebrationSound();
        setTimeout(() => setCompletionPulse(false), 2000);
      }
      return next;
    });
  };

  const closeNode = () => {
    setExpandedNode(null);
  };

  const getSpeakText = () => {
    switch (expandedNode) {
      case "definition": return `${block.term_title}. ${block.definition}`;
      case "pronunciation": return block.term_title;
      case "metaphor": return `${block.term_title}. ${block.metaphor}`;
      case "affirmation": return block.affirmation;
      default: return block.term_title;
    }
  };

  const showSpeakButton = expandedNode && ["definition", "pronunciation", "metaphor", "affirmation"].includes(expandedNode);

  const generateImage = async () => {
    if (imageUrl || imageLoading) return;
    setImageLoading(true);
    try {
      const { data } = await supabase.functions.invoke("generate-term-image", {
        body: { termId: block.id, term: block.term_title, definition: block.definition, metaphor: block.metaphor },
      });
      const url = data?.image_url || data?.imageUrl;
      if (url) {
        setImageUrl(url);
        await supabase.from("uploaded_module_blocks").update({ image_url: url }).eq("id", block.id);
      }
    } catch (e) { console.error("Image generation failed:", e); }
    finally { setImageLoading(false); }
  };

  const fetchVideoSuggestions = async () => {
    setVideoLoading(true);
    try {
      const { data } = await supabase.functions.invoke("suggest-video", {
        body: { term: block.term_title, definition: block.definition },
      });
      if (data?.videos) setVideoSuggestions(data.videos);
    } catch (e) { console.error("Video suggestion failed:", e); }
    finally { setVideoLoading(false); }
  };

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
            let bg = c.tabInactive; let border = "transparent";
            if (isThisRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
            else if (isThisRevealed && isSelected && !isCorrect) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
            else if (isThisRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
            return (
              <button key={i} onClick={() => { if (!quizRevealed) { setQuizSelected(`${key}-${letter}`); setQuizRevealed(true); } }}
                className="w-full text-left p-3 rounded-lg text-sm transition-all"
                style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }} disabled={quizRevealed}>
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
    switch (expandedNode) {
      case "definition":
        return (
          <div><p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.definition}</p>
            {block.video_url && <VideoPlayer url={block.video_url} />}</div>
        );
      case "identity":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: c.termHeading }}>Concept Identity</p>
            <div className="flex flex-wrap gap-2">
              {identityItems.map((item, i) => (
                <span key={i} className="inline-block px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ background: c.tabInactive, color: c.termHeading, border: `1px solid ${c.tabActive}33` }}>{item}</span>
              ))}
            </div>
            <BrainNote text="These identity words capture the essence of this concept. Use them as mental anchors when you see this term on the State Board exam." />
          </div>
        );
      case "pronunciation":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display font-bold" style={{ color: c.termHeading }}>{block.term_title}</span>
              <SpeakButton text={block.term_title} size="default" label="Hear it" />
            </div>
            {block.pronunciation && <p className="text-lg italic" style={{ color: c.subtext }}>/{block.pronunciation}/</p>}
            <BrainNote text="Hearing and saying a term out loud activates your auditory memory pathway. Try saying it three times!" />
          </div>
        );
      case "visualize":
        return (
          <div className="space-y-3">
            {imageUrl ? <img src={imageUrl} alt={`Visual for ${block.term_title}`} className="w-full rounded-lg mb-3" />
              : imageLoading ? <div className="flex flex-col items-center gap-3 py-6"><Loader2 className="h-8 w-8 animate-spin" style={{ color: c.tabActive }} /><p className="text-sm" style={{ color: c.subtext }}>Generating illustration...</p></div>
              : <div className="flex justify-center mb-3"><Button size="sm" variant="outline" onClick={generateImage} className="gap-2">Generate Visual Diagram</Button></div>}
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.visualization_desc}</p>
            {block.video_url && <VideoPlayer url={block.video_url} />}
            {videoSuggestions.length > 0 && (
              <div className="space-y-2 pt-2"><p className="text-xs font-medium" style={{ color: c.subtext }}>📹 Suggested Videos:</p>
                {videoSuggestions.map((v, i) => <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block text-sm underline" style={{ color: c.tabActive }}>{v.label}</a>)}</div>
            )}
            {!videoSuggestions.length && !videoLoading && <Button size="sm" variant="ghost" onClick={fetchVideoSuggestions} className="gap-1 text-xs" style={{ color: c.subtext }}>🎬 Find Related Videos</Button>}
            {videoLoading && <p className="text-xs" style={{ color: c.subtext }}>Finding videos...</p>}
            <BrainNote text="Visualizing a concept creates a mental picture that strengthens recall." />
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
              <Textarea placeholder="Pause and reflect... Write 1–2 sentences." value={reflectionText}
                onChange={(e) => { setReflectionText(e.target.value); setReflectionSubmitted(false); }}
                disabled={reflectionSubmitted} className="min-h-[90px] text-sm resize-none pr-10" style={{ color: c.bodyText }} />
              {!reflectionSubmitted && <div className="absolute right-1 bottom-1"><SpeechToTextButton onTranscript={(text) => { setReflectionText(prev => prev ? `${prev} ${text}` : text); }} /></div>}
            </div>
            {!reflectionSubmitted ? (
              <Button size="sm" onClick={() => { setReflectionSubmitted(true); if (!reflectionCoinAwarded.current) { reflectionCoinAwarded.current = true; addCoins(3, "reflection"); } }}
                disabled={!reflectionText.trim()} className="w-full" style={{ background: c.tabActive, color: c.tabActiveText }}>Save My Reflection</Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} /><span className="text-sm font-medium" style={{ color: "hsl(145 40% 45%)" }}>Reflection saved</span></div>
                <BrainNote text="Pausing to reflect helps move information from short-term to long-term memory." />
                <button onClick={() => setReflectionSubmitted(false)} className="text-xs underline" style={{ color: c.subtext }}>Edit</button>
              </motion.div>
            )}
          </div>
        );
      case "practice":
        return (
          <div className="space-y-3">
            <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>{block.practice_scenario}</p>
            <BrainNote text="Applying concepts to real scenarios builds neural connections for the salon and state board exam." />
          </div>
        );
      case "quiz":
        return (
          <div className="space-y-4">
            {renderQuizQuestion(block.quiz_question, block.quiz_options, block.quiz_answer, "q1")}
            {quizRevealed && <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>Try Again</Button>}
          </div>
        );
      case "journal":
        return (
          <div>
            <div className="relative">
              <Textarea placeholder="Write your notes here..." value={journalNote} onChange={(e) => setJournalNote(e.target.value)}
                className="min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 text-base pr-10" style={{ color: c.bodyText }} />
              <div className="absolute right-1 bottom-1"><SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} /></div>
            </div>
            {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving...</p>}
            {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </div>
        );
      default: return null;
    }
  };

  // Calculate node positions in a circle
  const getNodePosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  const allCompleted = allTabs.every(t => visitedTabs.has(t.key));
  const completionProgress = visitedTabs.size / allTabs.length;

  // Motion variants for each layer type
  const contentVariants: Record<string, any> = {
    definition:    { initial: { opacity: 0 },                    animate: { opacity: 1 },                    transition: { duration: 0.25 } },
    visualize:     { initial: { opacity: 0, scale: 0.9 },        animate: { opacity: 1, scale: 1 },          transition: { duration: 0.4 } },
    metaphor:      { initial: { opacity: 0, rotate: -3 },        animate: { opacity: 1, rotate: 0 },         transition: { duration: 0.4 } },
    identity:      { initial: { opacity: 0, y: 20 },             animate: { opacity: 1, y: 0 },              transition: { duration: 0.35 } },
    reflection:    { initial: { opacity: 0 },                    animate: { opacity: 1 },                    transition: { duration: 0.5 } },
    practice:      { initial: { opacity: 0, scale: 0.95, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 },   transition: { duration: 0.3, type: "spring" } },
    quiz:          { initial: { opacity: 0, x: 10 },             animate: { opacity: 1, x: 0 },              transition: { duration: 0.2 } },
  };

  const getContentMotion = (key: TabType) => contentVariants[key] || { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  const orbRadius = 110;

  return (
    <div className="relative">
      {/* Instructor Notes (above orb) */}
      {block.instructor_notes && (
        <Collapsible className="mb-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md hover:bg-muted/60 transition-colors" style={{ color: "hsl(42 55% 45%)" }}>
            <StickyNote className="h-3.5 w-3.5" /> Instructor Notes
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 px-3 py-2 rounded-lg text-sm italic leading-relaxed" style={{ background: "hsl(42 50% 96%)", color: "hsl(42 30% 28%)" }}>
              {block.instructor_notes}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sound Toggle */}
      <button
        onClick={toggleSounds}
        className="absolute top-1 right-1 z-10 p-1.5 rounded-full transition-colors hover:bg-muted/60"
        title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
        style={{ color: soundsEnabled ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        {soundsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      </button>

      {/* === ORB VIEW === */}
      <AnimatePresence mode="wait">
        {expandedNode === null ? (
          <motion.div
            key="orb"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center py-4"
          >
            {/* Orbital container */}
            <div className="relative" style={{ width: orbRadius * 2 + 80, height: orbRadius * 2 + 80 }}>
              {/* Center term - breathing animation */}
              <motion.div
                className="absolute rounded-full flex flex-col items-center justify-center text-center cursor-default z-10"
                style={{
                  width: 100, height: 100,
                  left: "50%", top: "50%",
                  marginLeft: -50, marginTop: -50,
                  background: allCompleted
                    ? "linear-gradient(135deg, hsl(45 80% 55%), hsl(25 60% 65%))"
                    : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                  boxShadow: completionPulse
                    ? "0 0 40px 15px hsl(45 80% 55% / 0.5), 0 0 80px 30px hsl(45 80% 55% / 0.25)"
                    : allCompleted
                      ? "0 0 25px 8px hsl(45 80% 55% / 0.35)"
                      : "0 0 20px 5px hsl(var(--primary) / 0.2)",
                }}
                animate={{
                  scale: completionPulse ? [1, 1.15, 1, 1.1, 1] : [1, 1.04, 1],
                }}
                transition={{
                  duration: completionPulse ? 1.5 : 3,
                  repeat: completionPulse ? 0 : Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "hsl(0 0% 100%)" }}>
                  {block.term_title.length > 14 ? block.term_title.slice(0, 12) + "…" : block.term_title}
                </span>
                {allCompleted && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                    <CheckCircle2 className="h-4 w-4 mt-0.5" style={{ color: "hsl(0 0% 100%)" }} />
                  </motion.div>
                )}
              </motion.div>

              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${orbRadius * 2 + 80} ${orbRadius * 2 + 80}`}>
                <circle
                  cx={(orbRadius * 2 + 80) / 2} cy={(orbRadius * 2 + 80) / 2} r={orbRadius - 20}
                  fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity="0.3"
                />
                <circle
                  cx={(orbRadius * 2 + 80) / 2} cy={(orbRadius * 2 + 80) / 2} r={orbRadius - 20}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
                  strokeDasharray={`${completionProgress * 2 * Math.PI * (orbRadius - 20)} ${2 * Math.PI * (orbRadius - 20)}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${(orbRadius * 2 + 80) / 2} ${(orbRadius * 2 + 80) / 2})`}
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              </svg>

              {/* Orbiting nodes */}
              {orbNodes.map((node, i) => {
                const pos = getNodePosition(i, orbNodes.length, orbRadius);
                const centerX = orbRadius + 40;
                const centerY = orbRadius + 40;
                const isVisited = visitedTabs.has(node.key);

                return (
                  <motion.button
                    key={node.key}
                    className="absolute flex flex-col items-center justify-center rounded-full z-20"
                    style={{
                      width: 52, height: 52,
                      left: centerX + pos.x - 26,
                      top: centerY + pos.y - 26,
                      background: node.color,
                      color: "hsl(0 0% 100%)",
                      boxShadow: `0 2px 12px ${node.glowColor}`,
                    }}
                    onClick={() => handleNodeClick(node.key)}
                    animate={{
                      x: [0, Math.sin(i * 1.2) * 3, 0],
                      y: [0, Math.cos(i * 0.9) * 3, 0],
                    }}
                    transition={{
                      duration: 4 + i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    whileHover={{
                      scale: 1.2,
                      boxShadow: `0 4px 20px ${node.glowColor}`,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {node.icon}
                    <span className="text-[8px] font-semibold mt-0.5 leading-none">{node.label}</span>
                    {isVisited && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5" style={{ color: "hsl(145 50% 42%)" }} />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Progress label */}
            <p className="text-xs font-medium mt-2" style={{ color: c.subtext }}>
              {visitedTabs.size}/{allTabs.length} explored
              {allCompleted && " — ✨ Complete!"}
            </p>
          </motion.div>
        ) : (
          /* === EXPANDED PANEL === */
          <motion.div
            key={`panel-${expandedNode}`}
            initial={{ opacity: 0, scale: 0.85, borderRadius: "50%" }}
            animate={{ opacity: 1, scale: 1, borderRadius: "1rem" }}
            exit={{ opacity: 0, scale: 0.85, borderRadius: "50%" }}
            transition={{ duration: 0.4, type: "spring", damping: 20 }}
            className="rounded-2xl p-5 shadow-lg relative"
            style={{
              background: c.card,
              border: `2px solid ${nodeStyles[expandedNode].color}`,
              boxShadow: `0 8px 30px ${nodeStyles[expandedNode].glow}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: nodeStyles[expandedNode].color, color: "hsl(0 0% 100%)" }}>
                  {tabIcons[expandedNode]}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.termHeading }}>{block.term_title}</h3>
                  <p className="text-xs font-medium" style={{ color: nodeStyles[expandedNode].color }}>
                    {orbNodes.find(n => n.key === expandedNode)?.label}
                  </p>
                </div>
              </motion.div>
              <button onClick={closeNode} className="p-1.5 rounded-full hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4" style={{ color: c.subtext }} />
              </button>
            </div>

            {/* Speak button */}
            {showSpeakButton && expandedNode !== "pronunciation" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-end mb-2">
                <SpeakButton text={getSpeakText()} label="Listen" size="sm" onComplete={handleAudioComplete} />
              </motion.div>
            )}

            {/* Content with layer-specific animation */}
            <motion.div {...getContentMotion(expandedNode)}>
              {renderContent()}
            </motion.div>

            {/* Navigation dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mt-5 pt-3 border-t"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              {orbNodes.map((node, i) => {
                const isCurrent = node.key === expandedNode;
                const isVis = visitedTabs.has(node.key);
                return (
                  <button
                    key={node.key}
                    onClick={() => handleNodeClick(node.key)}
                    className="rounded-full transition-all"
                    style={{
                      width: isCurrent ? 24 : 8,
                      height: 8,
                      background: isCurrent ? node.color : isVis ? "hsl(145 50% 50%)" : "hsl(var(--border))",
                    }}
                    title={node.label}
                  />
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningOrb;
