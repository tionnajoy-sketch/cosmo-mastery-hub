import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RefreshCw, Sparkles,
  Loader2, CheckCircle2, XCircle, Volume2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { pageColors } from "@/lib/colors";
import { fireBlockCompleteConfetti } from "@/lib/confetti";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import VideoPlayer from "@/components/VideoPlayer";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";

const c = pageColors.study;

/* ─── Step configuration ─── */
interface StepDef {
  key: string;
  label: string;
  color: string;
  gradient: string;
  caption: string;
}

const STEPS: StepDef[] = [
  {
    key: "definition",
    label: "Definition",
    color: "hsl(45 90% 40%)",
    gradient: "linear-gradient(135deg, hsl(45 90% 40%), hsl(38 95% 48%))",
    caption: "Let's start here… understanding the meaning.",
  },
  {
    key: "visual",
    label: "Visual",
    color: "hsl(215 80% 42%)",
    gradient: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))",
    caption: "Now let's see it… a picture is worth a thousand words.",
  },
  {
    key: "metaphor",
    label: "Metaphor",
    color: "hsl(265 72% 48%)",
    gradient: "linear-gradient(135deg, hsl(265 72% 48%), hsl(255 78% 54%))",
    caption: "Stay with me… this part is where it clicks.",
  },
  {
    key: "apply",
    label: "Apply",
    color: "hsl(145 65% 32%)",
    gradient: "linear-gradient(135deg, hsl(145 65% 32%), hsl(155 70% 38%))",
    caption: "You're doing great… now put your knowledge to work.",
  },
  {
    key: "quickcheck",
    label: "Quick Check",
    color: "hsl(0 75% 45%)",
    gradient: "linear-gradient(135deg, hsl(0 75% 45%), hsl(10 80% 50%))",
    caption: "Let's see if you're exam-ready…",
  },
];

/* ─── Sounds ─── */
const playChime = () => {
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

const playCelebration = () => {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
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

/* ─── Props ─── */
interface LearningOrbDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: UploadedBlock | null;
  onNotesChange: (blockId: string, notes: string) => void;
  mode?: "uploaded" | "builtin";
  blockIndex?: number;
  onComplete?: () => void;
}

/* ─── Main Component ─── */
const LearningOrbDialog = ({
  open,
  onOpenChange,
  block,
  onNotesChange,
  mode = "uploaded",
  blockIndex = 0,
  onComplete,
}: LearningOrbDialogProps) => {
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled } = useSoundsEnabled();

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Visual
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // Apply
  const [journalNote, setJournalNote] = useState("");
  const [journalSaving, setJournalSaving] = useState(false);

  // Quick Check
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<{ question: string; options: string[]; answer: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const completedRef = useRef(false);

  // Reset state when block changes
  useEffect(() => {
    if (block) {
      setCurrentStep(0);
      setCompleted(false);
      setImageUrl(block.image_url || "");
      setJournalNote(block.user_notes || "");
      setQuizSelected(null);
      setQuizRevealed(false);
      setAiQuestion(null);
      completedRef.current = false;
    }
  }, [block?.id]);

  // Load saved data for builtin
  useEffect(() => {
    if (!block || mode !== "builtin" || !user) return;
    supabase.from("journal_notes").select("note").eq("user_id", user.id).eq("term_id", block.id).single().then(({ data }) => {
      if (data) setJournalNote(data.note);
    });
    supabase.from("term_images").select("image_url").eq("term_id", block.id).single().then(({ data }) => {
      if (data) setImageUrl(data.image_url);
    });
  }, [mode, user, block?.id]);

  // Auto-save journal
  useEffect(() => {
    if (!user || !block || !journalNote) return;
    const timeout = setTimeout(async () => {
      setJournalSaving(true);
      if (mode === "uploaded") {
        await supabase.from("uploaded_module_blocks").update({ user_notes: journalNote }).eq("id", block.id);
        onNotesChange(block.id, journalNote);
      } else {
        await supabase.from("journal_notes").upsert(
          { user_id: user.id, term_id: block.id, note: journalNote, updated_at: new Date().toISOString() },
          { onConflict: "user_id,term_id" }
        );
      }
      setJournalSaving(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [journalNote, block?.id, user, mode]);

  if (!block) return null;

  const step = STEPS[currentStep];
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      if (soundsEnabled) playChime();
      setCurrentStep((s) => s + 1);
    } else {
      // Completed all steps
      if (!completedRef.current) {
        completedRef.current = true;
        addCoins(15, "block_complete");
        fireBlockCompleteConfetti();
        if (soundsEnabled) playCelebration();
      }
      setCompleted(true);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
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
    } catch (e) {
      console.error("Image generation failed:", e);
    } finally {
      setImageLoading(false);
    }
  };

  const generateQuizQuestion = async () => {
    setAiLoading(true);
    try {
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Create a State Board Cosmetology exam-style multiple choice question about "${block.term_title}". Definition: "${block.definition}". Respond ONLY with JSON: {"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"the full text of the correct option"}. No markdown.`,
          }],
          sectionName: "State Board Quiz",
        },
      });
      const text = data?.response || data?.choices?.[0]?.message?.content || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) setAiQuestion(JSON.parse(match[0]));
    } catch {}
    setAiLoading(false);
  };

  // Auto-generate quiz when reaching quick check step
  useEffect(() => {
    if (step?.key === "quickcheck" && !block.quiz_question && !aiQuestion && !aiLoading) {
      generateQuizQuestion();
    }
  }, [currentStep]);

  const hasBuiltinQuiz = block.quiz_question && block.quiz_options?.length > 0;
  const quizQuestion = hasBuiltinQuiz ? block.quiz_question : aiQuestion?.question;
  const quizOptions = hasBuiltinQuiz ? block.quiz_options.map(String) : (aiQuestion?.options || []);
  const quizAnswer = hasBuiltinQuiz ? block.quiz_answer : (aiQuestion?.answer || "");

  /* ─── Render Center Content ─── */
  const renderContent = () => {
    switch (step.key) {
      case "definition":
        return (
          <motion.div
            key="definition"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center text-center space-y-6 py-6"
          >
            <h2
              className="font-display text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: step.color }}
            >
              {block.term_title}
            </h2>
            <div className="w-16 h-0.5 rounded-full" style={{ background: step.gradient }} />
            <p
              className="text-lg sm:text-xl leading-relaxed max-w-lg"
              style={{ color: c.bodyText }}
            >
              {block.definition}
            </p>
            <SpeakButton
              text={`${block.term_title}. ${block.definition}`}
              size="sm"
              label="Listen"
            />
          </motion.div>
        );

      case "visual":
        return (
          <motion.div
            key="visual"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center text-center space-y-5 py-4"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Visual for ${block.term_title}`}
                className="w-full max-w-md rounded-2xl shadow-lg"
              />
            ) : imageLoading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating illustration…</p>
              </div>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={generateImage}
                className="gap-2"
                style={{ borderColor: step.color, color: step.color }}
              >
                <Sparkles className="h-4 w-4" /> Generate Visual
              </Button>
            )}
            {block.visualization_desc && (
              <p className="text-sm max-w-md" style={{ color: c.subtext }}>
                {block.visualization_desc}
              </p>
            )}
            {block.video_url && <VideoPlayer url={block.video_url} />}
          </motion.div>
        );

      case "metaphor":
        return (
          <motion.div
            key="metaphor"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center text-center space-y-6 py-8"
          >
            <div
              className="text-5xl sm:text-6xl mb-2"
              style={{ color: step.color }}
            >
              "
            </div>
            <p
              className="text-xl sm:text-2xl leading-relaxed italic max-w-lg font-display"
              style={{ color: c.bodyText }}
            >
              {block.metaphor || "Think of this concept as a bridge connecting what you know to what you're learning."}
            </p>
            <SpeakButton
              text={block.metaphor || block.definition}
              size="sm"
              label="Listen"
            />
          </motion.div>
        );

      case "apply":
        return (
          <motion.div
            key="apply"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5 py-4"
          >
            <p
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: c.bodyText }}
            >
              {block.practice_scenario ||
                `Imagine you're in the salon and a client asks about ${block.term_title}. How would you explain it in your own words?`}
            </p>
            <div className="relative">
              <textarea
                placeholder="Write your response here…"
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
                className="w-full min-h-[120px] p-4 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  borderColor: "hsl(var(--border))",
                  color: c.bodyText,
                  background: "hsl(var(--card))",
                }}
              />
              <div className="absolute right-2 bottom-2">
                <SpeechToTextButton
                  onTranscript={(text) =>
                    setJournalNote((prev) => (prev ? `${prev} ${text}` : text))
                  }
                />
              </div>
            </div>
            {journalSaving && (
              <p className="text-xs" style={{ color: c.subtext }}>Saving…</p>
            )}
            {!journalSaving && journalNote && (
              <p className="text-xs" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>
            )}
          </motion.div>
        );

      case "quickcheck":
        return (
          <motion.div
            key="quickcheck"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-5 py-4"
          >
            <div
              className="px-4 py-3 rounded-xl text-center"
              style={{
                background: "linear-gradient(135deg, hsl(0 50% 97%), hsl(0 40% 94%))",
                border: "1.5px solid hsl(0 40% 85%)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: step.color }}>
                🎓 State Board Practice Question
              </p>
            </div>

            {aiLoading && (
              <div className="flex items-center justify-center gap-3 py-10">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating question…</p>
              </div>
            )}

            {quizQuestion && quizOptions.length > 0 && (
              <div className="space-y-4">
                <p className="text-base font-medium leading-relaxed" style={{ color: c.bodyText }}>
                  {quizQuestion}
                </p>
                <div className="space-y-2.5">
                  {quizOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const optText = String(opt).replace(/^[A-D]\)\s*/, "");
                    const isSelected = quizSelected === letter;
                    const isCorrect = String(opt) === quizAnswer || optText === quizAnswer;
                    let bg = "hsl(var(--card))";
                    let border = "hsl(var(--border))";
                    if (quizRevealed && isSelected && isCorrect) {
                      bg = "hsl(145 40% 92%)";
                      border = "hsl(145 45% 45%)";
                    } else if (quizRevealed && isSelected) {
                      bg = "hsl(0 60% 94%)";
                      border = "hsl(0 60% 50%)";
                    } else if (quizRevealed && isCorrect) {
                      bg = "hsl(145 40% 92%)";
                      border = "hsl(145 45% 45%)";
                    }
                    return (
                      <motion.button
                        key={i}
                        onClick={() => {
                          if (!quizRevealed) {
                            setQuizSelected(letter);
                            setQuizRevealed(true);
                          }
                        }}
                        className="w-full text-left p-4 rounded-xl text-sm font-medium transition-all"
                        style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                        disabled={quizRevealed}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <span className="font-bold mr-2">{letter})</span> {optText}
                        {quizRevealed && isCorrect && (
                          <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 45% 45%)" }} />
                        )}
                        {quizRevealed && isSelected && !isCorrect && (
                          <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {quizRevealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 pt-1"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setQuizSelected(null);
                        setQuizRevealed(false);
                      }}
                    >
                      Try Again
                    </Button>
                    {!hasBuiltinQuiz && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAiQuestion(null);
                          setQuizSelected(null);
                          setQuizRevealed(false);
                          generateQuizQuestion();
                        }}
                        style={{ borderColor: step.color, color: step.color }}
                      >
                        New Question
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {!hasBuiltinQuiz && !aiQuestion && !aiLoading && (
              <div className="text-center py-6">
                <Button
                  onClick={generateQuizQuestion}
                  className="gap-2"
                  style={{ background: step.gradient, color: "white" }}
                >
                  🎓 Generate Question
                </Button>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  /* ─── Completion Screen ─── */
  if (completed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="fixed inset-0 max-w-none w-screen h-screen m-0 p-0 gap-0 border-0 rounded-none translate-x-0 translate-y-0 top-0 left-0 data-[state=open]:slide-in-from-bottom-0"
          style={{ background: "hsl(var(--background))" }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.12 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.88) 0%, hsl(0 0% 98% / 0.92) 100%)" }} />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 space-y-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <CheckCircle2 className="h-20 w-20 mx-auto" style={{ color: "hsl(145 55% 42%)" }} />
            </motion.div>
            <motion.h2
              className="font-display text-3xl sm:text-4xl font-bold"
              style={{ color: c.heading }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              You made it. 🎉
            </motion.h2>
            <motion.p
              className="text-lg max-w-md"
              style={{ color: c.subtext }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Now let's connect everything.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3"
            >
              <Button
                size="lg"
                className="gap-2 text-base px-8 py-6 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(265 72% 48%), hsl(215 80% 42%))",
                  color: "white",
                }}
                onClick={() => {
                  onOpenChange(false);
                  // Navigate to Cosmo Grid would go here
                }}
              >
                <Sparkles className="h-5 w-5" /> Launch Cosmo Connection Grid™
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-sm"
                style={{ color: c.subtext }}
              >
                Back to Terms
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─── Main Layout ─── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-0 max-w-none w-screen h-screen m-0 p-0 gap-0 border-0 rounded-none translate-x-0 translate-y-0 top-0 left-0 data-[state=open]:slide-in-from-bottom-0"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Subtle BG */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.06, filter: "brightness(1.2)" }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.94) 0%, hsl(0 0% 98% / 0.96) 100%)" }} />

        <div className="relative z-10 h-full flex flex-col">
          {/* ═══════ TOP SECTION ═══════ */}
          <div
            className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b"
            style={{
              background: "hsl(var(--background) / 0.95)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Avatar + Caption Row */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-11 w-11 ring-2 ring-offset-1 flex-shrink-0" style={{ ringColor: step.color }}>
                <AvatarImage src={tjBackground} alt="Tionna Joy" className="object-cover" />
                <AvatarFallback className="text-xs font-bold" style={{ background: step.color, color: "white" }}>TJ</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs italic leading-snug" style={{ color: step.color }}>
                  "{step.caption}"
                </p>
              </div>
            </div>

            {/* Term + Category + Progress */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold truncate" style={{ color: c.heading }}>
                  {block.term_title}
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.subtext }}>
                  Cosmetology
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-semibold" style={{ color: step.color }}>
                  Step {currentStep + 1} of {STEPS.length}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <Progress
                value={progressPercent}
                className="h-1.5"
                style={{
                  // @ts-ignore
                  "--tw-progress-color": step.color,
                }}
              />
            </div>

            {/* Step indicator pills */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStep ? 28 : 8,
                    background: i <= currentStep ? s.color : "hsl(var(--border))",
                    opacity: i <= currentStep ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ═══════ CENTER SECTION ═══════ */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8">
            <div className="max-w-lg mx-auto">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </div>
          </div>

          {/* ═══════ BOTTOM SECTION ═══════ */}
          <div
            className="flex-shrink-0 px-4 sm:px-6 py-3 border-t"
            style={{
              background: "hsl(var(--background) / 0.96)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              {/* Back */}
              <Button
                variant="ghost"
                size="sm"
                onClick={currentStep === 0 ? () => onOpenChange(false) : goBack}
                className="gap-1.5 text-sm"
                style={{ color: c.subtext }}
              >
                <ArrowLeft className="h-4 w-4" />
                {currentStep === 0 ? "Back" : "Previous"}
              </Button>

              {/* Explain Again */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs hidden sm:flex"
                style={{ color: c.subtext }}
                onClick={() => {
                  // Reset current step state
                  if (step.key === "quickcheck") {
                    setQuizSelected(null);
                    setQuizRevealed(false);
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Explain Again
              </Button>

              {/* Next / Complete */}
              <Button
                size="sm"
                className="gap-1.5 text-sm px-5 shadow-md"
                style={{ background: step.gradient, color: "white" }}
                onClick={goNext}
              >
                {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
                {currentStep < STEPS.length - 1 && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            {/* Mobile progress text */}
            <p className="text-center text-[10px] mt-1.5 sm:hidden" style={{ color: c.subtext }}>
              Step {currentStep + 1} of {STEPS.length} · {step.label}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOrbDialog;
