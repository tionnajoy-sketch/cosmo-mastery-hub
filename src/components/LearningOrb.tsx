import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, StickyNote, Loader2, BookOpen, Eye,
  Lightbulb, Heart, PenLine, Wrench, GraduationCap, Mic,
  HelpCircle, Fingerprint, X, Volume2, VolumeX, ChevronDown,
  Lock, ArrowRight,
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

type StepKey = "visualize" | "definition" | "breakdown" | "recognize" | "metaphor" | "information" | "reflection" | "practice" | "quiz";

interface StepConfig {
  key: StepKey;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  glowColor: string;
  guidedIntro: string;
}

const stepConfigs: StepConfig[] = [
  { key: "visualize",   label: "Visualize",      subtitle: "Visual cortex & pattern recognition",   icon: <Eye className="h-5 w-5" />,            color: "hsl(215 80% 42%)", bgColor: "hsl(215 60% 95%)", borderColor: "hsl(215 60% 72%)", gradient: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))", glowColor: "hsl(215 80% 42% / 0.3)",  guidedIntro: "Let's start here… see the concept before you define it." },
  { key: "definition",  label: "Define",          subtitle: "Language processing & cognitive labeling", icon: <BookOpen className="h-5 w-5" />,       color: "hsl(45 90% 40%)",  bgColor: "hsl(45 70% 95%)",  borderColor: "hsl(45 70% 72%)",  gradient: "linear-gradient(135deg, hsl(45 90% 40%), hsl(38 95% 48%))",  glowColor: "hsl(45 90% 40% / 0.3)",   guidedIntro: "Now let me explain… here's the clear, structured meaning." },
  { key: "breakdown",   label: "Break It Down",   subtitle: "Analytical processing & decoding",       icon: <Mic className="h-5 w-5" />,            color: "hsl(30 85% 45%)",  bgColor: "hsl(30 65% 95%)",  borderColor: "hsl(30 65% 72%)",  gradient: "linear-gradient(135deg, hsl(30 85% 45%), hsl(22 90% 52%))",  glowColor: "hsl(30 85% 45% / 0.3)",   guidedIntro: "Let's break this down… understanding the structure helps it stick." },
  { key: "recognize",   label: "Recognize",       subtitle: "Spatial memory & recall",                icon: <Fingerprint className="h-5 w-5" />,    color: "hsl(275 70% 50%)", bgColor: "hsl(275 50% 95%)", borderColor: "hsl(275 50% 72%)", gradient: "linear-gradient(135deg, hsl(275 70% 50%), hsl(285 75% 55%))", glowColor: "hsl(275 70% 50% / 0.3)",  guidedIntro: "Can you spot it? Identify the concept visually." },
  { key: "metaphor",    label: "Metaphor",        subtitle: "Limbic system & emotional association",   icon: <Lightbulb className="h-5 w-5" />,      color: "hsl(265 72% 48%)", bgColor: "hsl(265 52% 95%)", borderColor: "hsl(265 52% 72%)", gradient: "linear-gradient(135deg, hsl(265 72% 48%), hsl(255 78% 54%))", glowColor: "hsl(265 72% 48% / 0.3)",  guidedIntro: "Let me connect this to your life… this is where it gets real." },
  { key: "information", label: "Information",     subtitle: "Comprehension & deeper reasoning",       icon: <Heart className="h-5 w-5" />,          color: "hsl(180 60% 32%)", bgColor: "hsl(180 45% 95%)", borderColor: "hsl(180 45% 72%)", gradient: "linear-gradient(135deg, hsl(180 60% 32%), hsl(190 65% 38%))", glowColor: "hsl(180 60% 32% / 0.3)",  guidedIntro: "Let's go deeper… expanding your understanding." },
  { key: "reflection",  label: "Reflect",         subtitle: "Metacognition & self-awareness",         icon: <PenLine className="h-5 w-5" />,        color: "hsl(220 20% 35%)", bgColor: "hsl(220 12% 95%)", borderColor: "hsl(220 12% 72%)", gradient: "linear-gradient(135deg, hsl(220 20% 35%), hsl(230 25% 42%))", glowColor: "hsl(220 20% 35% / 0.25)", guidedIntro: "Pause and think… internalize what this means to you." },
  { key: "practice",    label: "Apply",           subtitle: "Active recall & problem-solving",        icon: <Wrench className="h-5 w-5" />,         color: "hsl(145 65% 32%)", bgColor: "hsl(145 50% 95%)", borderColor: "hsl(145 50% 72%)", gradient: "linear-gradient(135deg, hsl(145 65% 32%), hsl(155 70% 38%))", glowColor: "hsl(145 65% 32% / 0.3)",  guidedIntro: "You're doing great… now put your knowledge to work." },
  { key: "quiz",        label: "Assess",          subtitle: "Performance & test readiness",           icon: <HelpCircle className="h-5 w-5" />,     color: "hsl(0 75% 45%)",   bgColor: "hsl(0 55% 95%)",   borderColor: "hsl(0 55% 72%)",   gradient: "linear-gradient(135deg, hsl(0 75% 45%), hsl(10 80% 50%))",   glowColor: "hsl(0 75% 45% / 0.3)",    guidedIntro: "Show what you know… demonstrate your mastery." },
];

interface LearningOrbProps {
  block: UploadedBlock;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
}

const LearningOrb = ({ block, onNotesChange, mode = "uploaded" }: LearningOrbProps) => {
  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled, toggleSounds } = useSoundsEnabled();

  const [expandedStep, setExpandedStep] = useState<StepKey | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
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
  const [imageUrl, setImageUrl] = useState(block.image_url || "");
  const [imageLoading, setImageLoading] = useState(false);
  const [videoSuggestions, setVideoSuggestions] = useState<{ label: string; url: string }[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [recognizeSelected, setRecognizeSelected] = useState<number | null>(null);
  const [recognizeRevealed, setRecognizeRevealed] = useState(false);

  // Filter steps based on available data
  const activeSteps = useMemo(() => {
    const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
    return stepConfigs.filter(s => {
      if (s.key === "recognize" && identityItems.length === 0) return false;
      if (s.key === "practice" && !block.practice_scenario) return false;
      if (s.key === "breakdown" && !block.pronunciation && !block.definition) return false;
      return true;
    });
  }, [block.concept_identity, block.practice_scenario, block.pronunciation, block.definition]);

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
    const key = `${block.id}-${expandedStep}`;
    if (!audioCoinAwarded.current.has(key)) {
      audioCoinAwarded.current.add(key);
      addCoins(2, "audio");
    }
  }, [block.id, expandedStep, addCoins]);

  // Check if a step is unlocked (previous step completed, or it's step 0)
  const isStepUnlocked = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    const prevStep = activeSteps[stepIndex - 1];
    return completedSteps.has(prevStep.key);
  };

  const markStepComplete = (key: StepKey) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(key);
      // Check if all steps are now complete
      if (!blockCompleteAwarded.current && activeSteps.every(s => next.has(s.key))) {
        blockCompleteAwarded.current = true;
        addCoins(15, "block_complete");
        fireBlockCompleteConfetti();
        if (soundsEnabled) playCelebrationSound();
      }
      return next;
    });
  };

  const handleStepTap = (step: StepConfig, index: number) => {
    if (!isStepUnlocked(index)) return;
    if (soundsEnabled) playChimeSound();
    if (expandedStep === step.key) {
      // Close and mark complete
      markStepComplete(step.key);
      setExpandedStep(null);
    } else {
      setExpandedStep(step.key);
    }
  };

  const handleCompleteAndNext = (currentKey: StepKey) => {
    markStepComplete(currentKey);
    const currentIndex = activeSteps.findIndex(s => s.key === currentKey);
    if (currentIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentIndex + 1];
      if (soundsEnabled) playChimeSound();
      setExpandedStep(nextStep.key);
    } else {
      setExpandedStep(null);
    }
  };

  // Image generation
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
        if (mode === "uploaded") {
          await supabase.from("uploaded_module_blocks").update({ image_url: url }).eq("id", block.id);
        }
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

  const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
  const allCompleted = activeSteps.every(s => completedSteps.has(s.key));
  const progressPercent = (completedSteps.size / activeSteps.length) * 100;

  const getSpeakText = (key: StepKey) => {
    switch (key) {
      case "definition": return `${block.term_title}. ${block.definition}`;
      case "breakdown": return `Let's break down ${block.term_title}. ${block.pronunciation ? `It's pronounced ${block.pronunciation}.` : ""} ${block.definition}`;
      case "metaphor": return `${block.term_title}. ${block.metaphor}`;
      case "information": return block.affirmation;
      default: return block.term_title;
    }
  };

  const renderStepContent = (step: StepConfig) => {
    switch (step.key) {
      case "visualize":
        return (
          <div className="space-y-3">
            {imageUrl ? (
              <motion.img
                src={imageUrl} alt={`Visual for ${block.term_title}`}
                className="w-full rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              />
            ) : imageLoading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating illustration…</p>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Button size="sm" variant="outline" onClick={generateImage} className="gap-2">Generate Visual Diagram</Button>
              </div>
            )}
            <motion.p
              className="text-sm leading-relaxed"
              style={{ color: c.bodyText }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {block.visualization_desc}
            </motion.p>
            {block.video_url && <VideoPlayer url={block.video_url} />}
            {videoSuggestions.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium" style={{ color: c.subtext }}>📹 Suggested Videos:</p>
                {videoSuggestions.map((v, i) => (
                  <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block text-sm underline" style={{ color: step.color }}>{v.label}</a>
                ))}
              </div>
            )}
            {!videoSuggestions.length && !videoLoading && (
              <Button size="sm" variant="ghost" onClick={fetchVideoSuggestions} className="gap-1 text-xs" style={{ color: c.subtext }}>🎬 Find Related Videos</Button>
            )}
            {videoLoading && <p className="text-xs" style={{ color: c.subtext }}>Finding videos…</p>}
            <BrainNote text="Visualizing a concept creates a mental picture that strengthens recall." />
          </div>
        );

      case "definition":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-base leading-relaxed"
              style={{ color: c.bodyText }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {block.definition}
            </motion.p>
            {block.pronunciation && (
              <motion.div
                className="flex items-center gap-3 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <SpeakButton text={block.term_title} size="sm" label="Hear it" onComplete={handleAudioComplete} />
                <span className="text-sm italic" style={{ color: c.subtext }}>/{block.pronunciation}/</span>
              </motion.div>
            )}
            {block.video_url && <VideoPlayer url={block.video_url} />}
          </div>
        );

      case "breakdown":
        return (
          <div className="space-y-3">
            {block.pronunciation && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SpeakButton text={block.term_title} size="sm" label="Hear pronunciation" onComplete={handleAudioComplete} />
                <span className="text-base font-medium italic" style={{ color: c.subtext }}>/{block.pronunciation}/</span>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(30 85% 45%)" }}>Word Structure</p>
              <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                {block.term_title.split(/(?=[A-Z])|[-\s]/).filter(Boolean).map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ color: "hsl(30 60% 60%)" }}> · </span>}
                    <strong style={{ color: "hsl(30 85% 45%)" }}>{part}</strong>
                  </span>
                ))}
              </p>
              <p className="text-sm leading-relaxed mt-2" style={{ color: c.bodyText }}>
                Understanding the parts of this term helps you decode similar words on the exam.
              </p>
            </motion.div>
            <SpeakButton text={getSpeakText("breakdown")} size="sm" label="Listen to breakdown" onComplete={handleAudioComplete} />
            <BrainNote text="Breaking words into parts activates your brain's analytical processing, making complex terms easier to decode and remember." />
          </div>
        );

      case "recognize":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-sm font-medium"
              style={{ color: c.termHeading }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Which of these best describes <strong>{block.term_title}</strong>?
            </motion.p>
            <div className="grid grid-cols-2 gap-2">
              {identityItems.map((item, i) => {
                const isCorrect = i === 0; // first item is the primary identity
                const isSelected = recognizeSelected === i;
                let bg = "hsl(var(--card))";
                let border = "hsl(var(--border))";
                if (recognizeRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                else if (recognizeRevealed && isSelected) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
                else if (recognizeRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }

                return (
                  <motion.button
                    key={i}
                    onClick={() => {
                      if (!recognizeRevealed) {
                        setRecognizeSelected(i);
                        setRecognizeRevealed(true);
                      }
                    }}
                    className="p-3 rounded-xl text-sm font-medium text-center transition-all"
                    style={{ background: bg, border: `2px solid ${border}`, color: c.termHeading }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ scale: recognizeRevealed ? 1 : 1.03 }}
                    disabled={recognizeRevealed}
                  >
                    {String(item)}
                    {recognizeRevealed && isCorrect && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1.5" style={{ color: "hsl(145 40% 45%)" }} />}
                    {recognizeRevealed && isSelected && !isCorrect && <XCircle className="inline h-3.5 w-3.5 ml-1.5" style={{ color: "hsl(0 60% 50%)" }} />}
                  </motion.button>
                );
              })}
            </div>
            {recognizeRevealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <BrainNote text="These identity words capture the essence of this concept. Use them as mental anchors when you see this term on the exam." />
              </motion.div>
            )}
          </div>
        );

      case "metaphor":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-base leading-relaxed italic"
              style={{ color: c.bodyText }}
              initial={{ opacity: 0, rotate: -1 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.4 }}
            >
              {block.metaphor}
            </motion.p>
            <SpeakButton text={`${block.term_title}. ${block.metaphor}`} size="sm" label="Listen" onComplete={handleAudioComplete} />
          </div>
        );

      case "information":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-base leading-relaxed"
              style={{ color: c.bodyText }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {block.affirmation}
            </motion.p>
            <SpeakButton text={block.affirmation} size="sm" label="Hear affirmation" onComplete={handleAudioComplete} />
            <BrainNote text="Affirmations activate your limbic system and build emotional confidence around what you're learning." />
          </div>
        );

      case "reflection":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-sm font-medium leading-relaxed"
              style={{ color: c.termHeading }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {block.reflection_prompt}
            </motion.p>
            <div className="relative">
              <Textarea
                placeholder="Pause and reflect… Write 1–2 sentences."
                value={reflectionText}
                onChange={(e) => { setReflectionText(e.target.value); setReflectionSubmitted(false); }}
                disabled={reflectionSubmitted}
                className="min-h-[90px] text-sm resize-none pr-10"
                style={{ color: c.bodyText }}
              />
              {!reflectionSubmitted && (
                <div className="absolute right-1 bottom-1">
                  <SpeechToTextButton onTranscript={(text) => setReflectionText(prev => prev ? `${prev} ${text}` : text)} />
                </div>
              )}
            </div>
            {!reflectionSubmitted ? (
              <Button size="sm" onClick={async () => {
                setReflectionSubmitted(true);
                if (mode === "builtin" && user) {
                  await supabase.from("reflections").upsert(
                    { user_id: user.id, term_id: block.id, response: reflectionText, updated_at: new Date().toISOString() },
                    { onConflict: "user_id,term_id" }
                  );
                }
                if (!reflectionCoinAwarded.current) { reflectionCoinAwarded.current = true; addCoins(3, "reflection"); }
              }}
                disabled={!reflectionText.trim()} className="w-full" style={{ background: step.color, color: "hsl(0 0% 100%)" }}>
                Save My Reflection
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(145 40% 45%)" }} />
                  <span className="text-sm font-medium" style={{ color: "hsl(145 40% 45%)" }}>Reflection saved</span>
                </div>
                <BrainNote text="Pausing to reflect helps move information from short-term to long-term memory." />
                <button onClick={() => setReflectionSubmitted(false)} className="text-xs underline" style={{ color: c.subtext }}>Edit</button>
              </motion.div>
            )}
          </div>
        );

      case "practice":
        return (
          <div className="space-y-3">
            <motion.p
              className="text-base leading-relaxed"
              style={{ color: c.bodyText }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              {block.practice_scenario}
            </motion.p>
            {/* Journal area for apply step */}
            <div className="relative mt-2">
              <Textarea
                placeholder="Write your notes here…"
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                className="min-h-[80px] text-sm resize-none pr-10"
                style={{ color: c.bodyText }}
              />
              <div className="absolute right-1 bottom-1">
                <SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} />
              </div>
            </div>
            {journalSaving && <p className="text-xs" style={{ color: c.subtext }}>Saving…</p>}
            {!journalSaving && journalNote && <p className="text-xs" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
            <BrainNote text="Applying concepts to real scenarios builds neural connections for the salon and state board exam." />
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-4">
            {block.quiz_question && block.quiz_options.length > 0 && (
              <div className="space-y-3">
                <motion.p
                  className="text-sm font-medium leading-relaxed"
                  style={{ color: c.termHeading }}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {block.quiz_question}
                </motion.p>
                <div className="space-y-2">
                  {block.quiz_options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = quizSelected === letter;
                    const isCorrect = String(opt) === block.quiz_answer;
                    let bg = "hsl(var(--card))";
                    let border = "hsl(var(--border))";
                    if (quizRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                    else if (quizRevealed && isSelected && !isCorrect) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
                    else if (quizRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                    return (
                      <motion.button
                        key={i}
                        onClick={() => { if (!quizRevealed) { setQuizSelected(letter); setQuizRevealed(true); } }}
                        className="w-full text-left p-3 rounded-lg text-sm transition-all"
                        style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                        disabled={quizRevealed}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.05 }}
                      >
                        <span className="font-semibold mr-2">{letter})</span> {String(opt)}
                        {quizRevealed && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 40% 45%)" }} />}
                        {quizRevealed && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />}
                      </motion.button>
                    );
                  })}
                </div>
                {quizRevealed && (
                  <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>
                    Try Again
                  </Button>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative space-y-3">
      {/* Instructor Notes */}
      {block.instructor_notes && (
        <Collapsible className="mb-1">
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

      {/* Term Header */}
      <div className="flex items-center justify-between">
        <motion.h2
          className="font-display text-2xl font-bold"
          style={{ color: c.heading }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {block.term_title}
        </motion.h2>
        <button
          onClick={toggleSounds}
          className="p-1.5 rounded-full transition-colors hover:bg-muted/60"
          title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
          style={{ color: soundsEnabled ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
        >
          {soundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: c.subtext }}>
            Step {completedSteps.size} of {activeSteps.length}
            {allCompleted && " — ✨ Complete!"}
          </p>
          <p className="text-xs font-semibold" style={{ color: allCompleted ? "hsl(145 50% 42%)" : "hsl(var(--primary))" }}>
            {Math.round(progressPercent)}%
          </p>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Completion State */}
      <AnimatePresence>
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "hsl(145 40% 94%)", border: "1px solid hsl(145 40% 80%)" }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <CheckCircle2 className="h-6 w-6" style={{ color: "hsl(145 50% 42%)" }} />
            </motion.div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "hsl(145 35% 25%)" }}>Concept Mastered!</p>
              <p className="text-xs" style={{ color: "hsl(145 20% 40%)" }}>You've completed all learning layers for {block.term_title}.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Cards */}
      <div className="space-y-2.5">
        {activeSteps.map((step, index) => {
          const unlocked = isStepUnlocked(index);
          const isCompleted = completedSteps.has(step.key);
          const isExpanded = expandedStep === step.key;
          const isLast = index === activeSteps.length - 1;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: unlocked ? 1 : 0.45, y: 0 }}
              transition={{ delay: 0.03 * index, duration: 0.3 }}
            >
              <Card
                className="border overflow-hidden transition-all duration-300"
                style={{
                  borderColor: isExpanded ? step.color : isCompleted ? "hsl(145 40% 75%)" : unlocked ? step.borderColor : "hsl(var(--border))",
                  boxShadow: isExpanded
                    ? `0 8px 32px -4px ${step.glowColor}, 0 2px 8px -2px hsl(var(--foreground) / 0.06)`
                    : isCompleted
                    ? "0 1px 4px hsl(145 40% 42% / 0.08)"
                    : unlocked
                    ? "0 2px 12px -3px hsl(var(--foreground) / 0.08)"
                    : "none",
                  opacity: unlocked ? 1 : 0.45,
                  filter: !unlocked ? "grayscale(0.4)" : isCompleted && !isExpanded ? "saturate(0.7)" : "none",
                }}
              >
                {/* Step Header (always visible) */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left transition-all duration-300"
                  style={{
                    background: isExpanded
                      ? `linear-gradient(135deg, ${step.bgColor}, hsl(0 0% 100%))`
                      : "transparent",
                  }}
                  onClick={() => handleStepTap(step, index)}
                  disabled={!unlocked}
                >
                  {/* Step number / icon */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background: isCompleted
                        ? "hsl(145 40% 92%)"
                        : isExpanded
                        ? step.gradient
                        : unlocked
                        ? step.bgColor
                        : "hsl(var(--muted))",
                      color: isCompleted
                        ? "hsl(145 50% 42%)"
                        : isExpanded
                        ? "hsl(0 0% 100%)"
                        : unlocked
                        ? step.color
                        : "hsl(var(--muted-foreground))",
                      border: `1.5px solid ${isCompleted ? "hsl(145 40% 75%)" : isExpanded ? step.color : unlocked ? step.color + "33" : "transparent"}`,
                      boxShadow: isExpanded ? `0 0 12px ${step.glowColor}` : "none",
                    }}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4.5 w-4.5" /> : unlocked ? step.icon : <Lock className="h-4 w-4" />}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold transition-colors duration-200"
                      style={{
                        color: isExpanded
                          ? step.color
                          : isCompleted
                          ? "hsl(145 30% 38%)"
                          : unlocked
                          ? c.termHeading
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      Step {index + 1}: {step.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{
                      color: isCompleted && !isExpanded
                        ? "hsl(145 25% 55%)"
                        : isExpanded
                        ? step.color + "cc"
                        : "hsl(var(--muted-foreground))",
                    }}>
                      {isCompleted && !isExpanded ? "✓ Completed" : step.subtitle}
                    </p>
                  </div>

                  {/* Expand indicator */}
                  {unlocked && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" style={{ color: isExpanded ? step.color : c.subtext }} />
                    </motion.div>
                  )}
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 pb-4 px-4">
                        <div className="border-t pt-4" style={{ borderColor: step.borderColor }}>
                          <motion.p
                            className="text-xs italic mb-3"
                            style={{ color: step.color + "bb" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.05 }}
                          >
                            {step.guidedIntro}
                          </motion.p>
                          {renderStepContent(step)}

                          {/* Complete & Continue button */}
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 flex justify-end"
                          >
                            <Button
                              size="sm"
                              className="gap-2 shadow-md transition-shadow hover:shadow-lg"
                              style={{ background: step.gradient, color: "hsl(0 0% 100%)" }}
                              onClick={() => handleCompleteAndNext(step.key)}
                            >
                              {isLast ? "Complete" : "Continue"}
                              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningOrb;
