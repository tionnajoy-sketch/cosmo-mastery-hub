import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { stopGlobalNarration } from "@/hooks/useAutoNarrate";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, RefreshCw, Sparkles,
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
import TJLearningStudio from "@/components/TJLearningStudio";
import TJVisualEngine from "@/components/TJVisualEngine";
import { LayerBlockSection, getBlockOpenState } from "@/components/LayerBlockSection";
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";
import ReinforcementDialog from "@/components/ReinforcementDialog";
import { useReinforcement } from "@/hooks/useReinforcement";
import { shuffleOptions } from "@/lib/shuffleOptions";
import LayerBlockNavigator from "@/components/LayerBlockNavigator";

const c = pageColors.study;

/* ─── 9-Step Configuration ─── */
interface StepDef {
  key: string;
  label: string;
  color: string;
  gradient: string;
  caption: string;
  neuroNote: string;
}

const STEPS: StepDef[] = [
  {
    key: "visual",
    label: "Visualize",
    color: "hsl(215 80% 42%)",
    gradient: "linear-gradient(135deg, hsl(215 80% 42%), hsl(200 85% 48%))",
    caption: "Let's see it… your visual cortex remembers images 60,000x faster.",
    neuroNote: "Visual encoding creates dual pathways — verbal + visual — doubling retention.",
  },
  {
    key: "definition",
    label: "Define",
    color: "hsl(45 90% 40%)",
    gradient: "linear-gradient(135deg, hsl(45 90% 40%), hsl(38 95% 48%))",
    caption: "Now let's understand what it means…",
    neuroNote: "Cognitive labeling anchors meaning in your semantic memory network.",
  },
  {
    key: "scripture",
    label: "Scripture",
    color: "hsl(30 60% 42%)",
    gradient: "linear-gradient(135deg, hsl(30 60% 42%), hsl(25 65% 50%))",
    caption: "Let's read the original passage together…",
    neuroNote: "Reading source material in context strengthens comprehension and retention through contextual encoding.",
  },
  {
    key: "breakdown",
    label: "Break It Down",
    color: "hsl(185 55% 42%)",
    gradient: "linear-gradient(135deg, hsl(185 55% 42%), hsl(195 60% 48%))",
    caption: "Let's learn how to say this word first…",
    neuroNote: "Phonetic decoding activates language processing centers, building neural pathways for recall.",
  },
  {
    key: "recognize",
    label: "Recognize",
    color: "hsl(275 70% 50%)",
    gradient: "linear-gradient(135deg, hsl(275 70% 50%), hsl(285 75% 56%))",
    caption: "Can you identify it now? Let's test your recognition…",
    neuroNote: "Spatial memory and recall systems strengthen through active identification.",
  },
  {
    key: "metaphor",
    label: "Metaphor",
    color: "hsl(265 72% 48%)",
    gradient: "linear-gradient(135deg, hsl(265 72% 48%), hsl(255 78% 54%))",
    caption: "Stay with me… this is where it clicks.",
    neuroNote: "Metaphors activate the limbic system, linking knowledge to emotion for lasting memory.",
  },
  {
    key: "information",
    label: "Information",
    color: "hsl(320 55% 48%)",
    gradient: "linear-gradient(135deg, hsl(320 55% 48%), hsl(330 60% 54%))",
    caption: "Let me share more about this with you…",
    neuroNote: "Elaborative encoding strengthens comprehension through expanded context and reasoning.",
  },
  {
    key: "reflection",
    label: "Reflect",
    color: "hsl(25 65% 50%)",
    gradient: "linear-gradient(135deg, hsl(25 65% 50%), hsl(30 70% 55%))",
    caption: "Connect this to the metaphor and your life…",
    neuroNote: "Metacognition and self-referencing activate the prefrontal cortex for deep internalization.",
  },
  {
    key: "application",
    label: "Apply",
    color: "hsl(145 65% 32%)",
    gradient: "linear-gradient(135deg, hsl(145 65% 32%), hsl(155 70% 38%))",
    caption: "Now put your knowledge to work…",
    neuroNote: "Active recall and problem-solving transfer knowledge from short-term to long-term memory.",
  },
  {
    key: "quiz",
    label: "Assess",
    color: "hsl(0 75% 45%)",
    gradient: "linear-gradient(135deg, hsl(0 75% 45%), hsl(10 80% 50%))",
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
    if (b.static_assess_question) {
      b.quiz_question = b.static_assess_question;
      b.quiz_answer = b.static_assess_answer || b.quiz_answer;
    }
    return b;
  }, [rawBlock]);

  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled } = useSoundsEnabled();
  const { dna, rules, context: dnaContext, updateDNA, getEncouragement, getAdaptedCaption } = useDNAAdaptation();
  const blockState = (type: Parameters<typeof getBlockOpenState>[1]) => getBlockOpenState(dnaContext, type);
  const { adaptCaption, toneProfile } = useTJTone();
  // Filter out scripture step if block has no source text/page reference
  const hasScripture = !!(block?.source_text || block?.page_reference);
  const availableSteps = useMemo(() => {
    if (hasScripture) return STEPS;
    return STEPS.filter(s => s.key !== "scripture");
  }, [hasScripture]);

  // Reorder steps based on DNA layer strength
  const adaptedSteps = useMemo(() => {
    if (!dna) return availableSteps;
    const LAYER_MAP: Record<string, string> = { D: "definition", V: "visual", M: "metaphor", I: "information", R: "reflection", A: "application", K: "quiz", B: "breakdown", N: "recognize", S: "scripture" };
    const preferred = LAYER_MAP[dna.layerStrength];
    if (!preferred) return availableSteps;
    // Keep first step (Visualize), move preferred step to second position
    const rest = availableSteps.filter(s => s.key !== availableSteps[0].key && s.key !== preferred);
    const preferredStep = availableSteps.find(s => s.key === preferred);
    if (!preferredStep) return availableSteps;
    return [availableSteps[0], preferredStep, ...rest];
  }, [dna, availableSteps]);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completed, setCompleted] = useState(false);
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

  // Etymology
  const [etymology, setEtymology] = useState<{ parts: { part: string; meaning: string; origin: string }[]; pronunciation: string; summary: string } | null>(null);
  const [etymLoading, setEtymLoading] = useState(false);

  // Information (expanded)
  const [expandedInfo, setExpandedInfo] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);

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
      setImageUrl(block.image_url || "");
      setJournalNote(block.user_notes || "");
      setQuizSelected(null);
      setQuizRevealed(false);
      setAiQuestion(null);
      setRecognizeSelected(null);
      setRecognizeRevealed(false);
      setEtymology(null);
      setExpandedInfo("");
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

  // Load saved data for builtin
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

  // Auto-fetch etymology on breakdown step
  useEffect(() => {
    if (!block) return;
    const s = adaptedSteps[currentStep];
    if (s?.key === "breakdown" && !etymology && !etymLoading) {
      fetchEtymology();
    }
    if (s?.key === "quiz" && !block.quiz_question && !aiQuestion && !aiLoading) {
      generateQuizQuestion();
    }
    // Auto-fetch deep teaching when landing on the Information step
    if (s?.key === "information" && !expandedInfo && !infoLoading) {
      fetchExpandedInfo();
    }
  }, [currentStep, block?.id]);

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

  if (!block) return null;

  const step = adaptedSteps[currentStep];
  const progressPercent = ((currentStep + 1) / adaptedSteps.length) * 100;

  // DNA-adapted encouragement message
  const encouragementMsg = rules.toneModifier === "supportive" ? getEncouragement() : null;

  const markStepDone = () => {
    setCompletedSteps((prev) => {
      const n = new Set(prev);
      n.add(currentStep);
      return n;
    });
  };

  const goNext = () => {
    stopSpeaking();
    // Track DNA updates based on current step
    if (step.key === "reflection" && journalNote.length > 0) {
      updateDNA({ layerCompleted: "reflection", reflectionLength: journalNote.length });
    } else if (step.key === "application") {
      updateDNA({ layerCompleted: "application" });
    } else {
      updateDNA({ layerCompleted: step.key, timeSpentSeconds: 30 });
    }

    // Quiz step requires an answer before completing
    if (step.key === "quiz" && !quizRevealed) return;
    // GATE: lock progression while reinforcement is unresolved
    if (step.key === "quiz" && !reinforcementResolved) return;

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

  const fetchEtymology = async () => {
    setEtymLoading(true);
    try {
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Break down the word "${block.term_title}" into its etymological parts. Respond ONLY with JSON: {"pronunciation":"...", "parts":[{"part":"...","meaning":"...","origin":"Latin/Greek/etc"}], "summary":"one sentence explaining why the word makes sense"}. No markdown.`,
          }],
          sectionName: "Etymology",
        },
      });
      const text = data?.response || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) setEtymology(JSON.parse(match[0]));
    } catch {}
    setEtymLoading(false);
  };

  const fetchExpandedInfo = async () => {
    setInfoLoading(true);
    try {
      const depthInstruction = rules.contentDepth === "brief"
        ? "Keep each section to 1-2 sentences."
        : rules.contentDepth === "deep"
        ? "Go deep with thorough paragraphs and connections."
        : "Keep it concise but thorough — 2-3 sentences each.";
      const programName = profile?.selected_program || "cosmetology";
      const dnaLayer = dna?.layerStrength || "D";
      const toneMode = toneProfile || "encouraging";
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `You are TJ Anderson, a warm and knowledgeable mentor. Provide a deeper teaching for "${block.term_title}" (definition: "${block.definition}").

Structure your response with these EXACT section headers using markdown ##:

## Simple Explanation
A clear, plain-language explanation anyone can understand.

## The Lesson
Teach the concept more deeply — help the student truly understand it, not just memorize it.

## History & Origin
Where did this word or concept come from? What's the etymology or historical background?

## Why It Matters
Why is this important in ${programName}? Connect it to real practice and career success.

## How This Fits You
Personalize this for a learner whose strongest learning layer is "${dnaLayer}" and who prefers a "${toneMode}" teaching style. Speak directly to them.

${depthInstruction}
Do NOT use code fences. Write in a warm, ${toneMode} tone throughout.`,
          }],
          sectionName: "Deep Teaching",
        },
      });
      const info = data?.response || "";
      setExpandedInfo(info);
      if (info && voiceEnabled) speakText(info.slice(0, 1000));
    } catch {}
    setInfoLoading(false);
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
        if (mode === "uploaded") await supabase.from("uploaded_module_blocks").update({ image_url: url }).eq("id", block.id);
      }
    } catch {} finally { setImageLoading(false); }
  };

  const generateQuizQuestion = async () => {
    setAiLoading(true);
    try {
      const difficultyHint = rules.difficulty === "guided"
        ? "Make the question straightforward with clear options. Add a hint."
        : rules.difficulty === "challenge"
        ? "Make the question challenging — use scenario-based or application-style questions."
        : "Standard difficulty for exam preparation.";
      const programName = profile?.selected_program || "cosmetology";
      const { data } = await supabase.functions.invoke("ai-mentor-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Create a ${programName} exam-style multiple choice question about "${block.term_title}". Definition: "${block.definition}". ${difficultyHint} Respond ONLY with JSON: {"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"the full text of the correct option"}. No markdown.`,
          }],
          sectionName: "State Board Quiz",
        },
      });
      const text = data?.response || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) setAiQuestion(JSON.parse(match[0]));
    } catch {}
    setAiLoading(false);
  };

  const hasBuiltinQuiz = block.quiz_question && block.quiz_options?.length > 0;
  const quizQuestion = hasBuiltinQuiz ? block.quiz_question : aiQuestion?.question;
  const quizOptions = hasBuiltinQuiz ? block.quiz_options.map(String) : (aiQuestion?.options || []);
  const quizAnswer = hasBuiltinQuiz ? block.quiz_answer : (aiQuestion?.answer || "");

  /* ─── Render Center Content ─── */
  const renderContent = () => {
    switch (step.key) {
      case "breakdown":
        return (
          <motion.div key="breakdown" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6 py-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center" style={{ color: step.color }}>{block.term_title}</h2>
            {etymLoading ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>Breaking down the word…</p>
              </div>
            ) : etymology ? (
              <div className="space-y-4">
                {etymology.pronunciation && (
                  <div className="text-center">
                    <p className="text-lg italic" style={{ color: c.subtext }}>{etymology.pronunciation}</p>
                    <SpeakButton text={block.term_title} size="sm" label="Hear it" />
                  </div>
                )}
                <div className="space-y-3">
                  {etymology.parts.map((part, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
                    >
                      <div className="flex-1">
                        <span className="font-bold text-lg" style={{ color: step.color }}>{part.part}</span>
                        <span className="text-sm ml-2" style={{ color: c.bodyText }}>= {part.meaning}</span>
                        <p className="text-xs mt-0.5" style={{ color: c.subtext }}>({part.origin})</p>
                      </div>
                      <SpeakButton text={`${part.part} means ${part.meaning}`} size="icon" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-center text-sm leading-relaxed" style={{ color: c.bodyText }}>{etymology.summary}</p>
                <div className="flex items-center justify-center gap-2">
                  <SpeakButton text={etymology.summary} size="sm" label="Listen" />
                  <SpeechToTextButton onTranscript={() => {}} className="opacity-60" />
                </div>
              </div>
            ) : (
              <Button onClick={fetchEtymology} className="mx-auto flex gap-2" style={{ background: step.gradient, color: "white" }}>
                <Sparkles className="h-4 w-4" /> Break Down This Word
              </Button>
            )}
          </motion.div>
        );

      case "definition":
        return (
          <motion.div key="definition" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center text-center space-y-6 py-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight" style={{ color: step.color }}>{block.term_title}</h2>
            <div className="w-16 h-0.5 rounded-full" style={{ background: step.gradient }} />
            <p className="text-lg sm:text-xl leading-relaxed max-w-lg" style={{ color: c.bodyText }}>{block.definition}</p>
            <SpeakButton text={`${block.term_title}. ${block.definition}`} size="sm" label="Listen" />
          </motion.div>
        );

      case "scripture":
        return (
          <motion.div key="scripture" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center space-y-6 py-6">
            {block.page_reference && (
              <p className="text-lg font-semibold" style={{ color: step.color }}>{block.page_reference}</p>
            )}
            {block.source_text ? (
              <blockquote className="p-5 rounded-xl border-l-4 text-base sm:text-lg leading-loose text-left max-w-lg" style={{ borderColor: step.color, background: "hsl(var(--card))", color: c.bodyText }}>
                "{block.source_text}"
              </blockquote>
            ) : (
              <div className="p-5 rounded-xl text-center max-w-lg" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
                <p className="text-base leading-relaxed" style={{ color: c.bodyText }}>
                  This passage is referenced at {block.page_reference || "this point in the text"}.
                </p>
              </div>
            )}
            <SpeakButton text={`${block.page_reference || ""}. ${block.source_text || block.definition}`} size="sm" label="Listen to passage" />
            
            {/* Embedded lesson for scripture blocks */}
            {block.definition && (
              <div className="w-full max-w-lg space-y-3">
                <div className="p-4 rounded-xl" style={{ background: `${step.color}08`, border: `1.5px solid ${step.color}20` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: step.color }}>📖 Plain Meaning</p>
                  <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>{block.definition}</p>
                </div>
                {(block as any).explanation && (
                  <div className="p-4 rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">💡 Deeper Explanation</p>
                    <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>{(block as any).explanation}</p>
                  </div>
                )}
                {block.metaphor && (
                  <div className="p-4 rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">🌿 What This Means For You</p>
                    <p className="text-sm leading-relaxed italic" style={{ color: c.bodyText }}>{block.metaphor}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      case "visualize":
      case "visual":
        return (
          <motion.div key="visual" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center space-y-5 py-4">
            <TJVisualEngine
              termId={block.id}
              termName={block.term_title}
              definition={block.definition}
              metaphor={block.metaphor}
              existingImageUrl={imageUrl}
              onImageGenerated={(url) => {
                setImageUrl(url);
                if (mode === "uploaded") supabase.from("uploaded_module_blocks").update({ image_url: url }).eq("id", block.id);
              }}
            />
            {block.visualization_desc && <p className="text-sm max-w-md text-center" style={{ color: c.subtext }}>{block.visualization_desc}</p>}
            {block.video_url && <VideoPlayer url={block.video_url} />}
          </motion.div>
        );

      case "recognize": {
        const conceptIdentity = Array.isArray(block.concept_identity) ? block.concept_identity.map(String) : [];
        const identityItems = conceptIdentity.length >= 4 ? conceptIdentity.slice(0, 4) :
          [block.definition, block.metaphor || "A related concept in another field", "An unrelated term from a different subject", "A common misconception about this topic"].slice(0, 4);
        // Shuffle but keep track of correct index (index 0 is always correct before shuffle)
        const shuffled = [...identityItems].sort(() => Math.random() - 0.5);
        return (
          <motion.div key="recognize" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-6">
            <p className="text-base font-medium text-center" style={{ color: c.termHeading }}>
              Which of these best describes <strong style={{ color: step.color }}>{block.term_title}</strong>?
            </p>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {identityItems.map((item, i) => {
                const isCorrect = i === 0;
                const isSelected = recognizeSelected === i;
                let bg = "hsl(var(--card))";
                let border = "hsl(var(--border))";
                if (recognizeRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                else if (recognizeRevealed && isSelected) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
                else if (recognizeRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 40% 45%)"; }
                return (
                  <motion.button
                    key={i}
                    onClick={() => { if (!recognizeRevealed) { setRecognizeSelected(i); setRecognizeRevealed(true); } }}
                    className="p-4 rounded-xl text-sm font-medium text-left transition-all"
                    style={{ background: bg, border: `2px solid ${border}`, color: c.termHeading }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    {item}
                  </motion.button>
                );
              })}
            </div>
            {recognizeRevealed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="text-sm font-medium" style={{ color: recognizeSelected === 0 ? "hsl(145 50% 35%)" : "hsl(0 60% 45%)" }}>
                  {recognizeSelected === 0 ? "✓ That's right!" : "✗ Not quite — the correct answer is highlighted above."}
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      }

      case "metaphor":
        return (
          <motion.div key="metaphor" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center text-center space-y-6 py-8">
            <div className="text-5xl sm:text-6xl mb-2" style={{ color: step.color }}>"</div>
            <p className="text-xl sm:text-2xl leading-relaxed italic max-w-lg font-display" style={{ color: c.bodyText }}>
              {block.metaphor || "Think of this concept as a bridge connecting what you know to what you're learning."}
            </p>
            <SpeakButton text={block.metaphor || block.definition} size="sm" label="Listen" />
            {block.affirmation && (
              <p className="text-sm font-medium mt-4 px-6 py-3 rounded-xl" style={{ background: "hsl(var(--card))", color: step.color, border: `1.5px solid ${step.color}40` }}>
                💜 {block.affirmation}
              </p>
            )}
          </motion.div>
        );

      case "information": {
        return (
          <motion.div key="information" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-4">
            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-bold" style={{ color: step.color }}>{block.term_title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                {block.affirmation || `Let's explore ${block.term_title} more deeply.`}
              </p>
            </div>

            {/* Hero visual for the slideshow — keeps the picture present alongside the deep teaching */}
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${step.color}30` }}>
                <img
                  src={imageUrl}
                  alt={`Visual reference for ${block.term_title}`}
                  className="w-full max-h-[260px] object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Auto-loading deep teaching content */}
            {infoLoading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>TJ is preparing your lesson…</p>
              </div>
            )}

            {expandedInfo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {(() => {
                  const sections = expandedInfo.split(/^## /m).filter(Boolean).map(s => {
                    const lines = s.trim().split("\n");
                    const title = lines[0]?.trim() || "";
                    const body = lines.slice(1).join("\n").trim();
                    return { title, body };
                  });

                  // No structured sections — fall back to raw markdown
                  if (sections.length === 0) {
                    return (
                      <div className="prose prose-sm max-w-none" style={{ color: c.bodyText }}>
                        <ReactMarkdown>{expandedInfo}</ReactMarkdown>
                      </div>
                    );
                  }

                  // Map AI-generated section titles to our 5 block types
                  const findSection = (name: string) =>
                    sections.find(s => s.title.toLowerCase().includes(name.toLowerCase()));

                  const simple = findSection("Simple Explanation");
                  const lesson = findSection("The Lesson");
                  const history = findSection("History");
                  const why = findSection("Why It Matters");
                  const fits = findSection("How This Fits");

                  // Key Concept = first 1–2 sentences of Simple Explanation (always visible)
                  const simpleBody = simple?.body || "";
                  const sentenceMatches = simpleBody.match(/[^.!?]+[.!?]+/g) || [simpleBody];
                  const keyConcept = sentenceMatches.slice(0, 2).join(" ").trim() || simpleBody;
                  const simpleRest = simpleBody.slice(keyConcept.length).trim();

                  // Apply It content (Why It Matters + How This Fits You)
                  const applyParts = [why, fits].filter(Boolean) as { title: string; body: string }[];
                  // Go Deeper content (The Lesson + History & Origin + remainder of Simple)
                  const deeperParts = [
                    lesson,
                    history,
                    simpleRest ? { title: "More on the Concept", body: simpleRest } : null,
                  ].filter(Boolean) as { title: string; body: string }[];
                  // Anything else not yet routed
                  const used = new Set(
                    [simple, lesson, history, why, fits].filter(Boolean).map((s) => (s as { title: string }).title),
                  );
                  const extras = sections.filter((s) => !used.has(s.title));

                  // Think About It — derive a 1-line prompt from the metaphor
                  const thinkPrompt = block.metaphor
                    ? `Pause for a moment. How does the metaphor — "${block.metaphor}" — change the way you see ${block.term_title}?`
                    : `Pause for a moment. In one sentence, how would you explain ${block.term_title} to a friend?`;

                  const ksKey = blockState("key-concept");
                  const ksRoot = blockState("root-word");
                  const ksApply = blockState("apply");
                  const ksThink = blockState("think");
                  const ksDeeper = blockState("deeper");

                  const renderBody = (body: string) => (
                    <div className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                        }}
                      >{body || "Content is being prepared…"}</ReactMarkdown>
                    </div>
                  );

                  return (
                    <>
                      {/* Key Concept — always visible */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl overflow-hidden"
                        style={{
                          background: "hsl(var(--card))",
                          border: ksKey.emphasized
                            ? `2px solid ${step.color}`
                            : "1.5px solid hsl(var(--border))",
                          boxShadow: ksKey.emphasized ? `0 2px 8px ${step.color}20` : undefined,
                        }}
                      >
                        <div
                          className="px-4 py-3 flex items-center gap-2"
                          style={{ background: `${step.color}08`, borderBottom: "1px solid hsl(var(--border))" }}
                        >
                          <span className="text-base">💡</span>
                          <h4 className="font-display text-sm font-bold m-0" style={{ color: step.color }}>
                            Key Concept
                          </h4>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                            {keyConcept}
                          </p>
                          <SpeakButton text={keyConcept.slice(0, 500)} size="icon" />
                        </div>
                      </motion.div>

                      {/* Root Word — collapsible */}
                      {etymology && (
                        <LayerBlockSection
                          title="Root Word"
                          icon="🔤"
                          accentColor={step.color}
                          defaultOpen={ksRoot.defaultOpen}
                          emphasized={ksRoot.emphasized}
                        >
                          <div className="space-y-2">
                            {etymology.parts.map((part, i) => (
                              <div key={i} className="flex items-baseline gap-2 text-sm" style={{ color: c.bodyText }}>
                                <span className="font-bold" style={{ color: step.color }}>{part.part}</span>
                                <span>= {part.meaning}</span>
                                <span className="text-xs italic" style={{ color: c.subtext }}>({part.origin})</span>
                              </div>
                            ))}
                          </div>
                        </LayerBlockSection>
                      )}

                      {/* Apply It — collapsible */}
                      {applyParts.length > 0 && (
                        <LayerBlockSection
                          title="Apply It"
                          icon="⭐"
                          accentColor={step.color}
                          defaultOpen={ksApply.defaultOpen}
                          emphasized={ksApply.emphasized}
                        >
                          <div className="space-y-3">
                            {applyParts.map((sec, i) => (
                              <div key={i} className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: step.color }}>
                                  {sec.title}
                                </p>
                                {renderBody(sec.body)}
                              </div>
                            ))}
                            <SpeakButton
                              text={applyParts.map((s) => `${s.title}. ${s.body}`).join(" ").slice(0, 600)}
                              size="icon"
                            />
                          </div>
                        </LayerBlockSection>
                      )}

                      {/* Think About It — collapsible */}
                      <LayerBlockSection
                        title="Think About It"
                        icon="🤔"
                        accentColor={step.color}
                        defaultOpen={ksThink.defaultOpen}
                        emphasized={ksThink.emphasized}
                      >
                        <p className="text-sm leading-relaxed italic" style={{ color: c.bodyText }}>
                          {thinkPrompt}
                        </p>
                      </LayerBlockSection>

                      {/* Go Deeper — collapsible */}
                      {(deeperParts.length > 0 || extras.length > 0) && (
                        <LayerBlockSection
                          title="Go Deeper"
                          icon="📖"
                          accentColor={step.color}
                          defaultOpen={ksDeeper.defaultOpen}
                          emphasized={ksDeeper.emphasized}
                        >
                          <div className="space-y-3">
                            {[...deeperParts, ...extras].map((sec, i) => (
                              <div key={i} className="space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: step.color }}>
                                  {sec.title}
                                </p>
                                {renderBody(sec.body)}
                              </div>
                            ))}
                            <SpeakButton
                              text={[...deeperParts, ...extras].map((s) => `${s.title}. ${s.body}`).join(" ").slice(0, 800)}
                              size="icon"
                            />
                          </div>
                        </LayerBlockSection>
                      )}
                    </>
                  );
                })()}
                <div className="pt-2">
                  <SpeakButton text={expandedInfo.slice(0, 2000)} size="sm" label="Listen to full lesson" />
                </div>
              </motion.div>
            )}

            {!expandedInfo && !infoLoading && (
              <div className="text-center py-4">
                <Button onClick={fetchExpandedInfo} className="gap-2 shadow-md" style={{ background: step.gradient, color: "white" }}>
                  <Sparkles className="h-4 w-4" /> Load Lesson
                </Button>
              </div>
            )}

            {/* TJ Learning Studio — additional modes */}
            <div className="space-y-2 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">More Ways to Learn</p>
              <TJLearningStudio
                termName={block.term_title}
                definition={block.definition}
                metaphor={block.metaphor}
                additionalContent={block.practice_scenario}
                onAudioScript={(script) => { if (voiceEnabled) speakText(script.slice(0, 1200)); }}
                onContentGenerated={(text) => { if (voiceEnabled) speakText(text.slice(0, 1000)); }}
              />
            </div>
          </motion.div>
        );
      }

      case "reflection": {
        const ksThinkR = blockState("think");
        const ksDeeperR = blockState("deeper");
        return (
          <motion.div key="reflection" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 py-4">
            {/* Key Concept — the prompt itself, always visible */}
            <p className="text-lg font-display font-semibold text-center" style={{ color: step.color }}>
              How does {block.term_title} connect to your experience?
            </p>
            <p className="text-base leading-relaxed text-center" style={{ color: c.bodyText }}>
              {block.reflection_prompt || `Think about the metaphor above. In your own words, explain what ${block.term_title} means and why it matters in your career.`}
            </p>

            {/* Think About It — write/speak (auto-open) */}
            <LayerBlockSection
              title="Think About It"
              icon="✍️"
              accentColor={step.color}
              defaultOpen={ksThinkR.defaultOpen || true}
              emphasized={ksThinkR.emphasized}
            >
              <div className="relative">
                <textarea
                  placeholder="Write or speak your reflection…"
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  className="w-full min-h-[120px] p-4 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ borderColor: "hsl(var(--border))", color: c.bodyText, background: "hsl(var(--card))" }}
                />
                <div className="absolute right-2 bottom-2">
                  <SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} />
                </div>
              </div>
              {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving…</p>}
              {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
            </LayerBlockSection>

            {/* Go Deeper — Metaphor Recall */}
            {block.metaphor && (
              <LayerBlockSection
                title="Recall the Metaphor"
                icon="💭"
                accentColor={step.color}
                defaultOpen={ksDeeperR.defaultOpen}
                emphasized={ksDeeperR.emphasized}
              >
                <p className="text-sm italic leading-relaxed" style={{ color: c.bodyText }}>"{block.metaphor}"</p>
              </LayerBlockSection>
            )}
          </motion.div>
        );
      }

      case "application": {
        const ksThinkA = blockState("think");
        const ksApplyA = blockState("apply");
        return (
          <motion.div key="application" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 py-4">
            {/* Key Concept — the scenario itself, always visible */}
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: c.bodyText }}>
              {block.practice_scenario || `Imagine you're in the salon and a client asks about ${block.term_title}. How would you explain it in your own words?`}
            </p>

            {/* Think About It — write/speak (auto-open, emphasized for applied learners) */}
            <LayerBlockSection
              title="Apply It"
              icon="🛠️"
              accentColor={step.color}
              defaultOpen={ksApplyA.defaultOpen || ksThinkA.defaultOpen || true}
              emphasized={ksApplyA.emphasized}
            >
              <div className="relative">
                <textarea
                  placeholder="Write your response here…"
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  className="w-full min-h-[120px] p-4 rounded-xl border-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ borderColor: "hsl(var(--border))", color: c.bodyText, background: "hsl(var(--card))" }}
                />
                <div className="absolute right-2 bottom-2">
                  <SpeechToTextButton onTranscript={(text) => setJournalNote(prev => prev ? `${prev} ${text}` : text)} />
                </div>
              </div>
              {journalSaving && <p className="text-xs mt-1" style={{ color: c.subtext }}>Saving…</p>}
              {!journalSaving && journalNote && <p className="text-xs mt-1" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
            </LayerBlockSection>
          </motion.div>
        );
      }

      case "quiz":
        return (
          <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-4">
            <div className="px-4 py-3 rounded-xl text-center" style={{ background: "linear-gradient(135deg, hsl(0 50% 97%), hsl(0 40% 94%))", border: "1.5px solid hsl(0 40% 85%)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: step.color }}>🎓 State Board Practice Question</p>
            </div>
            {aiLoading && (
              <div className="flex items-center justify-center gap-3 py-10">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>Generating question…</p>
              </div>
            )}
            {quizQuestion && quizOptions.length > 0 && (() => {
              // Build a stable seed so the shuffle order doesn't change on re-render.
              const seed = `${block.id}-${quizQuestion.slice(0, 32)}`;
              const rawA = String(quizOptions[0] || "").replace(/^[A-D]\)\s*/, "");
              const rawB = String(quizOptions[1] || "").replace(/^[A-D]\)\s*/, "");
              const rawC = String(quizOptions[2] || "").replace(/^[A-D]\)\s*/, "");
              const rawD = String(quizOptions[3] || "").replace(/^[A-D]\)\s*/, "");
              // Determine which letter the original answer corresponds to
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
                  <p className="text-base font-medium leading-relaxed" style={{ color: c.bodyText }}>{quizQuestion}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sh.options.map((opt, i) => {
                      const letter = opt.letter;
                      const isSelected = quizSelected === letter;
                      const isCorrect = letter === sh.correctLetter;
                      const optionIcons = ["✨", "🌿", "⭐", "💖"];
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
                            const correct = isCorrect;
                            updateDNA({ quizCorrect: correct, layerCompleted: "quiz" });
                            if (correct) {
                              addCoins(10, "correct");
                              await recordCorrect(block.id, false);
                              setReinforcementResolved(true);
                            } else {
                              setReinforcementResolved(false);
                              setMissedQuestionText(quizQuestion);
                              await recordIncorrect(block.id);
                              setTimeout(() => setReinforcementOpen(true), 1200);
                            }
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
                            <span className="text-lg flex-shrink-0">{optionIcons[i]}</span>
                            <div className="flex-1">
                              <span className="font-display font-bold text-xs opacity-80 mr-1">{letter}.</span>
                              <span className="leading-snug">{opt.text}</span>
                            </div>
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
                  {quizRevealed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>Try Again</Button>
                      {!hasBuiltinQuiz && (
                        <Button size="sm" variant="outline" onClick={() => { setAiQuestion(null); setQuizSelected(null); setQuizRevealed(false); generateQuizQuestion(); }}
                          style={{ borderColor: step.color, color: step.color }}>New Question</Button>
                      )}
                      {!reinforcementResolved && (
                        <p className="w-full text-xs italic" style={{ color: "hsl(25 70% 40%)" }}>
                          🔒 Locked — TJ is preparing a reinforcement lesson before you continue.
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })()}
            {!hasBuiltinQuiz && !aiQuestion && !aiLoading && (
              <div className="text-center py-6">
                <Button onClick={generateQuizQuestion} className="gap-2" style={{ background: step.gradient, color: "white" }}>🎓 Generate Question</Button>
              </div>
            )}
          </motion.div>
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
        {/* Subtle BG */}
        <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${tjBackground})`, opacity: 0.06, filter: "brightness(1.2)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.94) 0%, hsl(0 0% 98% / 0.96) 100%)" }} />

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
                style={{ background: step.gradient, color: "white", opacity: (step.key === "quiz" && (!quizRevealed || !reinforcementResolved)) ? 0.5 : 1 }}
                onClick={goNext}
                disabled={step.key === "quiz" && (!quizRevealed || !reinforcementResolved)}>
                {step.key === "quiz" && !reinforcementResolved
                  ? "🔒 Reinforcement"
                  : currentStep === adaptedSteps.length - 1 ? "Complete" : "Mark Step Complete"}
                {currentStep < adaptedSteps.length - 1 && reinforcementResolved && <ArrowRight className="h-4 w-4" />}
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
              <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LearningOrbDialog;
