import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { stopGlobalNarration } from "@/hooks/useAutoNarrate";
import { openTJCafe } from "@/hooks/useStudyBreak";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RefreshCw,
  Loader2, CheckCircle2, XCircle, Volume2, VolumeX,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins, useSoundsEnabled } from "@/hooks/useCoins";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import { useTJTone } from "@/hooks/useTJTone";
import { pageColors } from "@/lib/colors";
import { fireBlockCompleteConfetti } from "@/lib/confetti";
import SpeakButton from "@/components/SpeakButton";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import VideoPlayer from "@/components/VideoPlayer";
import { LayerBlockSection, getBlockOpenState } from "@/components/LayerBlockSection";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";
import ReinforcementDialog from "@/components/ReinforcementDialog";
import { useReinforcement } from "@/hooks/useReinforcement";
import { shuffleOptions } from "@/lib/shuffleOptions";
import LayerBlockNavigator from "@/components/LayerBlockNavigator";
import { setLessonContext, clearLessonContext } from "@/lib/dna/currentLessonContext";
import RecallReconstruction from "@/components/orb-steps/RecallReconstruction";
import StrengthenLayerDialog from "@/components/StrengthenLayerDialog";
import { useBrainStrengths } from "@/hooks/useBrainStrengths";
import { useTJEngine } from "@/hooks/useTJEngine";
import TJFeedbackPanel from "@/components/TJFeedbackPanel";
import type { EngineEvaluation, StageId } from "@/lib/tj-engine";
import { useBehaviorIntake } from "@/hooks/useBehaviorIntake";
import BehaviorIntakeStrip from "@/components/behavior-intake/BehaviorIntakeStrip";
import type { BehaviorSuggestion } from "@/lib/behavior-intake";
import ExplainItBackLayer from "@/components/explain-it-back/ExplainItBackLayer";
import EntryPointGate from "@/components/entry-point/EntryPointGate";
import type { ThinkingPath } from "@/lib/entry-point";
import { BreakdownPointPrompt } from "@/components/breakdown-point/BreakdownPointPrompt";
import {
  REPEATED_STRUGGLE_THRESHOLD,
  resolveBreakdownRoute,
  recordBreakdownPoint,
  loadBreakdownPattern,
  BREAKDOWN_LABEL,
  type BreakdownPoint,
  type BreakdownRouteAction,
} from "@/lib/breakdown-point";
import CognitiveLoadPrompt from "@/components/cognitive-load/CognitiveLoadPrompt";
import {
  computeCognitiveLoad,
  persistCognitiveLoad,
  getSessionId,
  type CognitiveLoad,
  type CognitiveLoadAction,
  type CognitiveLoadReading,
} from "@/lib/cognitive-load";
import {
  computeLearningRhythm,
  persistLearningRhythm,
  emitRhythmChange,
  type LearningRhythmReading,
} from "@/lib/learning-rhythm";
import {
  evaluateBreath,
  persistBreathEvent,
  type BreathResponseChoice,
  type BreathSignals,
} from "@/lib/breath-trigger";
import BreathPrompt from "@/components/breath-trigger/BreathPrompt";

// Map Learning Orb step keys → canonical TJ Engine stage IDs.
const ORB_STEP_TO_TJ_STAGE: Record<string, string> = {
  visual: "visualize",
  definition: "define",
  scripture: "define",
  breakdown: "breakdown",
  recall_reconstruction: "recall_reconstruction",
  recognize: "recognize",
  metaphor: "metaphor",
  information: "information",
  reflection: "reflection",
  application: "application",
  quiz: "assess",
};

const c = pageColors.study;

/* ─── Stable wrapper components (defined at module scope so React doesn't
 *     remount their subtrees on every parent render — critical for inputs
 *     like the Recall Reconstruction textarea to keep focus). ─── */
interface EditorialShellProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  stepColor: string;
  stepWash: string;
  stepGradient: string;
  issueNumber: string;
  stepLabel: string;
  termTitle: string;
  stepIssue: string;
  stepKicker: string;
}

const EditorialShellBase = ({
  children,
  hideHeader = false,
  stepColor,
  stepWash,
  stepGradient,
  issueNumber,
  stepLabel,
  termTitle,
  stepIssue,
  stepKicker,
}: EditorialShellProps) => (
  <div
    className="editorial-spread"
    style={
      {
        "--step-color": stepColor,
        "--step-wash": stepWash,
        "--step-gradient": stepGradient,
      } as React.CSSProperties
    }
  >
    {!hideHeader && (
      <header className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <span className="editorial-eyebrow">
            Layer {issueNumber} · {stepLabel}
          </span>
          <span className="editorial-tag">{termTitle}</span>
        </div>
        <h2 className="editorial-headline">{stepIssue}</h2>
        <p className="editorial-subhead">{stepKicker}</p>
        <hr className="editorial-rule" />
      </header>
    )}
    {children}
  </div>
);

interface StepCardProps {
  num?: string;
  label: string;
  title?: string;
  children: React.ReactNode;
}
const StepCard = ({ num, label, title, children }: StepCardProps) => (
  <article className="editorial-card">
    <div className="editorial-card-header">
      {num && <span className="num">{num}</span>}
      <span className="label">{label}</span>
      {title && <span className="title">{title}</span>}
    </div>
    <div className="editorial-card-body">{children}</div>
  </article>
);

/* ─── 9-Step Configuration ─── */
interface StepDef {
  key: string;
  label: string;
  color: string;
  gradient: string;
  wash: string;        // soft tinted backdrop for the editorial spread
  issue: string;       // editorial title for this step (display headline)
  kicker: string;      // small italic subhead under the headline
  caption: string;
  neuroNote: string;
}

const STEPS: StepDef[] = [
  {
    key: "visual",
    label: "Visualize",
    color: "hsl(215 80% 42%)",
    gradient: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))",
    wash: "hsl(210 70% 92%)",
    issue: "First Look",
    kicker: "Before words, the image lands.",
    caption: "Let's see it… your visual cortex remembers images 60,000x faster.",
    neuroNote: "Visual encoding creates dual pathways — verbal + visual — doubling retention.",
  },
  {
    key: "definition",
    label: "Define",
    color: "hsl(35 75% 38%)",
    gradient: "linear-gradient(135deg, hsl(35 75% 38%), hsl(28 85% 48%))",
    wash: "hsl(38 65% 90%)",
    issue: "In Plain Language",
    kicker: "What it actually means, said simply.",
    caption: "Now let's understand what it means…",
    neuroNote: "Cognitive labeling anchors meaning in your semantic memory network.",
  },
  {
    key: "recall_reconstruction",
    label: "Recall",
    color: "hsl(355 70% 44%)",
    gradient: "linear-gradient(135deg, hsl(355 70% 44%), hsl(8 78% 52%))",
    wash: "hsl(358 60% 94%)",
    issue: "From You, Not Me",
    kicker: "Produce it — don't just recognize it.",
    caption: "Now build it back from your own brain…",
    neuroNote: "Active production (vs. recognition) forces retrieval pathways to fire — the strongest form of memory consolidation.",
  },
  {
    key: "scripture",
    label: "Scripture",
    color: "hsl(30 60% 42%)",
    gradient: "linear-gradient(135deg, hsl(30 60% 42%), hsl(25 65% 50%))",
    wash: "hsl(30 55% 90%)",
    issue: "The Source",
    kicker: "Read it the way it was first written.",
    caption: "Let's read the original passage together…",
    neuroNote: "Reading source material in context strengthens comprehension and retention through contextual encoding.",
  },
  {
    key: "breakdown",
    label: "Break It Down",
    color: "hsl(185 60% 36%)",
    gradient: "linear-gradient(135deg, hsl(185 60% 36%), hsl(195 65% 46%))",
    wash: "hsl(185 50% 90%)",
    issue: "Anatomy of a Word",
    kicker: "Every part of the term, decoded.",
    caption: "Let's learn how to say this word first…",
    neuroNote: "Phonetic decoding activates language processing centers, building neural pathways for recall.",
  },
  {
    key: "recognize",
    label: "Recognize",
    color: "hsl(275 65% 48%)",
    gradient: "linear-gradient(135deg, hsl(275 65% 48%), hsl(285 72% 56%))",
    wash: "hsl(280 50% 92%)",
    issue: "Spot It in the Wild",
    kicker: "Train your eye to know it on sight.",
    caption: "Can you identify it now? Let's test your recognition…",
    neuroNote: "Spatial memory and recall systems strengthen through active identification.",
  },
  {
    key: "metaphor",
    label: "Metaphor",
    color: "hsl(265 70% 48%)",
    gradient: "linear-gradient(135deg, hsl(265 70% 48%), hsl(255 75% 56%))",
    wash: "hsl(265 50% 92%)",
    issue: "The Image That Sticks",
    kicker: "A picture that makes it click.",
    caption: "Stay with me… this is where it clicks.",
    neuroNote: "Metaphors activate the limbic system, linking knowledge to emotion for lasting memory.",
  },
  {
    key: "information",
    label: "Information",
    color: "hsl(335 60% 46%)",
    gradient: "linear-gradient(135deg, hsl(335 60% 46%), hsl(345 65% 54%))",
    wash: "hsl(340 55% 93%)",
    issue: "The Full Story",
    kicker: "Everything underneath the surface.",
    caption: "Let me share more about this with you…",
    neuroNote: "Elaborative encoding strengthens comprehension through expanded context and reasoning.",
  },
  {
    key: "reflection",
    label: "Reflect",
    color: "hsl(20 70% 46%)",
    gradient: "linear-gradient(135deg, hsl(20 70% 46%), hsl(28 78% 54%))",
    wash: "hsl(22 65% 92%)",
    issue: "In Your Own Words",
    kicker: "Make it yours, on the page.",
    caption: "Connect this to the metaphor and your life…",
    neuroNote: "Metacognition and self-referencing activate the prefrontal cortex for deep internalization.",
  },
  {
    key: "application",
    label: "Apply",
    color: "hsl(150 55% 32%)",
    gradient: "linear-gradient(135deg, hsl(150 55% 32%), hsl(160 60% 40%))",
    wash: "hsl(150 45% 91%)",
    issue: "Into Practice",
    kicker: "Put the idea to work.",
    caption: "Now put your knowledge to work…",
    neuroNote: "Active recall and problem-solving transfer knowledge from short-term to long-term memory.",
  },
  {
    key: "quiz",
    label: "Assess",
    color: "hsl(355 70% 44%)",
    gradient: "linear-gradient(135deg, hsl(355 70% 44%), hsl(8 78% 52%))",
    wash: "hsl(358 60% 92%)",
    issue: "The Final Check",
    kicker: "Show what you know.",
    caption: "Let's see if you're exam-ready…",
    neuroNote: "Testing effect: retrieval practice strengthens memory more than re-studying.",
  },
];

/* ─── Sounds ─── */
const playChime = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine"; osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

const playCelebration = () => {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
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

/* ─── TTS Helper ─── */
import { fetchTTSWithFallback } from "@/lib/browserTTS";
const fetchTTS = (text: string): Promise<HTMLAudioElement | null> => fetchTTSWithFallback(text, { usageType: "lesson" });

/* ─── Main Component ─── */
const LearningOrbDialog = ({
  open, onOpenChange, block: rawBlock, onNotesChange, mode = "uploaded", blockIndex = 0, onComplete,
}: LearningOrbDialogProps) => {
  // ─── Static content overrides (built-in terms) ───
  // If admin has saved pre-written content for a step, prefer it over legacy/AI fields
  // so all users see the same structured experience without an AI call.
  const block = useMemo<UploadedBlock | null>(() => {
    if (!rawBlock) return null;
    const b = { ...rawBlock };
    if (b.static_define) b.definition = b.static_define;
    if (b.static_metaphor) b.metaphor = b.static_metaphor;
    if (b.static_visualize) b.visualization_desc = b.static_visualize;
    if (b.static_reflect) b.reflection_prompt = b.static_reflect;
    if (b.static_apply) b.practice_scenario = b.static_apply;
    if (b.static_assess_question && b.static_assess_answer) {
      b.quiz_question = b.static_assess_question;
      b.quiz_answer = b.static_assess_answer;
      // Synthesize 4-option pool (correct + 3 plausible distractors) so the
      // dialog's built-in quiz renderer activates and we never call AI.
      b.quiz_options = [
        b.static_assess_answer,
        `A different concept unrelated to ${b.term_title}.`,
        `A general term often confused with ${b.term_title}.`,
        `None of the above.`,
      ];
    }
    return b;
  }, [rawBlock]);

  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled } = useSoundsEnabled();
  const { dna, rules, context: dnaContext, updateDNA, getEncouragement, getAdaptedCaption } = useDNAAdaptation();
  const { completeLayer: brainCompleteLayer, recordAssess: brainRecordAssess } = useBrainStrengths();
  const { submitStage: tjSubmitStage } = useTJEngine(block?.id ?? null);
  const [tjFeedbackByStage, setTjFeedbackByStage] = useState<Partial<Record<StageId, EngineEvaluation>>>({});
  const [tjSubmitting, setTjSubmitting] = useState<StageId | null>(null);
  const [behaviorSuggestionByStage, setBehaviorSuggestionByStage] = useState<
    Partial<Record<StageId, BehaviorSuggestion | null>>
  >({});
  const [strengthenOpen, setStrengthenOpen] = useState(false);
  const blockState = (type: Parameters<typeof getBlockOpenState>[1]) => getBlockOpenState(dnaContext, type);
  const { adaptCaption, toneProfile } = useTJTone();
  // Filter out scripture step if block has no source text/page reference
  const hasScripture = !!(block?.source_text || block?.page_reference);
  const availableSteps = useMemo(() => {
    if (hasScripture) return STEPS;
    return STEPS.filter(s => s.key !== "scripture");
  }, [hasScripture]);

  // Reorder steps based on DNA layer strength.
  // INVARIANTS:
  //  - "visual" (Visualize) is ALWAYS step 1
  //  - "quiz"   (Assess / Final Check) is ALWAYS the LAST step
  // The DNA-preferred layer slots into position 2 (between Visualize and the rest).
  const adaptedSteps = useMemo(() => {
    // Always pull quiz to the end and visual to the front, regardless of DNA.
    const pinFirstAndLast = (arr: typeof availableSteps) => {
      const visual = arr.find(s => s.key === "visual");
      const quiz = arr.find(s => s.key === "quiz");
      const middle = arr.filter(s => s.key !== "visual" && s.key !== "quiz");
      return [
        ...(visual ? [visual] : []),
        ...middle,
        ...(quiz ? [quiz] : []),
      ];
    };

    if (!dna) return pinFirstAndLast(availableSteps);

    const LAYER_MAP: Record<string, string> = { D: "definition", V: "visual", M: "metaphor", I: "information", R: "reflection", A: "application", K: "quiz", B: "breakdown", N: "recognize", S: "scripture" };
    const preferred = LAYER_MAP[dna.layerStrength];
    // Never let the preferred layer disturb the visual-first / quiz-last rule.
    if (!preferred || preferred === "visual" || preferred === "quiz") {
      return pinFirstAndLast(availableSteps);
    }
    const preferredStep = availableSteps.find(s => s.key === preferred);
    if (!preferredStep) return pinFirstAndLast(availableSteps);

    const visual = availableSteps.find(s => s.key === "visual");
    const quiz = availableSteps.find(s => s.key === "quiz");
    const middle = availableSteps.filter(
      s => s.key !== "visual" && s.key !== "quiz" && s.key !== preferred,
    );
    return [
      ...(visual ? [visual] : []),
      preferredStep,
      ...middle,
      ...(quiz ? [quiz] : []),
    ];
  }, [dna, availableSteps]);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [entryChosen, setEntryChosen] = useState(false);
  const [entryPath, setEntryPath] = useState<ThinkingPath | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showNeuro, setShowNeuro] = useState(false);

  // Visual
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

  // Reflection/Apply
  const [journalNote, setJournalNote] = useState("");
  const [journalSaving, setJournalSaving] = useState(false);

  // Quiz
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizAttempted, setQuizAttempted] = useState(false);
  const [quizFeedbackLocked, setQuizFeedbackLocked] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<{ question: string; options: string[]; answer: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Recognize
  const [recognizeSelected, setRecognizeSelected] = useState<number | null>(null);
  const [recognizeRevealed, setRecognizeRevealed] = useState(false);

  // Reinforcement gating — when learner answers the in-flow quiz wrong,
  // we LOCK the dialog and force them through ReinforcementDialog before
  // they can advance or close.
  const { recordIncorrect, recordCorrect } = useReinforcement();
  const [reinforcementOpen, setReinforcementOpen] = useState(false);
  const [reinforcementResolved, setReinforcementResolved] = useState(true);
  const [missedQuestionText, setMissedQuestionText] = useState("");

  // Breakdown Point — "Where did this stop making sense?" prompt state
  const [incorrectAttemptsCount, setIncorrectAttemptsCount] = useState(0);
  const [breakdownAcked, setBreakdownAcked] = useState(false);
  const [breakdownRouteCard, setBreakdownRouteCard] = useState<BreakdownRouteAction | null>(null);
  const [dominantBreakdownPattern, setDominantBreakdownPattern] = useState<BreakdownPoint | null>(null);

  // Cognitive Load Indicator — rule-based, derived from existing signals.
  const sessionIdRef = useRef<string>(getSessionId());
  const termOpenedAtRef = useRef<number>(Date.now());
  const questionOpenedAtRef = useRef<number | null>(null);
  const clickTimesRef = useRef<number[]>([]);
  const lastInteractionRef = useRef<number>(Date.now());
  const skippedStepsRef = useRef<Set<number>>(new Set());
  const [skippedSectionsCount, setSkippedSectionsCount] = useState(0);
  const [fastClickingPattern, setFastClickingPattern] = useState(false);
  const [longPausePattern, setLongPausePattern] = useState(false);
  const [cogLoad, setCogLoad] = useState<CognitiveLoadReading>({ level: "low", reasons: [] });
  const [cogLoadAcked, setCogLoadAcked] = useState(false);
  const [pauseTickMs, setPauseTickMs] = useState(0);

  // Etymology
  const [etymology, setEtymology] = useState<{ parts: { part: string; meaning: string; origin: string }[]; pronunciation: string; summary: string } | null>(null);
  const [etymLoading, setEtymLoading] = useState(false);

  // Information (expanded)
  const [expandedInfo, setExpandedInfo] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);

  // Required TJ Mentor Check-In answers (Information step)
  const [mentorCheckInAnswers, setMentorCheckInAnswers] = useState<Record<number, string>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completedRef = useRef(false);
  const autoVoiceRef = useRef(false);

  // Cleanup audio
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    stopSpeaking();
    const audio = await fetchTTS(text);
    if (!audio) return;
    audioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
    audio.onerror = () => { setIsSpeaking(false); };
    await audio.play();
  }, [voiceEnabled, stopSpeaking]);

  // Reset state when block changes
  useEffect(() => {
    if (block) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setCompleted(false);
      setEntryChosen(false);
      setEntryPath(null);
      setImageUrl(block.image_url || "");
      setJournalNote(block.user_notes || "");
      setQuizSelected(null);
      setQuizRevealed(false);
      setQuizAttempted(false);
      setQuizFeedbackLocked(false);
      setAiQuestion(null);
      setRecognizeSelected(null);
      setRecognizeRevealed(false);
      setEtymology(null);
      setExpandedInfo("");
      setMentorCheckInAnswers({});
      setIncorrectAttemptsCount(0);
      setBreakdownAcked(false);
      setBreakdownRouteCard(null);
      // Cognitive load reset
      termOpenedAtRef.current = Date.now();
      questionOpenedAtRef.current = null;
      clickTimesRef.current = [];
      lastInteractionRef.current = Date.now();
      skippedStepsRef.current = new Set();
      setSkippedSectionsCount(0);
      setFastClickingPattern(false);
      setLongPausePattern(false);
      setCogLoad({ level: "low", reasons: [] });
      setCogLoadAcked(false);
      setPauseTickMs(0);
      // Pre-seed with admin-authored static content so no AI call is needed
      if (block.static_break_it_down) {
        setEtymology({ parts: [], pronunciation: "", summary: block.static_break_it_down });
      }
      if (block.static_information) {
        setExpandedInfo(block.static_information);
      }
      completedRef.current = false;
      autoVoiceRef.current = false;
    }
  }, [block?.id]);

  // Hydrate incorrect-attempt count + cross-term breakdown pattern.
  useEffect(() => {
    if (!block?.id || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: struggle } = await (supabase as any)
        .from("term_struggle")
        .select("incorrect_attempts")
        .eq("user_id", user.id)
        .eq("term_id", block.id)
        .maybeSingle();
      if (!cancelled && struggle) {
        setIncorrectAttemptsCount(struggle.incorrect_attempts ?? 0);
      }
      const pattern = await loadBreakdownPattern(user.id);
      if (!cancelled) setDominantBreakdownPattern(pattern.dominant);
    })();
    return () => { cancelled = true; };
  }, [block?.id, user?.id]);

  /* ─── Cognitive Load: signal collection ─── */

  // Click cadence tracking → fast clicking pattern (4+ clicks within 2s).
  useEffect(() => {
    if (!open) return;
    const onClick = () => {
      const now = Date.now();
      lastInteractionRef.current = now;
      const arr = clickTimesRef.current;
      arr.push(now);
      while (arr.length && now - arr[0] > 2000) arr.shift();
      if (arr.length >= 4 && !fastClickingPattern) setFastClickingPattern(true);
    };
    const onMove = () => { lastInteractionRef.current = Date.now(); };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onClick);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onClick);
      window.removeEventListener("mousemove", onMove);
    };
  }, [open, fastClickingPattern]);

  // Long-pause ticker — re-evaluates every 5s while dialog is open.
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      const idle = Date.now() - lastInteractionRef.current;
      setPauseTickMs(idle);
      if (idle >= 45_000 && !longPausePattern) setLongPausePattern(true);
    }, 5000);
    return () => clearInterval(t);
  }, [open, longPausePattern]);

  // AUTO-VOICE: speak on tile open (including step 0)
  useEffect(() => {
    if (!block || !open || autoVoiceRef.current || !voiceEnabled) return;
    stopGlobalNarration(); // stop any page-level narration
    autoVoiceRef.current = true;
    const timer = setTimeout(() => {
      speakText(`Let's learn about ${block.term_title}. ${block.term_title}. ${block.definition}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [block?.id, open]);

  // Cognitive Load: track skipped sections (advancing without completing prior step)
  const prevStepRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevStepRef.current;
    if (currentStep > prev && !completedSteps.has(prev) && !skippedStepsRef.current.has(prev)) {
      skippedStepsRef.current.add(prev);
      setSkippedSectionsCount(skippedStepsRef.current.size);
    }
    prevStepRef.current = currentStep;
    setCogLoadAcked(false);
  }, [currentStep, completedSteps]);

  // Cognitive Load: mark when a question becomes the active surface
  useEffect(() => {
    const key = adaptedSteps[currentStep]?.key;
    if (key === "quiz" || key === "recognize" || key === "recall_reconstruction") {
      questionOpenedAtRef.current = Date.now();
    } else {
      questionOpenedAtRef.current = null;
    }
  }, [currentStep, adaptedSteps]);

  // Cognitive Load: recompute reading from current signals
  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    const reading = computeCognitiveLoad({
      timeOnTermMs: now - termOpenedAtRef.current,
      timeOnQuestionMs: questionOpenedAtRef.current ? now - questionOpenedAtRef.current : 0,
      wrongAttempts: incorrectAttemptsCount,
      fastClickingPattern,
      longPausePattern,
      skippedSections: skippedSectionsCount,
    });
    setCogLoad((prev) =>
      prev.level === reading.level && prev.reasons.join("|") === reading.reasons.join("|")
        ? prev
        : reading,
    );
  }, [
    open,
    incorrectAttemptsCount,
    fastClickingPattern,
    longPausePattern,
    skippedSectionsCount,
    pauseTickMs,
    currentStep,
  ]);

  // Persist a snapshot whenever the load level changes to non-low
  const lastPersistedRef = useRef<string>("");
  useEffect(() => {
    if (!open || !user?.id || !block?.id) return;
    if (cogLoad.level === "low") return;
    const sig = `${cogLoad.level}|${currentStep}`;
    if (sig === lastPersistedRef.current) return;
    lastPersistedRef.current = sig;
    persistCognitiveLoad({
      userId: user.id,
      termId: block.id,
      moduleId: (block as any)?.module_id ?? null,
      sessionId: sessionIdRef.current,
      reading: cogLoad,
      signals: {
        timeOnTermMs: Date.now() - termOpenedAtRef.current,
        timeOnQuestionMs: questionOpenedAtRef.current ? Date.now() - questionOpenedAtRef.current : 0,
        wrongAttempts: incorrectAttemptsCount,
        fastClickingPattern,
        longPausePattern,
        skippedSections: skippedSectionsCount,
      },
    });
  }, [cogLoad, open, user?.id, block?.id, currentStep, incorrectAttemptsCount, fastClickingPattern, longPausePattern, skippedSectionsCount]);

  // ---------------- Learning Rhythm System ----------------
  // Rule-based regulator (no AI) that derives a single rhythm state from
  // cognitive load + wrong attempts + click/pause patterns + reset events.
  const cameFromResetRef = useRef(false);
  const lastRhythmRef = useRef<string>("");

  useEffect(() => {
    const onCafeClosed = () => { cameFromResetRef.current = true; };
    window.addEventListener("tj-cafe-closed", onCafeClosed);
    return () => window.removeEventListener("tj-cafe-closed", onCafeClosed);
  }, []);

  useEffect(() => {
    if (!open) return;
    const reading: LearningRhythmReading = computeLearningRhythm({
      cognitiveLoad: cogLoad.level,
      confidence: null,
      wrongAttempts: incorrectAttemptsCount,
      fastClickingPattern,
      longPausePattern,
      cameFromReset: cameFromResetRef.current,
    });

    const sig = `${reading.state}|${reading.reasons.join("|")}`;
    if (sig === lastRhythmRef.current) return;
    lastRhythmRef.current = sig;

    emitRhythmChange(reading.state);

    if (user?.id) {
      persistLearningRhythm({
        userId: user.id,
        termId: block?.id ?? null,
        moduleId: (block as any)?.module_id ?? null,
        sessionId: sessionIdRef.current,
        reading,
        signals: {
          cognitiveLoad: cogLoad.level,
          confidence: null,
          wrongAttempts: incorrectAttemptsCount,
          fastClickingPattern,
          longPausePattern,
          cameFromReset: cameFromResetRef.current,
        },
      });
    }

    if (reading.state === "recovering") cameFromResetRef.current = false;
  }, [
    open,
    user?.id,
    block?.id,
    cogLoad.level,
    incorrectAttemptsCount,
    fastClickingPattern,
    longPausePattern,
  ]);

  // ---------------- Breath Trigger System ----------------
  // Pauses or redirects learning when behavior signals indicate strain.
  const [breathOpen, setBreathOpen] = useState(false);
  const [breathReasons, setBreathReasons] = useState<string[]>([]);
  const lastRhythmStateRef = useRef<LearningRhythmReading["state"] | null>(null);
  const breathCooldownRef = useRef<number>(0);
  const breathSignalsRef = useRef<BreathSignals | null>(null);

  // Track rhythm state so the breath evaluator can use it without recomputing.
  useEffect(() => {
    const reading = computeLearningRhythm({
      cognitiveLoad: cogLoad.level,
      confidence: null,
      wrongAttempts: incorrectAttemptsCount,
      fastClickingPattern,
      longPausePattern,
      cameFromReset: false,
    });
    lastRhythmStateRef.current = reading.state;
  }, [cogLoad.level, incorrectAttemptsCount, fastClickingPattern, longPausePattern]);

  useEffect(() => {
    if (!open || breathOpen) return;
    // Cooldown: don't re-prompt within 90s of last breath moment
    if (Date.now() - breathCooldownRef.current < 90_000) return;

    const signals: BreathSignals = {
      rhythmState: lastRhythmStateRef.current,
      cognitiveLoad: cogLoad.level,
      wrongAttempts: incorrectAttemptsCount,
      confidenceRating: null,
      fastClickingPattern,
      longPausePattern,
      repeatedSkipping: skippedSectionsCount >= 3,
    };
    const decision = evaluateBreath(signals);
    if (decision.shouldTrigger) {
      breathSignalsRef.current = signals;
      setBreathReasons(decision.reasons);
      setBreathOpen(true);
      breathCooldownRef.current = Date.now();
    }
  }, [
    open,
    breathOpen,
    cogLoad.level,
    incorrectAttemptsCount,
    fastClickingPattern,
    longPausePattern,
    skippedSectionsCount,
  ]);

  const handleBreathChoice = (choice: Exclude<BreathResponseChoice, "dismissed">) => {
    const signals = breathSignalsRef.current;
    if (user?.id && signals) {
      persistBreathEvent({
        userId: user.id,
        termId: block?.id ?? null,
        moduleId: (block as any)?.module_id ?? null,
        sessionId: sessionIdRef.current,
        choice,
        reasons: breathReasons,
        signals,
      });
    }
    setBreathOpen(false);

    // Route the chosen action — reuses the same handlers as Cognitive Load prompt
    if (choice === "different_way") {
      // Switch to the visual layer as the most universal "different way"
      jumpToStepKey("visual", "Breath → Different way");
    } else if (choice === "tj_cafe") {
      try { openTJCafe(); } catch {}
    } else if (choice === "simpler_version") {
      setQuizSelected(null);
      setQuizRevealed(false);
      setAiQuestion(null);
      const idx = adaptedSteps.findIndex((s) => s.key === "quiz");
      if (idx >= 0) setCurrentStep(idx);
    } else if (choice === "slow_down") {
      // Reset the click/pause flags so we don't immediately re-trigger,
      // and let the learner stay where they are.
      setFastClickingPattern(false);
      setLongPausePattern(false);
    }
    // "continue" = just dismiss
  };

  const handleBreathDismiss = () => {
    const signals = breathSignalsRef.current;
    if (user?.id && signals) {
      persistBreathEvent({
        userId: user.id,
        termId: block?.id ?? null,
        moduleId: (block as any)?.module_id ?? null,
        sessionId: sessionIdRef.current,
        choice: "dismissed",
        reasons: breathReasons,
        signals,
      });
    }
    setBreathOpen(false);
  };

  useEffect(() => {
    if (!block || mode !== "builtin" || !user) return;
    supabase.from("journal_notes").select("note").eq("user_id", user.id).eq("term_id", block.id).single().then(({ data }) => {
      if (data) setJournalNote(data.note);
    });
  }, [mode, user, block?.id]);

  // Always preload any existing AI-generated picture for this term (works for both builtin & uploaded)
  useEffect(() => {
    if (!block?.id) return;
    supabase.from("term_images").select("image_url").eq("term_id", block.id).maybeSingle().then(({ data }) => {
      if (data?.image_url) setImageUrl(data.image_url);
    });
  }, [block?.id]);

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

  // STATIC-ONLY: lesson steps never call AI. Content comes from
  // pre-written database fields only. If a static field is empty for a
  // term, the step simply renders no extra content (admin should fill it).

  // Auto-speak on step change
  useEffect(() => {
    if (!block || !voiceEnabled || !autoVoiceRef.current) return;
    const s = adaptedSteps[currentStep];
    if (!s) return;
    let textToSpeak = "";
    switch (s.key) {
      case "breakdown":
        textToSpeak = `Alright… let's break this word down together. ${block.term_title}. Don't worry about memorizing it yet… just listen to the sounds.`;
        break;
      case "definition":
        textToSpeak = `Okay… now let's understand what ${block.term_title} actually means. ${block.definition}. Just sit with that for a moment.`;
        break;
      case "scripture":
        textToSpeak = `Let's read the original passage together. ${block.page_reference || ""}. ${block.source_text || `This passage gives us the foundation for understanding ${block.term_title}.`}`;
        break;
      case "metaphor":
        textToSpeak = `Stay with me… this is where it starts to click. ${block.metaphor || `Think of ${block.term_title} as something you already know from your daily life.`}`;
        break;
      case "information":
        textToSpeak = `Now I want to share a little more about ${block.term_title}. Don't try to memorize this… just let it build on what you already know.`;
        break;
      case "recognize":
        textToSpeak = `Alright… let's see if you can spot it. Look at the options and choose the one that best describes ${block.term_title}. Trust yourself.`;
        break;
      case "visual":
        textToSpeak = `Don't try to memorize this yet… just look at it. See how it looks… that's all I want you to focus on right now.`;
        break;
      case "reflection":
        textToSpeak = `Take a breath… now think about ${block.term_title}. How does it connect to the metaphor? How does it connect to your life? Write what comes to mind.`;
        break;
      case "application":
        textToSpeak = `Now let's put what you know to work. Think about how ${block.term_title} shows up in a real scenario. You've got this.`;
        break;
      case "quiz":
        textToSpeak = `Alright… let's see what you've built. This is not about being perfect… it's about showing yourself what you know.`;
        break;
    }
    if (textToSpeak) {
      setTimeout(() => speakText(textToSpeak), 200);
    }
  }, [currentStep, etymology, expandedInfo]);

  // Push current lesson + step to global context so DNA progress tracker can tag events.
  // Must run before any early-return to satisfy rules of hooks.
  useEffect(() => {
    if (!block) return;
    const stepNow = adaptedSteps[currentStep];
    setLessonContext({
      module_id: (block as any).module_id ?? null,
      term_id: (block as any).id ?? null,
      term_title: (block as any).term_title ?? null,
      step_key: stepNow?.key ?? null,
      step_label: stepNow?.label ?? null,
    });
    return () => { clearLessonContext(); };
  }, [block, currentStep, adaptedSteps]);

  if (!block) return null;

  const step = adaptedSteps[currentStep];
  const progressPercent = ((currentStep + 1) / adaptedSteps.length) * 100;

  // ─── Learner Behavior Intake Layer (rule-based, no AI) ───
  // Captures confidence, thinking path, explain-back, error type,
  // mode, micro-decisions, second-chance, integrity, breakdown, and load.
  const currentTjStage = (ORB_STEP_TO_TJ_STAGE[step?.key ?? ""] ?? null) as StageId | null;
  const behaviorIntake = useBehaviorIntake({
    termId: block?.id ?? null,
    stageId: currentTjStage,
  });

  // DNA-adapted encouragement message
  const encouragementMsg = rules.toneModifier === "supportive" ? getEncouragement() : null;

  // Mentor Check-In gating (Information step)
  const mentorCheckInQuestions: string[] = useMemo(() => {
    const n: any = (block as any)?.lesson_narrative;
    return Array.isArray(n?.mentor_check_in) ? n.mentor_check_in.filter((q: any) => typeof q === "string" && q.trim().length > 0) : [];
  }, [block]);
  const mentorCheckInRequired = step.key === "information" && mentorCheckInQuestions.length > 0;
  const mentorCheckInComplete = mentorCheckInQuestions.every(
    (_, i) => (mentorCheckInAnswers[i] || "").trim().length >= 3,
  );

  const markStepDone = () => {
    setCompletedSteps((prev) => {
      const n = new Set(prev);
      n.add(currentStep);
      return n;
    });
  };

  const goNext = () => {
    // GATE: Information step requires answering all TJ Mentor Check-In questions
    if (mentorCheckInRequired && !mentorCheckInComplete) return;
    stopSpeaking();
    // Track DNA updates based on current step
    if (step.key === "reflection" && journalNote.length > 0) {
      updateDNA({ layerCompleted: "reflection", reflectionLength: journalNote.length });
    } else if (step.key === "application") {
      updateDNA({ layerCompleted: "application" });
    } else {
      updateDNA({ layerCompleted: step.key, timeSpentSeconds: 30 });
    }
    // NEW: bump the 9 brain-strength scores per the static layer spec.
    brainCompleteLayer(step.key).catch(() => {});

    // TJ Engine governance: run typed-text stages through the rule
    // pipeline so submission, feedback, completion state, and
    // reinforcement are persisted in tj_term_stages. Skip if the
    // student already explicitly submitted via the inline "Submit to TJ"
    // button (we don't want to double-evaluate the same response).
    const tjStage = ORB_STEP_TO_TJ_STAGE[step.key] as StageId | undefined;
    if (
      tjStage &&
      (step.key === "reflection" || step.key === "application") &&
      journalNote &&
      !tjFeedbackByStage[tjStage]
    ) {
      tjSubmitStage({ stage: tjStage, rawText: journalNote }).catch(() => {});
    }

    // Quiz step requires an answer and an explicit learner choice before completing
    if (step.key === "quiz" && !quizRevealed) return;
    if (step.key === "quiz" && quizFeedbackLocked) return;
    // GATE: lock progression while reinforcement is unresolved
    if (step.key === "quiz" && !reinforcementResolved) return;
    // Final Check is terminal but should never auto-finish or swap out the lesson.
    // The learner stays inside the module until they explicitly choose Exit Lesson.
    if (step.key === "quiz") {
      markStepDone();
      return;
    }

    markStepDone();

    if (currentStep < adaptedSteps.length - 1) {
      if (soundsEnabled) playChime();
      setCurrentStep((s) => s + 1);
    } else {
      if (!completedRef.current) {
        completedRef.current = true;
        addCoins(15, "block_complete");
        fireBlockCompleteConfetti();
        if (soundsEnabled) playCelebration();
        onComplete?.();
      }
      setCompleted(true);
    }
  };

  const jumpToStep = (i: number) => {
    if (i === currentStep) return;
    // Block jumping while reinforcement is locked
    if (!reinforcementResolved) return;
    stopSpeaking();
    setCurrentStep(i);
  };

  const goBack = () => {
    stopSpeaking();
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  /* ─── TJ Engine: explicit submit + inline feedback handlers ─── */
  const submitToTJ = async (stage: StageId, rawText: string, accuracyScore = 0) => {
    if (!rawText.trim()) return;
    setTjSubmitting(stage);
    try {
      const evalResult = await tjSubmitStage({ stage, rawText, accuracyScore });
      if (evalResult) {
        setTjFeedbackByStage((m) => ({ ...m, [stage]: evalResult }));
        // Commit the Learner Behavior Intake snapshot for this stage.
        const suggestion = await behaviorIntake.commit({
          completionState: evalResult.decision.completion_state,
          attemptCount: evalResult.interpretation.word_count > 0
            ? (evalResult as any)?.attempt_count ?? 1
            : 1,
          accuracyScore,
          detectedStage: evalResult.interpretation.detected_stage ?? null,
        });
        setBehaviorSuggestionByStage((m) => ({ ...m, [stage]: suggestion ?? null }));
      }
    } finally {
      setTjSubmitting(null);
    }
  };

  const tjActionsFor = (stage: StageId) => ({
    onContinue: () => {
      setTjFeedbackByStage((m) => {
        const n = { ...m };
        delete n[stage];
        return n;
      });
      goNext();
    },
    onPracticeAgain: () => {
      setTjFeedbackByStage((m) => {
        const n = { ...m };
        delete n[stage];
        return n;
      });
      setJournalNote("");
    },
    onStrengthenLayer: () => {
      behaviorIntake.recordMicroDecision("reinforcement_opened");
      setStrengthenOpen(true);
    },
    onReviewConcept: () => {
      setTjFeedbackByStage((m) => {
        const n = { ...m };
        delete n[stage];
        return n;
      });
      stopSpeaking();
      setCurrentStep(0);
    },
  });

  // STATIC-ONLY: all AI generators removed from lesson steps.
  // These no-op stubs keep call sites safe. Content for each step is read
  // exclusively from the term's database fields (static_* columns).
  const fetchEtymology = async () => { /* no-op: static-only */ };
  const fetchExpandedInfo = async () => { /* no-op: static-only */ };
  const generateImage = async () => { /* no-op: static-only */ };
  const generateQuizQuestion = async () => { /* no-op: static-only */ };

  const hasBuiltinQuiz = block.quiz_question && block.quiz_options?.length > 0;
  const quizQuestion = hasBuiltinQuiz ? block.quiz_question : aiQuestion?.question;
  const quizOptions = hasBuiltinQuiz ? block.quiz_options.map(String) : (aiQuestion?.options || []);
  const quizAnswer = hasBuiltinQuiz ? block.quiz_answer : (aiQuestion?.answer || "");

  /* ─── Static reteach text resolved per term ─── */
  const reteachText =
    block.static_break_it_down?.trim() ||
    block.metaphor?.trim() ||
    block.static_metaphor?.trim() ||
    `Stay with the core idea of ${block.term_title}: ${block.definition || ""}`;

  /* ─── Assess DNA persistence (per user, per term) ─── */
  const persistAssessmentDNA = useCallback(async (args: {
    correct: boolean;
    isFirstAttempt: boolean;
    reviewPath?: string | null;
  }) => {
    if (!user || !block) return;
    const { data: existing } = await (supabase as any)
      .from("assessment_dna")
      .select("*")
      .eq("user_id", user.id)
      .eq("term_id", block.id)
      .maybeSingle();

    const attempt_count = (existing?.attempt_count ?? 0) + 1;
    const accuracy_score = (existing?.accuracy_score ?? 0) + (args.correct ? 1 : 0);
    const dominant_gap = args.correct ? null : "function_gap";
    const reteach_trigger = !args.correct;
    const recommended_static_action = args.correct
      ? "Continue"
      : (attempt_count >= 2 ? "Practice Again" : "Review Breakdown");

    let mastery_status: string = existing?.mastery_status || "New";
    if (args.correct) {
      if (args.isFirstAttempt && attempt_count === 1) mastery_status = "Mastered";
      else if (existing?.last_answer_correct === false || existing?.last_review_path) mastery_status = "Reinforced";
      else mastery_status = "Mastered";
    } else {
      mastery_status = "Developing";
    }

    const first_attempt_correct =
      existing?.first_attempt_correct ?? (attempt_count === 1 ? args.correct : null);

    await (supabase as any)
      .from("assessment_dna")
      .upsert(
        {
          user_id: user.id,
          term_id: block.id,
          accuracy_score,
          attempt_count,
          last_answer_correct: args.correct,
          dominant_gap,
          reteach_trigger,
          recommended_static_action,
          last_review_path: args.reviewPath ?? existing?.last_review_path ?? null,
          mastery_status,
          first_attempt_correct,
        },
        { onConflict: "user_id,term_id" },
      );
  }, [user, block]);

  /* ─── Jump to a previous step by key ─── */
  const jumpToStepKey = useCallback((key: string, reviewPath: string) => {
    const idx = adaptedSteps.findIndex(s => s.key === key);
    if (idx < 0) return;
    if (user && block) {
      (supabase as any)
        .from("assessment_dna")
        .update({ last_review_path: reviewPath })
        .eq("user_id", user.id)
        .eq("term_id", block.id);
    }
    stopSpeaking();
    setCurrentStep(idx);
  }, [adaptedSteps, user, block, stopSpeaking]);

  /* ─── Editorial spread shell — wraps every step's content ─── */
  const stepIndex = currentStep;
  const issueNumber = String(stepIndex + 1).padStart(2, "0");
  const totalNumber = String(adaptedSteps.length).padStart(2, "0");

  // Stable wrapper — useMemo keeps component identity constant across
  // renders so React doesn't remount the subtree (which would steal focus
  // from inputs like the Recall Reconstruction textarea).
  // We deliberately shadow the module-scope `EditorialShell` so the existing
  // JSX usages below don't need to change.
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const EditorialShell = useMemo(() => {
    const Wrapped = (props: { children: React.ReactNode; hideHeader?: boolean }) => (
      <EditorialShellBase
        {...props}
        stepColor={step.color}
        stepWash={step.wash}
        stepGradient={step.gradient}
        issueNumber={issueNumber}
        stepLabel={step.label}
        termTitle={block.term_title}
        stepIssue={step.issue}
        stepKicker={step.kicker}
      />
    );
    Wrapped.displayName = "EditorialShell";
    return Wrapped;
  }, [step.color, step.wash, step.gradient, step.label, step.issue, step.kicker, issueNumber, block.term_title]);

  /* ─── Render Center Content ─── */
  const renderContent = () => {
    switch (step.key) {
      case "breakdown":
        return (
          <motion.div key="breakdown" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              {etymLoading ? (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                  <p className="text-sm" style={{ color: c.subtext }}>Breaking down the word…</p>
                </div>
              ) : etymology ? (
                <div className="space-y-3">
                  {etymology.pronunciation && (
                    <p className="editorial-pullquote">
                      <span className="pq-eyebrow">Pronunciation</span>
                      {etymology.pronunciation}
                      <span className="ml-2 align-middle inline-block"><SpeakButton text={block.term_title} size="icon" /></span>
                    </p>
                  )}
                  <div className="space-y-2">
                    {etymology.parts.map((part, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="editorial-card">
                        <div className="editorial-card-header">
                          <span className="num">{String(i + 1).padStart(2, "0")}</span>
                          <span className="label">{part.origin}</span>
                          <span className="title">{part.part}</span>
                        </div>
                        <div className="editorial-card-body flex items-center justify-between gap-3">
                          <p className="m-0">= {part.meaning}</p>
                          <SpeakButton text={`${part.part} means ${part.meaning}`} size="icon" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="editorial-card-body editorial-dropcap rounded-xl" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                    {etymology.summary}
                  </p>
                  <div className="flex items-center gap-2">
                    <SpeakButton text={etymology.summary} size="sm" label="Listen" />
                  </div>
                </div>
              ) : (
                <p className="editorial-card-body italic" style={{ background: "hsl(40 35% 99%)", borderRadius: 12, border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  Word breakdown coming soon for this term.
                </p>
              )}
            </EditorialShell>
          </motion.div>
        );

      case "definition":
        return (
          <motion.div key="definition" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <div className="editorial-card">
                <div className="editorial-card-header">
                  <span className="num">01</span>
                  <span className="label">Definition</span>
                  <span className="title">{block.term_title}</span>
                </div>
                <div className="editorial-card-body editorial-dropcap">
                  {block.definition}
                </div>
              </div>
              <div className="mt-3">
                <SpeakButton text={`${block.term_title}. ${block.definition}`} size="sm" label="Listen" />
              </div>
              <div className="mt-4">
                <ExplainItBackLayer
                  termId={block.id}
                  trigger="definition"
                  contextRef={`define:${block.term_title}`}
                />
              </div>
            </EditorialShell>
          </motion.div>
        );

      case "scripture":
        return (
          <motion.div key="scripture" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              {block.page_reference && (
                <p className="editorial-eyebrow mb-2">{block.page_reference}</p>
              )}
              {block.source_text ? (
                <blockquote className="editorial-pullquote" style={{ fontSize: "1.35rem" }}>
                  <span className="pq-eyebrow">From the source</span>
                  "{block.source_text}"
                </blockquote>
              ) : (
                <p className="editorial-card-body" style={{ background: "hsl(40 35% 99%)", borderRadius: 12, border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  This passage is referenced at {block.page_reference || "this point in the text"}.
                </p>
              )}
              <div className="my-3"><SpeakButton text={`${block.page_reference || ""}. ${block.source_text || block.definition}`} size="sm" label="Listen to passage" /></div>

              {block.definition && (
                <div className="space-y-3 mt-2">
                  <div className="editorial-card">
                    <div className="editorial-card-header"><span className="num">01</span><span className="label">Plain meaning</span></div>
                    <div className="editorial-card-body">{block.definition}</div>
                  </div>
                  {(block as any).explanation && (
                    <div className="editorial-card">
                      <div className="editorial-card-header"><span className="num">02</span><span className="label">Deeper explanation</span></div>
                      <div className="editorial-card-body">{(block as any).explanation}</div>
                    </div>
                  )}
                  {block.metaphor && (
                    <blockquote className="editorial-pullquote">
                      <span className="pq-eyebrow">What this means for you</span>
                      "{block.metaphor}"
                    </blockquote>
                  )}
                </div>
              )}
              <div className="mt-4">
                <ExplainItBackLayer
                  termId={block.id}
                  trigger="guided_lesson"
                  contextRef={`guided_lesson:${block.term_title}`}
                />
              </div>
            </EditorialShell>
          </motion.div>
        );

      case "visualize":
      case "visual":
        return (
          <motion.div key="visual" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              {imageUrl ? (
                <figure className="editorial-figure">
                  <img src={imageUrl} alt={block.term_title} />
                  <figcaption>
                    <span>Plate {issueNumber} · {block.term_title}</span>
                    <span style={{ color: step.color }}>{step.label}</span>
                  </figcaption>
                </figure>
              ) : null}
              {block.static_visualize && (
                <p className="editorial-card-body editorial-dropcap mt-3 rounded-xl" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)", whiteSpace: "pre-wrap" }}>
                  {block.static_visualize}
                </p>
              )}
              {!imageUrl && !block.static_visualize && block.visualization_desc && (
                <p className="editorial-card-body italic mt-3 rounded-xl" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  {block.visualization_desc}
                </p>
              )}
              {block.video_url && <div className="mt-3"><VideoPlayer url={block.video_url} /></div>}
            </EditorialShell>
          </motion.div>
        );

      case "recognize": {
        const conceptIdentity = Array.isArray(block.concept_identity) ? block.concept_identity.map(String) : [];
        const identityItems = conceptIdentity.length >= 4 ? conceptIdentity.slice(0, 4) :
          [block.definition, block.metaphor || "A related concept in another field", "An unrelated term from a different subject", "A common misconception about this topic"].slice(0, 4);
        return (
          <motion.div key="recognize" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              {block.static_recognize && (
                <p className="editorial-card-body editorial-dropcap rounded-xl mb-3" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  {block.static_recognize}
                </p>
              )}
              <p className="editorial-eyebrow mb-2">The Question</p>
              <p className="font-display text-lg leading-snug mb-4" style={{ color: c.termHeading }}>
                Which of these best describes <em style={{ color: step.color }}>{block.term_title}</em>?
              </p>
              <div className="grid grid-cols-1 gap-3">
                {identityItems.map((item, i) => {
                  const isCorrect = i === 0;
                  const isSelected = recognizeSelected === i;
                  let bg = "hsl(40 35% 99%)";
                  let border = "hsl(0 0% 0% / 0.1)";
                  let textColor = c.termHeading;
                  if (recognizeRevealed && isSelected && isCorrect) { bg = "linear-gradient(135deg, hsl(145 50% 92%), hsl(145 45% 86%))"; border = "hsl(145 45% 45%)"; }
                  else if (recognizeRevealed && isSelected) { bg = "linear-gradient(135deg, hsl(0 60% 95%), hsl(0 55% 90%))"; border = "hsl(0 60% 50%)"; }
                  else if (recognizeRevealed && isCorrect) { bg = "linear-gradient(135deg, hsl(145 50% 92%), hsl(145 45% 86%))"; border = "hsl(145 45% 45%)"; }
                  return (
                    <motion.button
                      key={i}
                      onClick={() => { if (!recognizeRevealed) { setRecognizeSelected(i); setRecognizeRevealed(true); } }}
                      className="text-left transition-all overflow-hidden"
                      style={{ background: bg, border: `2px solid ${border}`, color: textColor, borderRadius: "0.85rem" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <span className="font-display text-2xl font-bold flex-shrink-0" style={{ color: step.color, opacity: 0.6 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm leading-snug font-medium">{item}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              {recognizeRevealed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display italic mt-4 text-center" style={{ color: recognizeSelected === 0 ? "hsl(145 50% 35%)" : "hsl(0 60% 45%)" }}>
                  {recognizeSelected === 0 ? "✓ That's right." : "✗ Not quite — the correct answer is highlighted above."}
                </motion.p>
              )}
            </EditorialShell>
          </motion.div>
        );
      }

      case "metaphor":
        return (
          <motion.div key="metaphor" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <blockquote className="editorial-pullquote" style={{ fontSize: "1.6rem", lineHeight: 1.3 }}>
                <span className="pq-eyebrow">The image that sticks</span>
                {block.metaphor || "Think of this concept as a bridge connecting what you know to what you're learning."}
              </blockquote>
              <div className="mt-2"><SpeakButton text={block.metaphor || block.definition} size="sm" label="Listen" /></div>
              {block.affirmation && (
                <p className="editorial-pullquote mt-4" style={{ borderLeftColor: "hsl(280 50% 55%)", color: "hsl(280 40% 25%)" }}>
                  <span className="pq-eyebrow" style={{ color: "hsl(280 45% 40%)" }}>Affirmation</span>
                  {block.affirmation}
                </p>
              )}
            </EditorialShell>
          </motion.div>
        );

      case "information": {
        // Prefer the structured static narrative when available (e.g. Epidermis).
        const narrative: any = (block as any).lesson_narrative;
        const hasNarrative = !!(narrative && (narrative.sections?.length || narrative.key_point || narrative.purpose));

        if (hasNarrative) {
          return (
            <motion.div key="information" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <EditorialShell>
                {imageUrl && (
                  <figure className="editorial-figure mb-4">
                    <img src={imageUrl} alt={block.term_title} />
                    <figcaption>
                      <span>Plate · {block.term_title}</span>
                      <span style={{ color: step.color }}>The Full Story</span>
                    </figcaption>
                  </figure>
                )}

                {narrative.key_point && (
                  <p className="editorial-pullquote">
                    <span className="pq-eyebrow">Key Point</span>
                    {narrative.key_point}
                  </p>
                )}

                <div className="space-y-3 mt-3">
                  {(narrative.sections || []).map((sec: any, i: number) => (
                    <motion.article
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      className="editorial-card"
                    >
                      <div className="editorial-card-header">
                        <span className="num">{String(i + 1).padStart(2, "0")}</span>
                        <span className="label">Section</span>
                        <span className="title">{sec.heading}</span>
                      </div>
                      <div className="editorial-card-body editorial-dropcap" style={{ whiteSpace: "pre-line" }}>
                        {sec.body}
                      </div>
                    </motion.article>
                  ))}
                </div>

                {narrative.memory_cue && (
                  <p className="editorial-pullquote mt-4" style={{ fontSize: "1.4rem", borderLeftColor: "hsl(280 55% 55%)" }}>
                    <span className="pq-eyebrow" style={{ color: "hsl(280 45% 40%)" }}>Remember</span>
                    {narrative.memory_cue}
                  </p>
                )}

                {narrative.mentor_check_in && narrative.mentor_check_in.length > 0 && (
                  <article className="editorial-card mt-3" style={{ borderColor: mentorCheckInComplete ? "hsl(145 40% 70%)" : "hsl(0 0% 0% / 0.12)" }}>
                    <div className="editorial-card-header">
                      <span className="num">★</span>
                      <span className="label">TJ Mentor Check-In · Required</span>
                    </div>
                    <div className="editorial-card-body">
                      <p className="text-xs mb-3" style={{ color: c.subtext }}>
                        Answer each question in your own words to continue. Even one short sentence is enough — TJ just wants to hear your thinking.
                      </p>
                      <div className="space-y-3">
                        {narrative.mentor_check_in.map((q: string, i: number) => {
                          const val = mentorCheckInAnswers[i] || "";
                          const ok = val.trim().length >= 3;
                          return (
                            <div key={i}>
                              <label className="block text-sm font-medium leading-relaxed mb-1.5" style={{ color: c.bodyText }}>
                                <span className="mr-1.5 font-semibold" style={{ color: step.color }}>{i + 1}.</span>{q}
                              </label>
                              <div className="relative">
                                <textarea
                                  value={val}
                                  onChange={(e) => setMentorCheckInAnswers((m) => ({ ...m, [i]: e.target.value }))}
                                  placeholder="Type or speak your answer…"
                                  className="w-full min-h-[72px] p-2.5 pr-10 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                                  style={{
                                    border: `1px solid ${ok ? "hsl(145 45% 55%)" : "hsl(0 0% 0% / 0.14)"}`,
                                    color: c.bodyText,
                                    background: "hsl(40 30% 99%)",
                                    fontFamily: "var(--font-body)",
                                  }}
                                />
                                <div className="absolute right-1.5 bottom-1.5">
                                  <SpeechToTextButton
                                    onTranscript={(text) =>
                                      setMentorCheckInAnswers((m) => ({
                                        ...m,
                                        [i]: m[i] ? `${m[i]} ${text}` : text,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              {ok && (
                                <p className="text-[11px] mt-1" style={{ color: "hsl(145 40% 40%)" }}>✓ Got it</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {!mentorCheckInComplete && (
                        <p className="text-xs mt-3 italic" style={{ color: "hsl(25 65% 45%)" }}>
                          Answer all {narrative.mentor_check_in.length} questions to continue to the next step.
                        </p>
                      )}
                    </div>
                  </article>
                )}

                {narrative.purpose && (
                  <p className="editorial-pullquote mt-4">
                    <span className="pq-eyebrow">Purpose</span>
                    {narrative.purpose}
                  </p>
                )}

                <div className="mt-4">
                  <SpeakButton
                    text={`${narrative.key_point || ""}. ${(narrative.sections || []).map((s: any) => `${s.heading}. ${s.body}`).join(" ")}. ${narrative.memory_cue || ""}.`}
                    size="sm"
                    label="Listen to lesson"
                  />
                </div>
              </EditorialShell>
            </motion.div>
          );
        }

        // Fallback: legacy AI-generated expandedInfo, restyled editorially.
        return (
          <motion.div key="information" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <p className="editorial-subhead mb-3">
                {block.affirmation || `Let's explore ${block.term_title} more deeply.`}
              </p>

              {imageUrl && (
                <figure className="editorial-figure mb-4">
                  <img src={imageUrl} alt={`Visual reference for ${block.term_title}`} loading="lazy" />
                  <figcaption>
                    <span>Plate · {block.term_title}</span>
                    <span style={{ color: step.color }}>The Full Story</span>
                  </figcaption>
                </figure>
              )}

              {infoLoading && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                  <p className="text-sm" style={{ color: c.subtext }}>TJ is preparing your lesson…</p>
                </div>
              )}

              {expandedInfo && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {(() => {
                    const sections = expandedInfo.split(/^## /m).filter(Boolean).map(s => {
                      const lines = s.trim().split("\n");
                      const title = lines[0]?.trim() || "";
                      const body = lines.slice(1).join("\n").trim();
                      return { title, body };
                    });

                    if (sections.length === 0) {
                      return (
                        <article className="editorial-card">
                          <div className="editorial-card-header"><span className="num">01</span><span className="label">Lesson</span></div>
                          <div className="editorial-card-body editorial-dropcap">
                            <ReactMarkdown>{expandedInfo}</ReactMarkdown>
                          </div>
                        </article>
                      );
                    }

                    return sections.map((sec, i) => (
                      <article key={i} className="editorial-card">
                        <div className="editorial-card-header">
                          <span className="num">{String(i + 1).padStart(2, "0")}</span>
                          <span className="label">Section</span>
                          <span className="title">{sec.title}</span>
                        </div>
                        <div className="editorial-card-body editorial-dropcap">
                          <ReactMarkdown
                            components={{
                              p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                            }}
                          >{sec.body || "Content is being prepared…"}</ReactMarkdown>
                        </div>
                      </article>
                    ));
                  })()}
                  <div className="pt-1">
                    <SpeakButton text={expandedInfo.slice(0, 2000)} size="sm" label="Listen to full lesson" />
                  </div>
                </motion.div>
              )}

              {!expandedInfo && !infoLoading && (
                <p className="editorial-card-body italic rounded-xl" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  Lesson content for this term hasn't been added yet.
                </p>
              )}
            </EditorialShell>
          </motion.div>
        );
      }

      case "reflection": {
        return (
          <motion.div key="reflection" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <p className="editorial-eyebrow mb-2">The Prompt</p>
              <p className="font-display text-2xl leading-snug mb-2" style={{ color: step.color, letterSpacing: "-0.01em" }}>
                How does <em>{block.term_title}</em> connect to your experience?
              </p>
              <p className="editorial-subhead mb-4">
                {block.reflection_prompt || `Think about the metaphor above. In your own words, explain what ${block.term_title} means and why it matters in your career.`}
              </p>

              <article className="editorial-card">
                <div className="editorial-card-header"><span className="num">✎</span><span className="label">Your Words</span></div>
                <div className="editorial-card-body">
                  <div className="relative">
                    <textarea
                      placeholder="Write or speak your reflection…"
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      className="w-full min-h-[140px] p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                      style={{ border: "1px solid hsl(0 0% 0% / 0.12)", color: c.bodyText, background: "hsl(40 30% 99%)", fontFamily: "var(--font-body)" }}
                    />
                    <div className="absolute right-2 bottom-2">
                      <SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} />
                    </div>
                  </div>
                  {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving…</p>}
                  {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
                </div>
              </article>

              {/* Learner Behavior Intake — captures confidence, thinking path, etc. */}
              <BehaviorIntakeStrip
                intake={behaviorIntake}
                showExplainBack={true}
                showErrorPicker={
                  !!tjFeedbackByStage.reflection &&
                  tjFeedbackByStage.reflection.decision.completion_state !== "complete"
                }
                attemptCount={tjFeedbackByStage.reflection?.interpretation?.word_count ? 1 : 1}
                accentColor={step.color}
              />

              {/* Submit to TJ Engine for inline structured feedback */}
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs px-4 shadow-md"
                  style={{ background: step.gradient, color: "white" }}
                  disabled={!journalNote.trim() || tjSubmitting === "reflection"}
                  onClick={() => submitToTJ("reflection", journalNote)}
                >
                  {tjSubmitting === "reflection" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading…</>
                  ) : (
                    <>Submit to TJ <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>

              {tjFeedbackByStage.reflection && (
                <TJFeedbackPanel
                  evaluation={tjFeedbackByStage.reflection}
                  accentColor={step.color}
                  actions={tjActionsFor("reflection")}
                  behaviorSuggestion={behaviorSuggestionByStage.reflection}
                />
              )}

              {block.metaphor && (
                <blockquote className="editorial-pullquote mt-4">
                  <span className="pq-eyebrow">Recall the Metaphor</span>
                  "{block.metaphor}"
                </blockquote>
              )}
            </EditorialShell>
          </motion.div>
        );
      }

      case "application": {
        return (
          <motion.div key="application" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <p className="editorial-card-body editorial-dropcap rounded-xl mb-4" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                {block.practice_scenario || `Imagine you're in the salon and a client asks about ${block.term_title}. How would you explain it in your own words?`}
              </p>

              <article className="editorial-card">
                <div className="editorial-card-header"><span className="num">⚒</span><span className="label">Apply It</span></div>
                <div className="editorial-card-body">
                  <div className="relative">
                    <textarea
                      placeholder="Write your response here…"
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      className="w-full min-h-[140px] p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                      style={{ border: "1px solid hsl(0 0% 0% / 0.12)", color: c.bodyText, background: "hsl(40 30% 99%)", fontFamily: "var(--font-body)" }}
                    />
                    <div className="absolute right-2 bottom-2">
                      <SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} />
                    </div>
                  </div>
                  {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving…</p>}
                  {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
                </div>
              </article>

              {/* Learner Behavior Intake — captures confidence, thinking path, etc. */}
              <BehaviorIntakeStrip
                intake={behaviorIntake}
                showExplainBack={true}
                showErrorPicker={
                  !!tjFeedbackByStage.application &&
                  tjFeedbackByStage.application.decision.completion_state !== "complete"
                }
                accentColor={step.color}
              />

              {/* Submit to TJ Engine for inline structured feedback */}
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs px-4 shadow-md"
                  style={{ background: step.gradient, color: "white" }}
                  disabled={!journalNote.trim() || tjSubmitting === "application"}
                  onClick={() => submitToTJ("application", journalNote)}
                >
                  {tjSubmitting === "application" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading…</>
                  ) : (
                    <>Submit to TJ <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>

              {tjFeedbackByStage.application && (
                <TJFeedbackPanel
                  evaluation={tjFeedbackByStage.application}
                  accentColor={step.color}
                  actions={tjActionsFor("application")}
                  behaviorSuggestion={behaviorSuggestionByStage.application}
                />
              )}
            </EditorialShell>
          </motion.div>
        );
      }

      case "quiz":
        return (
          <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <EditorialShell>
              <p className="editorial-eyebrow mb-2">🎓 State Board Practice</p>
              {aiLoading && (
                <div className="flex items-center justify-center gap-3 py-10">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                  <p className="text-sm" style={{ color: c.subtext }}>Generating question…</p>
                </div>
              )}
              {quizQuestion && quizOptions.length > 0 && (() => {
                const seed = `${block.id}-${quizQuestion.slice(0, 32)}`;
                const rawA = String(quizOptions[0] || "").replace(/^[A-D]\)\s*/, "");
                const rawB = String(quizOptions[1] || "").replace(/^[A-D]\)\s*/, "");
                const rawC = String(quizOptions[2] || "").replace(/^[A-D]\)\s*/, "");
                const rawD = String(quizOptions[3] || "").replace(/^[A-D]\)\s*/, "");
                const origCorrectLetter = ["A", "B", "C", "D"].find((L, i) => {
                  const txt = String(quizOptions[i] || "").replace(/^[A-D]\)\s*/, "");
                  return String(quizOptions[i]) === quizAnswer || txt === quizAnswer;
                }) || "A";
                const sh = shuffleOptions(
                  { A: rawA, B: rawB, C: rawC, D: rawD },
                  origCorrectLetter,
                  seed,
                );
                return (
                  <div className="space-y-4">
                    <p className="font-display text-lg leading-snug" style={{ color: c.termHeading }}>{quizQuestion}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sh.options.map((opt, i) => {
                        const letter = opt.letter;
                        const isSelected = quizSelected === letter;
                        const isCorrect = letter === sh.correctLetter;
                        const optionGradients = [
                          "linear-gradient(135deg, hsl(265 72% 52%), hsl(285 75% 58%))",
                          "linear-gradient(135deg, hsl(155 60% 42%), hsl(175 65% 48%))",
                          "linear-gradient(135deg, hsl(38 90% 52%), hsl(28 95% 58%))",
                          "linear-gradient(135deg, hsl(340 75% 55%), hsl(355 80% 60%))",
                        ];
                        let bg = optionGradients[i % 4];
                        let border = "transparent";
                        let textColor = "white";
                        if (quizRevealed && isSelected && isCorrect) { bg = "linear-gradient(135deg, hsl(145 55% 42%), hsl(155 60% 48%))"; border = "hsl(145 55% 35%)"; }
                        else if (quizRevealed && isSelected) { bg = "linear-gradient(135deg, hsl(0 65% 52%), hsl(10 70% 58%))"; border = "hsl(0 65% 42%)"; }
                        else if (quizRevealed && isCorrect) { bg = "linear-gradient(135deg, hsl(145 55% 42%), hsl(155 60% 48%))"; border = "hsl(145 55% 35%)"; }
                        else if (quizRevealed) { bg = "hsl(var(--muted))"; textColor = "hsl(var(--muted-foreground))"; }
                        return (
                          <motion.button
                            key={letter}
                            onClick={async () => {
                              if (quizRevealed) return;
                              setQuizSelected(letter);
                              setQuizRevealed(true);
                              setQuizFeedbackLocked(true);
                              const correct = isCorrect;
                              const isFirstAttempt = !quizAttempted;
                              setQuizAttempted(true);
                              updateDNA({ quizCorrect: correct, layerCompleted: "quiz" });
                              if (correct) {
                                addCoins(10, "correct");
                                await recordCorrect(block.id, false);
                              } else {
                                setMissedQuestionText(quizQuestion);
                                await recordIncorrect(block.id);
                                setIncorrectAttemptsCount((n) => n + 1);
                              }
                              await persistAssessmentDNA({ correct, isFirstAttempt });
                            }}
                            whileHover={!quizRevealed ? { scale: 1.03, y: -2 } : {}}
                            whileTap={!quizRevealed ? { scale: 0.97 } : {}}
                            className="relative text-left p-4 rounded-2xl text-sm font-semibold transition-all overflow-hidden shadow-md"
                            style={{
                              background: bg,
                              border: border !== "transparent" ? `2px solid ${border}` : undefined,
                              color: textColor,
                              minHeight: 88,
                              textShadow: textColor === "white" ? "0 1px 2px hsl(0 0% 0% / 0.2)" : "none",
                            }}
                            disabled={quizRevealed}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 + i * 0.06 }}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-display text-2xl font-bold opacity-90 leading-none">{letter}</span>
                              <span className="leading-snug pt-1">{opt.text}</span>
                            </div>
                            {quizRevealed && isCorrect && (
                              <CheckCircle2 className="absolute top-2 right-2 h-4 w-4" style={{ color: "white" }} />
                            )}
                            {quizRevealed && isSelected && !isCorrect && (
                              <XCircle className="absolute top-2 right-2 h-4 w-4" style={{ color: "white" }} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    {quizRevealed && (() => {
                      const wasCorrect = quizSelected === sh.correctLetter;
                      const correctText = sh.options.find(o => o.letter === sh.correctLetter)?.text || "";
                      const memoryLock = block.static_metaphor?.split("\n")[0]?.trim()
                        || `${block.term_title} — hold the core idea.`;
                      const accent = wasCorrect ? "hsl(145 55% 38%)" : "hsl(352 65% 50%)";
                      const accentSoft = wasCorrect ? "hsl(145 50% 96%)" : "hsl(352 70% 97%)";
                      const accentBorder = wasCorrect ? "hsl(145 45% 70%)" : "hsl(352 65% 78%)";

                      return (
                        <>
                        <motion.aside
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-2xl overflow-hidden mt-2"
                          style={{
                            background: accentSoft,
                            border: `2px solid ${accentBorder}`,
                            boxShadow: "0 12px 30px -12px hsl(0 0% 0% / 0.18)",
                          }}
                        >
                          <header
                            className="px-5 py-4 flex items-start gap-3"
                            style={{ borderBottom: `1px solid ${accentBorder}` }}
                          >
                            {wasCorrect ? (
                              <CheckCircle2 className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                            ) : (
                              <XCircle className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
                                Learning Checkpoint
                              </p>
                              <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight mt-1" style={{ color: "hsl(220 25% 18%)" }}>
                                {wasCorrect
                                  ? "Correct — you understood the function."
                                  : "Not quite — let’s correct the thinking."}
                              </h3>
                              <p className="text-sm italic mt-1" style={{ color: "hsl(220 15% 38%)" }}>
                                {wasCorrect
                                  ? "This is more than memorizing a definition."
                                  : "You are close. Now connect the function."}
                              </p>
                            </div>
                          </header>

                          <div className="px-5 py-4 space-y-4" style={{ background: "hsl(40 30% 99%)" }}>
                            {/* Body */}
                            <p className="text-[15px] leading-relaxed" style={{ color: "hsl(220 20% 22%)", fontFamily: "var(--font-body, inherit)" }}>
                              {wasCorrect
                                ? `${block.term_title} ${block.definition ? block.definition.charAt(0).toLowerCase() + block.definition.slice(1) : "works as a system, not just a label."} You recognized the system behind the word.`
                                : (
                                  <>
                                    The correct answer is <strong style={{ color: accent }}>“{correctText}.”</strong>{" "}
                                    {reteachText}
                                  </>
                                )}
                            </p>

                            {/* Memory Lock */}
                            <div
                              className="rounded-xl px-4 py-3"
                              style={{
                                background: "white",
                                border: "1px dashed hsl(220 15% 80%)",
                              }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(220 15% 45%)" }}>
                                Memory Lock
                              </p>
                              <p className="font-display text-base font-semibold mt-1" style={{ color: "hsl(220 25% 18%)" }}>
                                {memoryLock}
                              </p>
                            </div>

                            {/* DNA Insight */}
                            <div
                              className="rounded-xl px-4 py-3 flex items-start gap-3"
                              style={{
                                background: `${accent}10`,
                                border: `1px solid ${accentBorder}`,
                              }}
                            >
                              <span
                                className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full font-display text-xs font-bold"
                                style={{ background: accent, color: "white" }}
                              >
                                ✦
                              </span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
                                  DNA Insight
                                </p>
                                <p className="text-sm leading-snug mt-0.5" style={{ color: "hsl(220 20% 22%)" }}>
                                  {wasCorrect
                                    ? "Your Function Recognition strengthened. Recall accuracy +1."
                                    : "Your Function Recognition needs reinforcement. Try the recommended path below."}
                                </p>
                              </div>
                            </div>

                            {/* Action row — learner picks the next move */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {wasCorrect ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setQuizFeedbackLocked(false);
                                      persistAssessmentDNA({ correct: true, isFirstAttempt: false, reviewPath: "Stay In Lesson" });
                                    }}
                                    style={{ background: accent, color: "white" }}
                                  >
                                    Stay in Lesson
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => jumpToStepKey("definition", "Review Concept")}>
                                    Review Concept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setQuizSelected(null);
                                      setQuizRevealed(false);
                                      setQuizFeedbackLocked(false);
                                      persistAssessmentDNA({ correct: true, isFirstAttempt: false, reviewPath: "Practice Again" });
                                    }}
                                  >
                                    Practice Again
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                                    Exit Lesson
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setQuizSelected(null);
                                      setQuizRevealed(false);
                                      setQuizFeedbackLocked(false);
                                      persistAssessmentDNA({ correct: false, isFirstAttempt: false, reviewPath: "Try Again" });
                                    }}
                                    style={{ background: accent, color: "white" }}
                                  >
                                    Try Again
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => jumpToStepKey("breakdown", "Review Breakdown")}>
                                    Review Breakdown
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => jumpToStepKey("metaphor", "Review Metaphor")}>
                                    Review Metaphor
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setQuizFeedbackLocked(false);
                                      persistAssessmentDNA({ correct: false, isFirstAttempt: false, reviewPath: "Stay In Lesson" });
                                    }}
                                  >
                                    Stay in Lesson
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                                    Exit Lesson
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.aside>
                        {!wasCorrect && (
                          <div className="mt-3">
                            <ExplainItBackLayer
                              termId={block.id}
                              trigger="missed_question"
                              contextRef={`missed_question:${(missedQuestionText || quizQuestion || "").slice(0, 80)}`}
                            />
                          </div>
                        )}
                        {!wasCorrect && incorrectAttemptsCount >= REPEATED_STRUGGLE_THRESHOLD && !breakdownAcked && !breakdownRouteCard && (
                          <div className="mt-3">
                            <BreakdownPointPrompt
                              incorrectAttempts={incorrectAttemptsCount}
                              dominantPattern={dominantBreakdownPattern}
                              onPick={async (point) => {
                                const route = resolveBreakdownRoute(point);
                                const routedTo =
                                  route.kind === "step" ? `step:${route.stepKey}` : route.kind;
                                if (user?.id) {
                                  try {
                                    await recordBreakdownPoint({
                                      userId: user.id,
                                      termId: block.id,
                                      moduleId: (block as any)?.module_id ?? null,
                                      point,
                                      incorrectAttempts: incorrectAttemptsCount,
                                      routedTo,
                                    });
                                  } catch (err) {
                                    console.error("[breakdown-point] record failed", err);
                                  }
                                }
                                setBreakdownAcked(true);
                                if (route.kind === "step") {
                                  const idx = adaptedSteps.findIndex((s) => s.key === route.stepKey);
                                  if (idx >= 0) {
                                    stopSpeaking();
                                    setQuizSelected(null);
                                    setQuizRevealed(false);
                                    setCurrentStep(idx);
                                    return;
                                  }
                                }
                                setBreakdownRouteCard(route);
                              }}
                              onDismiss={() => setBreakdownAcked(true)}
                            />
                          </div>
                        )}
                        {breakdownRouteCard && (
                          <div
                            className="mt-3 rounded-2xl border p-5 space-y-2"
                            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(265 60% 45%)" }}>
                              {breakdownRouteCard.kind === "question_strategy" && "Question-Reading Strategy"}
                              {breakdownRouteCard.kind === "comparison_card" && "Compare the Answer Choices"}
                              {breakdownRouteCard.kind === "guided_reset" && "Guided Reset"}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                              {breakdownRouteCard.kind === "question_strategy" && (
                                <>Read the question twice before glancing at choices. Underline the verb (define, identify, choose). Then translate the question into your own words — what is it really asking?</>
                              )}
                              {breakdownRouteCard.kind === "comparison_card" && (
                                <>Compare the two choices that feel closest. What single word makes them different? Eliminate the one that doesn't match the question's verb, then re-read the remaining option.</>
                              )}
                              {breakdownRouteCard.kind === "guided_reset" && (
                                <>Take a breath. We'll start fresh from the Definition layer with a simpler breakdown — no pressure, no scoring this round.</>
                              )}
                            </p>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setBreakdownRouteCard(null);
                                  if (breakdownRouteCard?.kind === "guided_reset") {
                                    const idx = adaptedSteps.findIndex((s) => s.key === "definition");
                                    if (idx >= 0) {
                                      stopSpeaking();
                                      setQuizSelected(null);
                                      setQuizRevealed(false);
                                      setCurrentStep(idx);
                                    }
                                  }
                                }}
                              >
                                {breakdownRouteCard.kind === "guided_reset" ? "Start the reset" : "Got it"}
                              </Button>
                            </div>
                          </div>
                        )}
                        </>
                      );
                    })()}
                  </div>
                );
              })()}
              {!hasBuiltinQuiz && !aiQuestion && !aiLoading && (
                <p className="editorial-card-body italic rounded-xl" style={{ background: "hsl(40 35% 99%)", border: "1px solid hsl(0 0% 0% / 0.08)" }}>
                  No assessment question has been added for this term yet.
                </p>
              )}
            </EditorialShell>
          </motion.div>
        );

      case "recall_reconstruction":
        return (
          <EditorialShell>
            <RecallReconstruction
              termId={block.id}
              termTitle={block.term_title}
              definition={block.definition || ""}
              accentColor={step.color}
              onTriggerReinforcement={() => setStrengthenOpen(true)}
              onComplete={() => {
                markStepDone();
                if (currentStep < adaptedSteps.length - 1) setCurrentStep((s) => s + 1);
              }}
            />
          </EditorialShell>
        );

      default: return null;
    }
  };

  /* ─── Completion Screen ─── */
  if (completed) {
    const quizPassed = quizRevealed && quizSelected && (
      (hasBuiltinQuiz && block.quiz_options.map(String).some((opt, i) => String.fromCharCode(65 + i) === quizSelected && (String(opt) === quizAnswer || String(opt).replace(/^[A-D]\)\s*/, "") === quizAnswer))) ||
      (!hasBuiltinQuiz && aiQuestion && aiQuestion.options.some((opt, i) => String.fromCharCode(65 + i) === quizSelected && (String(opt) === aiQuestion.answer || String(opt).replace(/^[A-D]\)\s*/, "") === aiQuestion.answer)))
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent variant="fullscreen" style={{ background: "hsl(var(--background))" }}>
          <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.12 }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.88) 0%, hsl(0 0% 98% / 0.92) 100%)" }} />
          <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center justify-center text-center p-6 space-y-6" style={{ WebkitOverflowScrolling: "touch" }}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.6 }}>
              <CheckCircle2 className="h-20 w-20 mx-auto" style={{ color: "hsl(145 55% 42%)" }} />
            </motion.div>
            <motion.h2 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: c.heading }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              You just completed this concept.
            </motion.h2>
            <motion.p className="text-lg max-w-md italic" style={{ color: c.subtext }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              "See… you understood that."
            </motion.p>
            <motion.p className="text-sm" style={{ color: c.subtext }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              +15 coins earned • {adaptedSteps.length} layers completed
            </motion.p>

            {/* Performance Feedback */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="w-full max-w-sm rounded-2xl p-5 space-y-3 text-left" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-center text-muted-foreground">Performance Summary</p>
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: quizPassed ? "hsl(145 40% 95%)" : "hsl(25 60% 95%)" }}>
                {quizPassed ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(145 50% 40%)" }} /> : <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(25 60% 45%)" }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: quizPassed ? "hsl(145 35% 25%)" : "hsl(25 40% 25%)" }}>
                    Knowledge Check: {quizPassed ? "Passed ✓" : "Needs Practice"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quizPassed ? "Great recall — you're building exam readiness." : "Review this concept and try again for stronger retention."}
                  </p>
                </div>
              </div>
              {journalNote.length > 0 && (
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "hsl(145 40% 95%)" }}>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(145 50% 40%)" }} />
                  <p className="text-sm" style={{ color: "hsl(145 35% 25%)" }}>Reflection completed ✓</p>
                </div>
              )}
            </motion.div>

            {/* Voice */}
            <SpeakButton text="That's how we learn… not memorize. You just built real understanding." size="sm" label="Hear TJ" />

            {/* Next Steps */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="flex flex-col gap-3 w-full max-w-sm">
              {!quizPassed && (
                <Button size="lg" variant="outline" className="w-full gap-2 text-base py-5"
                  style={{ borderColor: "hsl(25 60% 50%)", color: "hsl(25 60% 40%)" }}
                  onClick={() => { setCompleted(false); setCurrentStep(adaptedSteps.length - 1); setQuizSelected(null); setQuizRevealed(false); setAiQuestion(null); completedRef.current = false; }}>
                  <RefreshCw className="h-4 w-4" /> Practice This
                </Button>
              )}
              <Button size="lg" className="w-full gap-2 text-base py-5 shadow-lg"
                style={{ background: "linear-gradient(135deg, hsl(265 72% 48%), hsl(215 80% 42%))", color: "white" }}
                onClick={() => onOpenChange(false)}>
                <ArrowRight className="h-5 w-5" /> Next Concept
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ─── Main Layout ─── */
  return (
    <Dialog open={open} onOpenChange={(o) => {
      // LOCK the dialog while a reinforcement loop is active.
      if (!o && !reinforcementResolved) return;
      if (!o) stopSpeaking();
      onOpenChange(o);
    }}>
      <DialogContent variant="fullscreen" style={{ background: "hsl(var(--background))" }} onPointerDownOutside={(e) => { if (!reinforcementResolved) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (!reinforcementResolved) e.preventDefault(); }}>
        {/* Locked reinforcement loop — gates progression after wrong in-flow quiz */}
        <ReinforcementDialog
          open={reinforcementOpen}
          onResolved={({ passed }) => {
            setReinforcementOpen(false);
            setReinforcementResolved(true);
            if (passed) {
              // Mark the quiz as correctly resolved so they can advance
              setQuizSelected(null);
              setQuizRevealed(true);
            }
          }}
          termId={block.id}
          term={block.term_title}
          definition={block.definition}
          metaphor={block.metaphor}
          missedQuestion={missedQuestionText || quizQuestion || `Question about ${block.term_title}`}
          missedAnswerExplanation={block.definition}
        />
        {/* NEW: "Strengthen This Layer" reinforcement loop (recall < 60%) */}
        <StrengthenLayerDialog
          open={strengthenOpen}
          onOpenChange={setStrengthenOpen}
          termId={block.id}
          termTitle={block.term_title}
          definition={block.definition || ""}
          metaphor={block.metaphor || (block as any).static_metaphor}
          visualDesc={block.visualization_desc || (block as any).static_visualize}
          microBreakdown={(block as any).static_break_it_down}
          imageUrl={imageUrl}
          onResolved={({ passed }) => {
            markStepDone();
            if (passed && currentStep < adaptedSteps.length - 1) setCurrentStep((s) => s + 1);
          }}
        />
        {/* Subtle BG */}
        <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.06, filter: "brightness(1.2)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.94) 0%, hsl(0 0% 98% / 0.96) 100%)" }} />

        {/* ═══════ ENTRY POINT GATE — fires before each new term begins ═══════ */}
        {!entryChosen && (
          <div className="relative z-10 flex-1 overflow-y-auto">
            <EntryPointGate
              termId={block.id}
              moduleId={(block as any).module_id ?? null}
              termTitle={block.term_title}
              onChosen={(path, routeTo) => {
                setEntryPath(path);
                setEntryChosen(true);
                const idx = adaptedSteps.findIndex((s) => s.key === routeTo);
                if (idx >= 0) setCurrentStep(idx);
              }}
              onSkip={() => {
                setEntryChosen(true);
                setCurrentStep(0);
              }}
            />
          </div>
        )}

        {entryChosen && (
        <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* ═══════ TOP SECTION ═══════ */}
          <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b" style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)" }}>
            {/* Avatar + Caption + Voice Controls */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-11 w-11 flex-shrink-0" style={{ outline: `2px solid ${step.color}`, outlineOffset: "2px" }}>
                <AvatarImage src={tjBackground} alt="TJ" className="object-cover" />
                <AvatarFallback className="text-xs font-bold" style={{ background: step.color, color: "white" }}>TJ</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs italic leading-snug" style={{ color: step.color }}>"{adaptCaption(step.key, getAdaptedCaption(step.caption, step.key))}"</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isSpeaking && (
                  <button onClick={stopSpeaking} className="p-1.5 rounded-full hover:bg-gray-100">
                    <Square className="h-3.5 w-3.5" style={{ color: step.color }} />
                  </button>
                )}
                <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-1.5 rounded-full hover:bg-gray-100">
                  {voiceEnabled ? <Volume2 className="h-4 w-4" style={{ color: step.color }} /> : <VolumeX className="h-4 w-4" style={{ color: c.subtext }} />}
                </button>
              </div>
            </div>

            {/* Term + Progress */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold truncate" style={{ color: c.heading }}>{block.term_title}</h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: c.subtext }}>{profile?.selected_program || "Cosmetology"}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-semibold" style={{ color: step.color }}>Step {currentStep + 1} of {adaptedSteps.length}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2"><Progress value={progressPercent} className="h-1.5" /></div>

            {/* DNA-ordered tile navigator (replaces linear step pills) */}
            <div className="mt-3">
              <LayerBlockNavigator
                steps={adaptedSteps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onSelect={jumpToStep}
                locked={!reinforcementResolved}
              />
            </div>

            {/* Why This Step Matters */}
            <button onClick={() => setShowNeuro(!showNeuro)} className="w-full mt-2 text-[10px] text-center flex items-center justify-center gap-1 hover:opacity-80" style={{ color: c.subtext }}>
              🧠 Why This Step Matters {showNeuro ? "▲" : "▼"}
            </button>
            <AnimatePresence>
              {showNeuro && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-[10px] text-center overflow-visible leading-relaxed mt-1 px-4" style={{ color: c.subtext }}>
                  {step.neuroNote}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════ ACTION BAR (tile-driven nav, no Back/Next) ═══════ */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-2 border-b" style={{ background: "hsl(var(--background) / 0.96)" }}>
            <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="gap-1 text-xs" style={{ color: c.subtext }}
                onClick={() => { speakText(`Let me explain ${block.term_title} another way…`); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Let TJ Explain Again
              </Button>
              <Button size="sm" className="gap-1 text-sm px-5 shadow-md"
                style={{ background: step.gradient, color: "white", opacity: (step.key === "quiz" || (mentorCheckInRequired && !mentorCheckInComplete)) ? 0.5 : 1 }}
                onClick={goNext}
                disabled={step.key === "quiz" || (mentorCheckInRequired && !mentorCheckInComplete)}>
                {mentorCheckInRequired && !mentorCheckInComplete
                  ? "🔒 Answer Check-In to Continue"
                  : step.key === "quiz" && !reinforcementResolved
                  ? "🔒 Reinforcement"
                  : step.key === "quiz" && quizFeedbackLocked
                  ? "Choose Next Action"
                  : step.key === "quiz"
                  ? "Stay in Lesson"
                  : currentStep === adaptedSteps.length - 1 ? "Complete" : "Mark Step Complete"}
                {currentStep < adaptedSteps.length - 1 && reinforcementResolved && !(mentorCheckInRequired && !mentorCheckInComplete) && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* ═══════ CENTER SECTION ═══════ */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 scrollbar-visible" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", scrollbarWidth: "auto", scrollbarColor: "hsl(0 0% 40%) transparent" }}>
            <div className="max-w-lg mx-auto pb-8 pt-2">
              {/* DNA Encouragement Banner */}
              {encouragementMsg && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-3 rounded-xl text-center text-sm font-medium"
                  style={{ background: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", border: "1px solid hsl(var(--border))" }}>
                  💜 {encouragementMsg}
                </motion.div>
              )}
              {/* Memory Cue Banner */}
              {rules.addMemoryCues && (step.key === "definition" || step.key === "information") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 px-4 py-2 rounded-lg text-xs text-center"
                  style={{ background: "hsl(45 80% 95%)", color: "hsl(45 50% 30%)", border: "1px solid hsl(45 60% 80%)" }}>
                  🔑 Key Point: Remember "{block.term_title}" — say it, picture it, connect it to something you know.
                </motion.div>
              )}
              {/* ═══════ Cognitive Load Indicator ═══════ */}
              {cogLoad.level !== "low" && !cogLoadAcked && (
                <div className="mb-4">
                  <CognitiveLoadPrompt
                    level={cogLoad.level as Exclude<CognitiveLoad, "low">}
                    reasons={cogLoad.reasons}
                    onAction={(action: CognitiveLoadAction) => {
                      // Persist the chosen action with the current snapshot
                      if (user?.id && block?.id) {
                        persistCognitiveLoad({
                          userId: user.id,
                          termId: block.id,
                          moduleId: (block as any)?.module_id ?? null,
                          sessionId: sessionIdRef.current,
                          reading: cogLoad,
                          signals: {
                            timeOnTermMs: Date.now() - termOpenedAtRef.current,
                            timeOnQuestionMs: questionOpenedAtRef.current ? Date.now() - questionOpenedAtRef.current : 0,
                            wrongAttempts: incorrectAttemptsCount,
                            fastClickingPattern,
                            longPausePattern,
                            skippedSections: skippedSectionsCount,
                          },
                          promptAction: action,
                        });
                      }
                      setCogLoadAcked(true);
                      // Route the chosen action
                      if (action === "show_visual") {
                        jumpToStepKey("visual", "Cognitive Load → Visual");
                      } else if (action === "show_metaphor") {
                        jumpToStepKey("metaphor", "Cognitive Load → Metaphor");
                      } else if (action === "tj_cafe") {
                        try { openTJCafe(); } catch {}
                      } else if (action === "simpler_question") {
                        // Reset quiz UI and re-trigger an AI-generated simpler item
                        setQuizSelected(null);
                        setQuizRevealed(false);
                        setAiQuestion(null);
                        const idx = adaptedSteps.findIndex((s) => s.key === "quiz");
                        if (idx >= 0) setCurrentStep(idx);
                      }
                      // "continue" = just dismiss
                    }}
                    onDismiss={() => setCogLoadAcked(true)}
                  />
                </div>
              )}
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </div>
          </div>
        </div>
        )}
      </DialogContent>
      <BreathPrompt
        open={breathOpen}
        reasons={breathReasons}
        onChoose={handleBreathChoice}
        onDismiss={handleBreathDismiss}
      />
    </Dialog>
  );
};

export default LearningOrbDialog;
