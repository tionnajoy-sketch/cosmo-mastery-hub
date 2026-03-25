import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, StickyNote, Loader2, BookOpen, Eye,
  Lightbulb, Heart, PenLine, Wrench, GraduationCap, Mic,
  HelpCircle, Fingerprint, Volume2, VolumeX,
  Lock, ArrowRight, X,
} from "lucide-react";
import { pageColors } from "@/lib/colors";
import { fireBlockCompleteConfetti } from "@/lib/confetti";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SpeakButton from "@/components/SpeakButton";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import StepContent from "@/components/LearningOrbStepContent";

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
  neuroExplanation: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  glowColor: string;
  guidedIntro: string;
}

export const stepConfigs: StepConfig[] = [
  { key: "visualize",   label: "Visualize",      subtitle: "Visual cortex & pattern recognition",   neuroExplanation: "Activates the visual cortex to build mental imagery before labeling — your brain remembers pictures faster than words.", icon: <Eye className="h-4 w-4" />,            color: "hsl(215 80% 42%)", bgColor: "hsl(215 60% 95%)", borderColor: "hsl(215 60% 72%)", gradient: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))", glowColor: "hsl(215 80% 42% / 0.4)",  guidedIntro: "Let's start here… see the concept before you define it." },
  { key: "definition",  label: "Define",          subtitle: "Language processing & labeling",         neuroExplanation: "Engages Broca's and Wernicke's areas — language centers that convert raw ideas into structured knowledge.", icon: <BookOpen className="h-4 w-4" />,       color: "hsl(45 90% 40%)",  bgColor: "hsl(45 70% 95%)",  borderColor: "hsl(45 70% 72%)",  gradient: "linear-gradient(135deg, hsl(45 90% 40%), hsl(38 95% 48%))",  glowColor: "hsl(45 90% 40% / 0.4)",   guidedIntro: "Now let me explain… here's the clear, structured meaning." },
  { key: "breakdown",   label: "Break It Down",   subtitle: "Analytical decoding & word roots",       neuroExplanation: "Activates the prefrontal cortex's analytical processing — breaking words into roots creates multiple memory anchors.", icon: <Mic className="h-4 w-4" />,            color: "hsl(30 85% 45%)",  bgColor: "hsl(30 65% 95%)",  borderColor: "hsl(30 65% 72%)",  gradient: "linear-gradient(135deg, hsl(30 85% 45%), hsl(22 90% 52%))",  glowColor: "hsl(30 85% 45% / 0.4)",   guidedIntro: "Let's break this down… understanding the roots helps it stick." },
  { key: "recognize",   label: "Recognize",       subtitle: "Spatial memory & recall",                neuroExplanation: "Engages the hippocampus and parietal cortex — spatial identification strengthens retrieval pathways.", icon: <Fingerprint className="h-4 w-4" />,    color: "hsl(275 70% 50%)", bgColor: "hsl(275 50% 95%)", borderColor: "hsl(275 50% 72%)", gradient: "linear-gradient(135deg, hsl(275 70% 50%), hsl(285 75% 55%))", glowColor: "hsl(275 70% 50% / 0.4)",  guidedIntro: "Can you spot it? Identify the concept visually." },
  { key: "metaphor",    label: "Metaphor",        subtitle: "Limbic system & emotional association",   neuroExplanation: "Activates the limbic system — emotional connections make memories 3x more durable than logic alone.", icon: <Lightbulb className="h-4 w-4" />,      color: "hsl(265 72% 48%)", bgColor: "hsl(265 52% 95%)", borderColor: "hsl(265 52% 72%)", gradient: "linear-gradient(135deg, hsl(265 72% 48%), hsl(255 78% 54%))", glowColor: "hsl(265 72% 48% / 0.4)",  guidedIntro: "Let me connect this to your life… this is where it gets real." },
  { key: "information", label: "Information",     subtitle: "Comprehension & deeper reasoning",       neuroExplanation: "Engages the temporal and frontal lobes for deeper semantic processing — building context around facts.", icon: <Heart className="h-4 w-4" />,          color: "hsl(180 60% 32%)", bgColor: "hsl(180 45% 95%)", borderColor: "hsl(180 45% 72%)", gradient: "linear-gradient(135deg, hsl(180 60% 32%), hsl(190 65% 38%))", glowColor: "hsl(180 60% 32% / 0.4)",  guidedIntro: "Let's go deeper… expanding your understanding." },
  { key: "reflection",  label: "Reflect",         subtitle: "Metacognition & self-awareness",         neuroExplanation: "Activates the default mode network — self-referential thinking embeds knowledge into personal identity.", icon: <PenLine className="h-4 w-4" />,        color: "hsl(220 20% 35%)", bgColor: "hsl(220 12% 95%)", borderColor: "hsl(220 12% 72%)", gradient: "linear-gradient(135deg, hsl(220 20% 35%), hsl(230 25% 42%))", glowColor: "hsl(220 20% 35% / 0.3)", guidedIntro: "Pause and think… internalize what this means to you." },
  { key: "practice",    label: "Apply",           subtitle: "Active recall & problem-solving",        neuroExplanation: "Engages the motor cortex and executive function — applying knowledge strengthens neural pathways through action.", icon: <Wrench className="h-4 w-4" />,         color: "hsl(145 65% 32%)", bgColor: "hsl(145 50% 95%)", borderColor: "hsl(145 50% 72%)", gradient: "linear-gradient(135deg, hsl(145 65% 32%), hsl(155 70% 38%))", glowColor: "hsl(145 65% 32% / 0.4)",  guidedIntro: "You're doing great… now put your knowledge to work." },
  { key: "quiz",        label: "Assess",          subtitle: "Performance & test readiness",           neuroExplanation: "Triggers the testing effect — retrieval under pressure consolidates long-term memory better than re-reading.", icon: <HelpCircle className="h-4 w-4" />,     color: "hsl(0 75% 45%)",   bgColor: "hsl(0 55% 95%)",   borderColor: "hsl(0 55% 72%)",   gradient: "linear-gradient(135deg, hsl(0 75% 45%), hsl(10 80% 50%))",   glowColor: "hsl(0 75% 45% / 0.4)",    guidedIntro: "Show what you know… demonstrate your mastery." },
];

// Vibrant background gradients that rotate per block
const blockBackgrounds = [
  "linear-gradient(160deg, hsl(215 55% 92%), hsl(230 50% 95%), hsl(200 60% 97%))",
  "linear-gradient(160deg, hsl(45 65% 92%), hsl(38 60% 95%), hsl(55 50% 97%))",
  "linear-gradient(160deg, hsl(30 60% 92%), hsl(20 55% 95%), hsl(40 50% 97%))",
  "linear-gradient(160deg, hsl(275 50% 93%), hsl(265 45% 96%), hsl(285 40% 97%))",
  "linear-gradient(160deg, hsl(265 55% 92%), hsl(255 50% 95%), hsl(280 45% 97%))",
  "linear-gradient(160deg, hsl(180 45% 92%), hsl(190 40% 95%), hsl(170 50% 97%))",
  "linear-gradient(160deg, hsl(220 25% 92%), hsl(230 20% 95%), hsl(210 30% 97%))",
  "linear-gradient(160deg, hsl(145 50% 92%), hsl(155 45% 95%), hsl(135 40% 97%))",
  "linear-gradient(160deg, hsl(0 55% 93%), hsl(10 50% 96%), hsl(350 45% 97%))",
  "linear-gradient(160deg, hsl(340 50% 93%), hsl(330 45% 96%), hsl(350 40% 97%))",
];

interface LearningOrbProps {
  block: UploadedBlock;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
  blockIndex?: number;
}

const LearningOrb = ({ block, onNotesChange, mode = "uploaded", blockIndex = 0 }: LearningOrbProps) => {
  const { user } = useAuth();
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

  const isStepUnlocked = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    const prevStep = activeSteps[stepIndex - 1];
    return completedSteps.has(prevStep.key);
  };

  const markStepComplete = (key: StepKey) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(key);
      if (!blockCompleteAwarded.current && activeSteps.every(s => next.has(s.key))) {
        blockCompleteAwarded.current = true;
        addCoins(15, "block_complete");
        fireBlockCompleteConfetti();
        if (soundsEnabled) playCelebrationSound();
      }
      return next;
    });
  };

  const handleNodeTap = (step: StepConfig, index: number) => {
    if (!isStepUnlocked(index)) return;
    if (soundsEnabled) playChimeSound();
    if (expandedStep === step.key) {
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

  const handleReflectionSave = async () => {
    setReflectionSubmitted(true);
    if (mode === "builtin" && user) {
      await supabase.from("reflections").upsert(
        { user_id: user.id, term_id: block.id, response: reflectionText, updated_at: new Date().toISOString() },
        { onConflict: "user_id,term_id" }
      );
    }
    if (!reflectionCoinAwarded.current) { reflectionCoinAwarded.current = true; addCoins(3, "reflection"); }
  };

  const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
  const allCompleted = activeSteps.every(s => completedSteps.has(s.key));
  const progressPercent = (completedSteps.size / activeSteps.length) * 100;

  const expandedStepConfig = expandedStep ? activeSteps.find(s => s.key === expandedStep) : null;
  const expandedStepIndex = expandedStep ? activeSteps.findIndex(s => s.key === expandedStep) : -1;

  // Pick background based on block index
  const bg = blockBackgrounds[blockIndex % blockBackgrounds.length];

  return (
    <div
      className="relative rounded-2xl p-5 sm:p-6"
      style={{ background: bg }}
    >
      {/* Instructor Notes */}
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

      {/* Progress Bar */}
      <div className="space-y-1 mb-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: c.subtext }}>
            Step {completedSteps.size} of {activeSteps.length}
            {allCompleted && " — ✨ Complete!"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSounds}
              className="p-1.5 rounded-full transition-colors hover:bg-muted/60"
              title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
              style={{ color: soundsEnabled ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            >
              {soundsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
            <p className="text-xs font-semibold" style={{ color: allCompleted ? "hsl(145 50% 42%)" : "hsl(var(--primary))" }}>
              {Math.round(progressPercent)}%
            </p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* === CENTRAL TERM BOX — Only the term, no definition === */}
      <Card
        className="relative border-2 overflow-hidden mb-6"
        style={{
          borderColor: allCompleted ? "hsl(145 50% 55%)" : "hsl(var(--border))",
          boxShadow: allCompleted
            ? "0 0 30px hsl(145 50% 42% / 0.15), 0 4px 20px hsl(var(--foreground) / 0.06)"
            : "0 4px 24px hsl(var(--foreground) / 0.08), 0 1px 6px hsl(var(--foreground) / 0.04)",
          background: allCompleted
            ? "linear-gradient(135deg, hsl(145 35% 97%), hsl(var(--card)))"
            : "hsl(var(--card))",
        }}
      >
        <CardContent className="p-8 sm:p-10 text-center">
          <motion.h2
            className="font-display text-4xl sm:text-5xl font-bold leading-tight break-words"
            style={{ color: c.heading }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {block.term_title}
          </motion.h2>

          {block.pronunciation && (
            <p className="text-sm mt-2 italic" style={{ color: c.subtext }}>
              /{block.pronunciation}/
            </p>
          )}

          <div className="mt-3 flex justify-center">
            <SpeakButton text={block.term_title} size="sm" label="Listen" onComplete={handleAudioComplete} />
          </div>

          <AnimatePresence>
            {allCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "hsl(145 40% 92%)", border: "1px solid hsl(145 40% 75%)" }}
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 50% 42%)" }} />
                </motion.div>
                <span className="text-sm font-semibold" style={{ color: "hsl(145 35% 25%)" }}>Concept Mastered!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* === LAYER NODES — Vertical list with spacing and dividers === */}
      <div className="space-y-0">
        {activeSteps.map((step, index) => {
          const unlocked = isStepUnlocked(index);
          const isCompleted = completedSteps.has(step.key);
          const isActive = expandedStep === step.key;
          const isLast = index === activeSteps.length - 1;

          return (
            <div key={step.key}>
              {/* Node row */}
              <motion.button
                className="w-full flex items-center gap-4 py-4 px-3 rounded-xl transition-all"
                onClick={() => handleNodeTap(step, index)}
                disabled={!unlocked}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: unlocked ? 1 : 0.4,
                  y: 0,
                }}
                transition={{ delay: 0.03 * index }}
                style={{
                  background: isActive
                    ? `${step.bgColor}`
                    : "transparent",
                  cursor: unlocked ? "pointer" : "not-allowed",
                }}
              >
                {/* Step number + icon circle */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: isCompleted
                      ? "hsl(145 40% 92%)"
                      : isActive
                      ? step.gradient
                      : unlocked
                      ? step.bgColor
                      : "hsl(var(--muted))",
                    border: `2px solid ${
                      isCompleted
                        ? "hsl(145 40% 65%)"
                        : isActive
                        ? step.color
                        : unlocked
                        ? step.borderColor
                        : "hsl(var(--border))"
                    }`,
                    boxShadow: isActive
                      ? `0 0 16px ${step.glowColor}, 0 0 32px ${step.glowColor}`
                      : isCompleted
                      ? "0 0 8px hsl(145 40% 42% / 0.15)"
                      : "0 2px 8px hsl(var(--foreground) / 0.06)",
                    color: isCompleted
                      ? "hsl(145 50% 42%)"
                      : isActive
                      ? "hsl(0 0% 100%)"
                      : unlocked
                      ? step.color
                      : "hsl(var(--muted-foreground))",
                    filter: !unlocked ? "grayscale(0.5)" : "none",
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : unlocked ? step.icon : <Lock className="h-3.5 w-3.5" />}
                </div>

                {/* Label + subtitle */}
                <div className="flex-1 text-left min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: isActive ? step.color : isCompleted ? "hsl(145 30% 38%)" : unlocked ? c.heading : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {index + 1}. {step.label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color: isCompleted ? "hsl(145 20% 50%)" : unlocked ? c.subtext : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {isCompleted ? "✓ Completed" : step.subtitle}
                  </p>
                </div>

                {/* Arrow */}
                {unlocked && !isCompleted && (
                  <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: isActive ? step.color : c.subtext }} />
                )}
              </motion.button>

              {/* Divider line between nodes */}
              {!isLast && (
                <div className="flex items-center px-3">
                  <div className="w-12 flex justify-center">
                    <div
                      className="w-0.5 h-4"
                      style={{
                        background: isCompleted
                          ? "hsl(145 40% 65%)"
                          : "hsl(var(--border))",
                      }}
                    />
                  </div>
                  <div
                    className="flex-1 h-px ml-4"
                    style={{ background: "hsl(var(--border))" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === EXPANDED STEP PANEL === */}
      <AnimatePresence>
        {expandedStepConfig && (
          <motion.div
            key={expandedStep}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden mt-5"
          >
            <Card
              className="border-2 overflow-hidden"
              style={{
                borderColor: expandedStepConfig.color,
                boxShadow: `0 8px 32px -4px ${expandedStepConfig.glowColor}, 0 2px 8px -2px hsl(var(--foreground) / 0.06)`,
              }}
            >
              {/* Panel Header */}
              <div
                className="flex items-center gap-3 p-4"
                style={{
                  background: `linear-gradient(135deg, ${expandedStepConfig.bgColor}, hsl(0 0% 100%))`,
                  borderBottom: `1px solid ${expandedStepConfig.borderColor}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: expandedStepConfig.gradient, color: "hsl(0 0% 100%)" }}
                >
                  {expandedStepConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: expandedStepConfig.color }}>
                    Step {expandedStepIndex + 1}: {expandedStepConfig.label}
                  </p>
                  <p className="text-xs" style={{ color: expandedStepConfig.color + "aa" }}>
                    {expandedStepConfig.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => {
                    markStepComplete(expandedStepConfig.key);
                    setExpandedStep(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted/60 transition-colors"
                  style={{ color: c.subtext }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Panel Content */}
              <CardContent className="p-4 sm:p-5">
                {/* Guided intro */}
                <motion.p
                  className="text-xs italic mb-3"
                  style={{ color: expandedStepConfig.color + "bb" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                >
                  {expandedStepConfig.guidedIntro}
                </motion.p>

                {/* Neuroscience explanation */}
                <motion.div
                  className="mb-4 p-3 rounded-lg"
                  style={{
                    background: expandedStepConfig.bgColor,
                    border: `1px solid ${expandedStepConfig.borderColor}`,
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: expandedStepConfig.color }}>
                    🧠 Why This Step Matters
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: c.bodyText }}>
                    {expandedStepConfig.neuroExplanation}
                  </p>
                </motion.div>

                <StepContent
                  stepKey={expandedStepConfig.key}
                  block={block}
                  mode={mode}
                  user={user}
                  imageUrl={imageUrl}
                  imageLoading={imageLoading}
                  generateImage={generateImage}
                  videoSuggestions={videoSuggestions}
                  videoLoading={videoLoading}
                  fetchVideoSuggestions={fetchVideoSuggestions}
                  identityItems={identityItems}
                  recognizeSelected={recognizeSelected}
                  setRecognizeSelected={setRecognizeSelected}
                  recognizeRevealed={recognizeRevealed}
                  setRecognizeRevealed={setRecognizeRevealed}
                  reflectionText={reflectionText}
                  setReflectionText={setReflectionText}
                  reflectionSubmitted={reflectionSubmitted}
                  setReflectionSubmitted={setReflectionSubmitted}
                  onReflectionSave={handleReflectionSave}
                  journalNote={journalNote}
                  setJournalNote={setJournalNote}
                  journalSaving={journalSaving}
                  quizSelected={quizSelected}
                  setQuizSelected={setQuizSelected}
                  quizRevealed={quizRevealed}
                  setQuizRevealed={setQuizRevealed}
                  handleAudioComplete={handleAudioComplete}
                  stepColor={expandedStepConfig.color}
                />

                {/* Continue button */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-5 flex justify-end"
                >
                  <Button
                    size="sm"
                    className="gap-2 shadow-md transition-shadow hover:shadow-lg"
                    style={{ background: expandedStepConfig.gradient, color: "hsl(0 0% 100%)" }}
                    onClick={() => handleCompleteAndNext(expandedStepConfig.key)}
                  >
                    {expandedStepIndex === activeSteps.length - 1 ? "Complete" : "Continue"}
                    {expandedStepIndex < activeSteps.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningOrb;
