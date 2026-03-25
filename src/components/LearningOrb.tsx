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
import tjBackground from "@/assets/tj-background.jpg";

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
  { key: "quiz",        label: "Assess",          subtitle: "State Board exam readiness",             neuroExplanation: "Triggers the testing effect — retrieval under pressure consolidates long-term memory better than re-reading. This question mirrors the format you'll see on the State Board Cosmetology Exam.", icon: <GraduationCap className="h-4 w-4" />, color: "hsl(0 75% 45%)",   bgColor: "hsl(0 55% 95%)",   borderColor: "hsl(0 55% 72%)",   gradient: "linear-gradient(135deg, hsl(0 75% 45%), hsl(10 80% 50%))",   glowColor: "hsl(0 75% 45% / 0.4)",    guidedIntro: "Time for a State Board–style question… let's see if you're exam-ready." },
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

  const [activeTab, setActiveTab] = useState<StepKey | null>(null);
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
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const activeSteps = useMemo(() => {
    const identityItems = Array.isArray(block.concept_identity) ? block.concept_identity : [];
    return stepConfigs.filter(s => {
      if (s.key === "recognize" && identityItems.length === 0) return false;
      if (s.key === "practice" && !block.practice_scenario) return false;
      if (s.key === "breakdown" && !block.pronunciation && !block.definition) return false;
      return true;
    });
  }, [block.concept_identity, block.practice_scenario, block.pronunciation, block.definition]);

  // Auto-open first step
  useEffect(() => {
    if (activeSteps.length > 0 && activeTab === null) {
      setActiveTab(activeSteps[0].key);
    }
  }, [activeSteps, activeTab]);

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
    const key = `${block.id}-${activeTab}`;
    if (!audioCoinAwarded.current.has(key)) {
      audioCoinAwarded.current.add(key);
      addCoins(2, "audio");
    }
  }, [block.id, activeTab, addCoins]);

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

  const handleTabTap = (step: StepConfig, index: number) => {
    if (!isStepUnlocked(index)) return;
    if (soundsEnabled) playChimeSound();
    setActiveTab(step.key);
  };

  const handleCompleteAndNext = (currentKey: StepKey) => {
    markStepComplete(currentKey);
    const currentIndex = activeSteps.findIndex(s => s.key === currentKey);
    if (currentIndex < activeSteps.length - 1) {
      const nextStep = activeSteps[currentIndex + 1];
      if (soundsEnabled) playChimeSound();
      setActiveTab(nextStep.key);
    } else {
      setActiveTab(null);
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

  const activeStepConfig = activeTab ? activeSteps.find(s => s.key === activeTab) : null;
  const activeStepIndex = activeTab ? activeSteps.findIndex(s => s.key === activeTab) : -1;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)" }}>
      {/* TJ Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.15, filter: "brightness(1.1)" }}
      />
      <div className="relative z-10 p-4 sm:p-6">

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

        {/* Term Title + Speaker */}
        <div className="flex items-center gap-3 mb-2">
          <h2
            className="font-display text-3xl sm:text-4xl font-bold leading-tight break-words"
            style={{ color: c.heading }}
          >
            {block.term_title}
          </h2>
          <SpeakButton text={block.term_title} size="sm" label="Listen" onComplete={handleAudioComplete} />
        </div>

        {block.pronunciation && (
          <p className="text-sm italic mb-3" style={{ color: c.subtext }}>
            /{block.pronunciation}/
          </p>
        )}

        {/* Progress */}
        <div className="space-y-1 mb-4">
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

        {/* === HORIZONTAL SCROLLABLE TABS === */}
        <div
          ref={tabScrollRef}
          className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {activeSteps.map((step, index) => {
            const unlocked = isStepUnlocked(index);
            const isCompleted = completedSteps.has(step.key);
            const isActive = activeTab === step.key;

            return (
              <button
                key={step.key}
                onClick={() => handleTabTap(step, index)}
                disabled={!unlocked}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
                style={{
                  background: isActive
                    ? step.gradient
                    : isCompleted
                    ? "hsl(145 30% 92%)"
                    : unlocked
                    ? step.bgColor
                    : "hsl(var(--muted) / 0.5)",
                  color: isActive
                    ? "hsl(0 0% 100%)"
                    : isCompleted
                    ? "hsl(145 40% 35%)"
                    : unlocked
                    ? step.color
                    : "hsl(var(--muted-foreground))",
                  border: `1.5px solid ${
                    isActive
                      ? step.color
                      : isCompleted
                      ? "hsl(145 40% 70%)"
                      : unlocked
                      ? step.borderColor
                      : "hsl(var(--border))"
                  }`,
                  boxShadow: isActive
                    ? `0 2px 12px ${step.glowColor}`
                    : "none",
                  cursor: unlocked ? "pointer" : "not-allowed",
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : unlocked ? step.icon : <Lock className="h-3 w-3" />}
                {step.label}
              </button>
            );
          })}
        </div>

        {/* === TAB CONTENT PANEL === */}
        <AnimatePresence mode="wait">
          {activeStepConfig && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                className="border-2 overflow-hidden"
                style={{
                  borderColor: activeStepConfig.color,
                  boxShadow: `0 4px 20px -4px ${activeStepConfig.glowColor}, 0 1px 6px hsl(var(--foreground) / 0.04)`,
                  background: "hsl(var(--card))",
                }}
              >
                <CardContent className="p-4 sm:p-5">
                  {/* Guided intro */}
                  <motion.p
                    className="text-xs italic mb-3"
                    style={{ color: activeStepConfig.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 }}
                  >
                    {activeStepConfig.guidedIntro}
                  </motion.p>

                  {/* Step content */}
                  <StepContent
                    stepKey={activeStepConfig.key}
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
                    stepColor={activeStepConfig.color}
                  />

                  {/* Neuroscience callout */}
                  <motion.div
                    className="mt-4 p-3 rounded-lg"
                    style={{
                      background: activeStepConfig.bgColor,
                      border: `1px solid ${activeStepConfig.borderColor}`,
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: activeStepConfig.color }}>
                      🧠 Why This Step Matters
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: c.bodyText }}>
                      {activeStepConfig.neuroExplanation}
                    </p>
                  </motion.div>

                  {/* Continue button */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-4 flex justify-end"
                  >
                    <Button
                      size="sm"
                      className="gap-2 shadow-md transition-shadow hover:shadow-lg"
                      style={{ background: activeStepConfig.gradient, color: "hsl(0 0% 100%)" }}
                      onClick={() => handleCompleteAndNext(activeStepConfig.key)}
                    >
                      {activeStepIndex === activeSteps.length - 1 ? "Complete" : "Continue"}
                      {activeStepIndex < activeSteps.length - 1 && <ArrowRight className="h-3.5 w-3.5" />}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion badge */}
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 flex justify-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "hsl(145 40% 92%)", border: "1px solid hsl(145 40% 75%)" }}
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 50% 42%)" }} />
                </motion.div>
                <span className="text-sm font-semibold" style={{ color: "hsl(145 35% 25%)" }}>Concept Mastered!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LearningOrb;
