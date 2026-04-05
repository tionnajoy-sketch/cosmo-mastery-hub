import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import type { UploadedBlock } from "@/components/UploadedTermCard";
import tjBackground from "@/assets/tj-background.jpg";

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
  open, onOpenChange, block, onNotesChange, mode = "uploaded", blockIndex = 0, onComplete,
}: LearningOrbDialogProps) => {
  const { user, profile } = useAuth();
  const { addCoins } = useCoins();
  const { soundsEnabled } = useSoundsEnabled();
  const { dna, rules, updateDNA, getEncouragement, getAdaptedCaption } = useDNAAdaptation();
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
      completedRef.current = false;
      autoVoiceRef.current = false;
    }
  }, [block?.id]);

  // AUTO-VOICE: speak on tile open
  useEffect(() => {
    if (!block || !open || autoVoiceRef.current || !voiceEnabled) return;
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
    // Information step: do NOT auto-fetch — let student choose via TJLearningStudio menu
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
    if (textToSpeak && currentStep > 0) {
      setTimeout(() => speakText(textToSpeak), 200);
    }
  }, [currentStep, etymology, expandedInfo]);

  if (!block) return null;

  const step = adaptedSteps[currentStep];
  const progressPercent = ((currentStep + 1) / adaptedSteps.length) * 100;

  // DNA-adapted encouragement message
  const encouragementMsg = rules.toneModifier === "supportive" ? getEncouragement() : null;

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

    // Prevent skipping quiz — quiz must be answered before completing
    if (currentStep === adaptedSteps.length - 2) {
      // About to move to quiz step — allow it
    }
    if (step.key === "quiz" && !quizRevealed) {
      // Don't allow completing without answering the quiz
      return;
    }

    if (currentStep < adaptedSteps.length - 1) {
      if (soundsEnabled) playChime();
      setCurrentStep(s => s + 1);
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
          <motion.div key="scripture" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center text-center space-y-6 py-6">
            {block.page_reference && (
              <p className="text-lg font-semibold" style={{ color: step.color }}>{block.page_reference}</p>
            )}
            {block.source_text ? (
              <blockquote className="p-5 rounded-xl border-l-4 text-base sm:text-lg leading-loose text-left max-w-lg" style={{ borderColor: step.color, background: "hsl(var(--card))", color: c.bodyText }}>
                "{block.source_text}"
              </blockquote>
            ) : (
              <p className="text-base leading-relaxed max-w-lg" style={{ color: c.bodyText }}>
                This passage is referenced at {block.page_reference || "this point in the text"}. Open your source material to read along.
              </p>
            )}
            <SpeakButton text={`${block.page_reference || ""}. ${block.source_text || block.definition}`} size="sm" label="Listen to passage" />
          </motion.div>
        );
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
        const ReactMarkdown = require("react-markdown").default;
        return (
          <motion.div key="information" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-4">
            {/* Short intro context */}
            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-bold" style={{ color: step.color }}>{block.term_title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: c.bodyText }}>
                {block.affirmation || `Let's explore ${block.term_title} more deeply.`}
              </p>
            </div>

            {/* Deep Teaching Content — auto-generated */}
            {!expandedInfo && !infoLoading && (
              <div className="text-center py-4">
                <Button onClick={fetchExpandedInfo} className="gap-2 shadow-md" style={{ background: step.gradient, color: "white" }}>
                  <Sparkles className="h-4 w-4" /> Teach Me Deeper
                </Button>
                <p className="text-xs mt-2" style={{ color: c.subtext }}>History, origin, why it matters & how it fits you</p>
              </div>
            )}

            {infoLoading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: step.color }} />
                <p className="text-sm" style={{ color: c.subtext }}>TJ is preparing your lesson…</p>
              </div>
            )}

            {expandedInfo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm max-w-none space-y-1"
                style={{ color: c.bodyText }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }: any) => (
                      <div className="flex items-center gap-2 mt-5 mb-2 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                        <div className="w-1.5 h-5 rounded-full" style={{ background: step.gradient }} />
                        <h4 className="font-display text-base font-bold m-0" style={{ color: step.color }}>{children}</h4>
                      </div>
                    ),
                    p: ({ children }: any) => <p className="text-sm leading-relaxed mb-2" style={{ color: c.bodyText }}>{children}</p>,
                  }}
                >{expandedInfo}</ReactMarkdown>
                <div className="pt-3">
                  <SpeakButton text={expandedInfo.slice(0, 2000)} size="sm" label="Listen to lesson" />
                </div>
              </motion.div>
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

      case "reflection":
        return (
          <motion.div key="reflection" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-4">
            {/* Connect reflection to metaphor for emotional + cognitive learning */}
            {block.metaphor && (
              <div className="px-4 py-3 rounded-xl" style={{ background: "hsl(265 40% 96%)", border: "1.5px solid hsl(265 40% 85%)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(265 50% 50%)" }}>💭 Recall the Metaphor</p>
                <p className="text-sm italic leading-relaxed" style={{ color: "hsl(265 30% 35%)" }}>"{block.metaphor}"</p>
              </div>
            )}
            <p className="text-lg font-display font-semibold text-center" style={{ color: step.color }}>
              How does {block.term_title} connect to your experience?
            </p>
            <p className="text-base leading-relaxed text-center" style={{ color: c.bodyText }}>
              {block.reflection_prompt || `Think about the metaphor above. In your own words, explain what ${block.term_title} means and why it matters in your career.`}
            </p>
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
            {journalSaving && <p className="text-xs" style={{ color: c.subtext }}>Saving…</p>}
            {!journalSaving && journalNote && <p className="text-xs" style={{ color: "hsl(145 40% 45%)" }}>✓ Saved</p>}
          </motion.div>
        );

      case "application":
        return (
          <motion.div key="application" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5 py-4">
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: c.bodyText }}>
              {block.practice_scenario || `Imagine you're in the salon and a client asks about ${block.term_title}. How would you explain it in your own words?`}
            </p>
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
          </motion.div>
        );

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
            {quizQuestion && quizOptions.length > 0 && (
              <div className="space-y-4">
                <p className="text-base font-medium leading-relaxed" style={{ color: c.bodyText }}>{quizQuestion}</p>
                <div className="space-y-2.5">
                  {quizOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const optText = String(opt).replace(/^[A-D]\)\s*/, "");
                    const isSelected = quizSelected === letter;
                    const isCorrect = String(opt) === quizAnswer || optText === quizAnswer;
                    let bg = "hsl(var(--card))";
                    let border = "hsl(var(--border))";
                    if (quizRevealed && isSelected && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 45% 45%)"; }
                    else if (quizRevealed && isSelected) { bg = "hsl(0 60% 94%)"; border = "hsl(0 60% 50%)"; }
                    else if (quizRevealed && isCorrect) { bg = "hsl(145 40% 92%)"; border = "hsl(145 45% 45%)"; }
                    return (
                      <motion.button key={i} onClick={() => { if (!quizRevealed) { setQuizSelected(letter); setQuizRevealed(true); const correct = isCorrect; if (correct) addCoins(10, "correct"); updateDNA({ quizCorrect: correct, layerCompleted: "quiz" }); } }}
                        className="w-full text-left p-4 rounded-xl text-sm font-medium transition-all"
                        style={{ background: bg, border: `2px solid ${border}`, color: c.bodyText }}
                        disabled={quizRevealed}
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      >
                        <span className="font-bold mr-2">{letter})</span> {optText}
                        {quizRevealed && isCorrect && <CheckCircle2 className="inline h-4 w-4 ml-2" style={{ color: "hsl(145 45% 45%)" }} />}
                        {quizRevealed && isSelected && !isCorrect && <XCircle className="inline h-4 w-4 ml-2" style={{ color: "hsl(0 60% 50%)" }} />}
                      </motion.button>
                    );
                  })}
                </div>
                {quizRevealed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setQuizSelected(null); setQuizRevealed(false); }}>Try Again</Button>
                    {!hasBuiltinQuiz && (
                      <Button size="sm" variant="outline" onClick={() => { setAiQuestion(null); setQuizSelected(null); setQuizRevealed(false); generateQuizQuestion(); }}
                        style={{ borderColor: step.color, color: step.color }}>New Question</Button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) stopSpeaking(); onOpenChange(o); }}>
      <DialogContent variant="fullscreen" style={{ background: "hsl(var(--background))" }}>
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

            {/* Step indicator pills */}
            <div className="flex items-center justify-center gap-1 mt-2.5">
              {adaptedSteps.map((s, i) => (
                <div key={s.key} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === currentStep ? 20 : 6, background: i <= currentStep ? s.color : "hsl(var(--border))", opacity: i <= currentStep ? 1 : 0.4 }} />
              ))}
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

          {/* ═══════ NAVIGATION BAR (Top of content area) ═══════ */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-2 border-b" style={{ background: "hsl(var(--background) / 0.96)" }}>
            <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={currentStep === 0 ? () => { stopSpeaking(); onOpenChange(false); } : goBack} className="gap-1 text-sm" style={{ color: c.subtext }}>
                <ArrowLeft className="h-4 w-4" /> {currentStep === 0 ? "Back" : "Previous"}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" style={{ color: c.subtext }}
                onClick={() => { speakText(`Let me explain ${block.term_title} another way…`); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Let TJ Explain Again
              </Button>
              <Button size="sm" className="gap-1 text-sm px-5 shadow-md" 
                style={{ background: step.gradient, color: "white", opacity: step.key === "quiz" && !quizRevealed ? 0.5 : 1 }} 
                onClick={goNext}
                disabled={step.key === "quiz" && !quizRevealed}>
                {currentStep === adaptedSteps.length - 1 ? "Complete" : "Next"} {currentStep < adaptedSteps.length - 1 && <ArrowRight className="h-4 w-4" />}
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
