import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { useAuth } from "@/hooks/useAuth";
import { useTJTone } from "@/hooks/useTJTone";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Play, Pause, RotateCcw, Sparkles, TrendingUp,
  Eye, Mic, PenLine, Zap,
  BookOpen, Target, Lightbulb, ListOrdered, AlertTriangle,
} from "lucide-react";
import { TJ_TONES, type TJToneMode } from "@/lib/tjTone";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

/* ── Caption data for TJ DNA explainer ── */
const CAPTIONS = [
  { text: "You were never taught how your brain works", startMs: 0, endMs: 4000 },
  { text: "But your brain has a pattern — a fingerprint for learning", startMs: 4000, endMs: 8500 },
  { text: "Your DNA shows how YOU learn", startMs: 8500, endMs: 12000 },
  { text: "This system adapts to YOU", startMs: 12000, endMs: 15500 },
  { text: "Every lesson, every quiz, every interaction — shaped by your DNA", startMs: 15500, endMs: 20000 },
  { text: "Let's see who you are as a learner", startMs: 20000, endMs: 24000 },
];

const EXPLAINER_TEXT = "You were never taught how your brain works. But your brain has a pattern, a fingerprint for learning. Your DNA shows how you learn. This system adapts to you. Every lesson, every quiz, every interaction is shaped by your learning DNA. Let's see who you are as a learner.";

/* ── Style mapping ── */
const STYLE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  V: { label: "Visual", icon: Eye, color: "hsl(215 80% 50%)" },
  D: { label: "Analytical", icon: Zap, color: "hsl(275 60% 55%)" },
  M: { label: "Metaphorical", icon: Sparkles, color: "hsl(42 80% 50%)" },
  I: { label: "Informational", icon: Brain, color: "hsl(160 50% 40%)" },
  R: { label: "Reflective", icon: PenLine, color: "hsl(0 60% 50%)" },
  A: { label: "Applied", icon: Zap, color: "hsl(25 70% 50%)" },
  K: { label: "Kinesthetic", icon: PenLine, color: "hsl(145 60% 35%)" },
  B: { label: "Breakdown", icon: BookOpen, color: "hsl(185 55% 42%)" },
  N: { label: "Recognition", icon: Eye, color: "hsl(275 70% 50%)" },
};

/* ── DNA Character Explanations ── */
const DNA_CHAR_INFO: Record<number, { label: string; icon: any; getDescription: (char: string) => string }> = {
  0: {
    label: "Layer Strength",
    icon: Brain,
    getDescription: (char: string) => {
      const name = STYLE_MAP[char.toUpperCase()]?.label || "Unknown";
      return `Your strongest learning layer is "${name}". This means your brain responds best when content starts with ${name.toLowerCase()} approaches. TJ reorders every lesson to lead with this strength.`;
    },
  },
  1: {
    label: "Engagement",
    icon: Zap,
    getDescription: (char: string) => {
      const level = parseInt(char) || 5;
      if (level <= 3) return `Your engagement level is ${level}/9. TJ keeps lessons short and interactive to maintain your focus. Shorter content blocks and more activities help you stay engaged.`;
      if (level <= 6) return `Your engagement level is ${level}/9. You're moderately engaged — TJ gives you a balanced mix of reading, listening, and doing.`;
      return `Your engagement level is ${level}/9. You're highly engaged — TJ gives you deeper content and more challenging material because you thrive on it.`;
    },
  },
  2: {
    label: "Retention",
    icon: Target,
    getDescription: (char: string) => {
      const code = char.toUpperCase().charCodeAt(0) - 65;
      if (code < 8) return `Your retention is building. TJ adds extra memory cues, summaries, and repetition to help concepts stick. You'll see key points highlighted more often.`;
      if (code < 17) return `Your retention is developing. TJ provides a balanced approach with periodic reviews and memory anchors.`;
      return `Your retention is strong! You hold onto information well. TJ can go deeper without as much repetition.`;
    },
  },
  3: {
    label: "Confidence",
    icon: Sparkles,
    getDescription: (char: string) => {
      const code = char.toLowerCase().charCodeAt(0) - 97;
      if (code < 8) return `Your confidence is still growing — and that's okay. TJ uses a supportive, guided tone with extra encouragement and smaller steps so you never feel overwhelmed.`;
      if (code < 17) return `Your confidence is developing. TJ balances challenge with support, giving you room to grow while still cheering you on.`;
      return `Your confidence is high! TJ challenges you with harder questions, deeper content, and less hand-holding because you're ready for it.`;
    },
  },
};

const LearningDNAPage = () => {
  const { profile, user } = useAuth();
  const { tone, toneProfile } = useTJTone();
  const { rules } = useDNAAdaptation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionIdx, setCaptionIdx] = useState(-1);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [expandedChar, setExpandedChar] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<TJToneMode>(tone);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Metrics
  const [metrics, setMetrics] = useState<any[]>([]);
  const [earliestMetrics, setEarliestMetrics] = useState<{ retention: number; confidence: number } | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<{ retention: number; confidence: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_learning_metrics").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) {
        setMetrics(data);
        setEarliestMetrics({ retention: data[0].retention, confidence: data[0].confidence });
        setCurrentMetrics({ retention: data[data.length - 1].retention, confidence: data[data.length - 1].confidence });
      }
    });
  }, [user]);

  // Save tone preference
  const handleToneChange = async (t: TJToneMode) => {
    setSelectedTone(t);
    if (user) {
      await supabase.from("profiles").update({ tone_preference: t }).eq("id", user.id);
    }
  };

  // DNA parsing
  const dnaCode = profile?.tj_dna_code || "";
  const layerStrength = profile?.dna_layer_strength || "V";
  const dnaConfidence = profile?.dna_confidence;
  const dnaRetention = profile?.dna_retention;

  const confidenceLevel = useMemo(() => {
    if (!dnaConfidence) return "building";
    const code = dnaConfidence.charCodeAt(0) - 97;
    return code < 8 ? "building" : code < 17 ? "developing" : "strong";
  }, [dnaConfidence]);

  const retentionLevel = useMemo(() => {
    if (!dnaRetention) return "developing";
    const code = dnaRetention.charCodeAt(0) - 65;
    return code < 8 ? "building" : code < 17 ? "developing" : "strong";
  }, [dnaRetention]);

  // Style percentages
  const stylePercentages = useMemo(() => {
    const base = { Visual: 25, Reflective: 25, Kinesthetic: 25, Analytical: 25 };
    const boostMap: Record<string, string> = { V: "Visual", R: "Reflective", K: "Kinesthetic", D: "Analytical", A: "Kinesthetic", M: "Visual", I: "Analytical" };
    const boost = boostMap[layerStrength] || "Visual";
    base[boost as keyof typeof base] += 20;
    const total = Object.values(base).reduce((s, v) => s + v, 0);
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round((v / total) * 100)]));
  }, [layerStrength]);

  const identityStatement = useMemo(() => {
    const primary = STYLE_MAP[layerStrength]?.label || "Visual";
    const verbs: Record<string, string> = {
      V: "SEE it", D: "ANALYZE it", M: "CONNECT it to something familiar",
      I: "UNDERSTAND the deeper details", R: "REFLECT on what it means",
      A: "APPLY it to real scenarios", K: "PRACTICE it hands-on",
    };
    const verb = verbs[layerStrength] || "SEE it";
    return `You are a ${primary} learner. You learn best when you ${verb}, then process it, then test yourself.`;
  }, [layerStrength]);

  // How I Learn Best
  const howILearnBest = useMemo(() => {
    const _style = STYLE_MAP[layerStrength]?.label || "Visual";
    const methods: Record<string, string[]> = {
      V: ["Images and diagrams before text", "Color-coded notes and highlights", "Visual metaphors that paint a picture"],
      D: ["Step-by-step logical breakdowns", "Data, facts, and structured analysis", "Comparing and contrasting ideas"],
      M: ["Stories and real-life analogies", "Connecting new ideas to familiar ones", "Emotional associations with concepts"],
      I: ["Deep reading and expanded explanations", "Context and background information", "Understanding the 'why' behind concepts"],
      R: ["Journaling and self-reflection", "Quiet processing time after learning", "Connecting concepts to personal experience"],
      A: ["Hands-on practice and scenarios", "Real-world application exercises", "Learning by doing, not just reading"],
      K: ["Interactive activities and movement", "Practice labs and simulations", "Physical engagement with material"],
    };
    return methods[layerStrength] || methods.V;
  }, [layerStrength]);

  // What Throws Me Off
  const whatThrowsMeOff = useMemo(() => {
    const issues: string[] = [];
    if (confidenceLevel === "building") issues.push("Feeling overwhelmed by too much content at once", "Self-doubt when facing difficult questions");
    if (retentionLevel === "building") issues.push("Forgetting concepts shortly after learning them", "Long gaps between study sessions");
    const eng = profile?.dna_engagement ?? 5;
    if (eng <= 3) issues.push("Losing focus during long reading sections", "Content that doesn't feel interactive enough");
    if (issues.length === 0) issues.push("You're handling challenges well! Keep building on your strengths.");
    return issues;
  }, [confidenceLevel, retentionLevel, profile?.dna_engagement]);

  // TJ Recommends Next
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (confidenceLevel === "building") recs.push("Try the Practice Lab to build confidence through repetition");
    if (retentionLevel === "building") recs.push("Review your bookmarked terms before starting new material");
    recs.push("Complete your next study block to keep your streak going");
    if (layerStrength === "R") recs.push("Spend extra time on the Reflection step — it's your superpower");
    if (layerStrength === "A") recs.push("Jump into application scenarios — they'll click fastest for you");
    return recs.slice(0, 3);
  }, [confidenceLevel, retentionLevel, layerStrength]);

  // Growth deltas
  const retentionGrowth = currentMetrics && earliestMetrics ? currentMetrics.retention - earliestMetrics.retention : 0;
  const confidenceGrowth = currentMetrics && earliestMetrics ? currentMetrics.confidence - earliestMetrics.confidence : 0;

  // Top layers
  const topLayers = useMemo(() => {
    const counts: Record<string, number> = {};
    metrics.forEach(m => {
      const layers = Array.isArray(m.layers_completed) ? m.layers_completed : [];
      layers.forEach((l: string) => { counts[l] = (counts[l] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  }, [metrics]);

  /* ── TTS Explainer ── */
  const playExplainer = useCallback(async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setIsPlaying(true);
    setHasPlayed(true);
    setCaptionIdx(0);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const idx = CAPTIONS.findIndex(c => elapsed >= c.startMs && elapsed < c.endMs);
      if (idx >= 0) setCaptionIdx(idx);
      if (elapsed > CAPTIONS[CAPTIONS.length - 1].endMs) {
        setCaptionIdx(-1);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 200);
    try {
      const audio = await fetchTTSWithFallback(EXPLAINER_TEXT, { usageType: "lesson" });
      if (audio) {
        audioRef.current = audio;
        audio.onended = () => { setIsPlaying(false); if (timerRef.current) clearInterval(timerRef.current); };
        await audio.play();
      }
    } catch { setIsPlaying(false); }
  }, [isPlaying]);

  const replayExplainer = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => playExplainer(), 100);
  }, [playExplainer]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const primaryStyle = STYLE_MAP[layerStrength] || STYLE_MAP.V;
  const PrimaryIcon = primaryStyle.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-6">
        {/* Hero: TJ Avatar DNA Explainer */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(240 15% 10%), hsl(240 10% 16%))" }}>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(42 70% 50%), hsl(25 65% 50%))" }}>
                <Brain className="h-12 w-12 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Your Learning DNA</h1>
              <p className="text-sm text-white/50">Your personal blueprint for how you learn best</p>

              <div className="min-h-[48px] flex items-center justify-center">
                {captionIdx >= 0 && (
                  <motion.p key={captionIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-display font-semibold text-white/90">
                    {CAPTIONS[captionIdx].text}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <Button onClick={playExplainer} variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                  {isPlaying ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {hasPlayed ? "Resume" : "Play"}</>}
                </Button>
                {hasPlayed && (
                  <Button onClick={replayExplainer} variant="ghost" className="text-white/50 hover:text-white gap-2">
                    <RotateCcw className="h-4 w-4" /> Replay
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Interactive DNA Code Tiles ── */}
        <div id="dna-profile">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5" style={{ color: primaryStyle.color }} />
                  <h2 className="font-display text-lg font-bold text-foreground">Your DNA Code</h2>
                </div>

                {/* Tappable code tiles */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  {dnaCode.split("").map((char, i) => {
                    const info = DNA_CHAR_INFO[i];
                    const isExpanded = expandedChar === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setExpandedChar(isExpanded ? null : i)}
                        className="relative group transition-all duration-200"
                      >
                        <div
                          className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-display text-2xl font-bold text-white transition-all ${isExpanded ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                          style={{ background: primaryStyle.color, ringColor: primaryStyle.color }}
                        >
                          {char}
                          <span className="text-[8px] font-normal opacity-70 mt-0.5">{info?.label?.split(" ")[0]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded explanation */}
                <AnimatePresence>
                  {expandedChar !== null && dnaCode[expandedChar] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl mb-4" style={{ background: `${primaryStyle.color}12`, border: `1.5px solid ${primaryStyle.color}30` }}>
                        <div className="flex items-center gap-2 mb-2">
                          {(() => { const Icon = DNA_CHAR_INFO[expandedChar]?.icon || Brain; return <Icon className="h-4 w-4" style={{ color: primaryStyle.color }} />; })()}
                          <p className="text-sm font-bold" style={{ color: primaryStyle.color }}>{DNA_CHAR_INFO[expandedChar]?.label}</p>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">
                          {DNA_CHAR_INFO[expandedChar]?.getDescription(dnaCode[expandedChar])}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground text-center mb-4">
                  Tap any code block to learn what it means
                </p>

                {/* Identity Statement */}
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-sm text-foreground leading-relaxed font-medium">{identityStatement}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── My DNA Type ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <PrimaryIcon className="h-5 w-5" style={{ color: primaryStyle.color }} />
                <h3 className="font-display text-base font-semibold text-foreground">My DNA Type</h3>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${primaryStyle.color}10` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: primaryStyle.color }}>
                  <PrimaryIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold" style={{ color: primaryStyle.color }}>{primaryStyle.label} Learner</p>
                  <p className="text-xs text-muted-foreground">Your brain processes {primaryStyle.label.toLowerCase()} information fastest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── How I Learn Best ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5" style={{ color: "hsl(42 70% 50%)" }} />
                <h3 className="font-display text-base font-semibold text-foreground">How I Learn Best</h3>
              </div>
              <div className="space-y-2">
                {howILearnBest.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                    <span className="text-xs font-bold mt-0.5" style={{ color: primaryStyle.color }}>{i + 1}.</span>
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── What Throws Me Off ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5" style={{ color: "hsl(25 70% 50%)" }} />
                <h3 className="font-display text-base font-semibold text-foreground">What Throws Me Off</h3>
              </div>
              <div className="space-y-2">
                {whatThrowsMeOff.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(25 60% 97%)" }}>
                    <span className="text-sm mt-0.5">⚠️</span>
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── TJ Recommends Next ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5" style={{ color: "hsl(145 55% 40%)" }} />
                <h3 className="font-display text-base font-semibold text-foreground">TJ Recommends Next</h3>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(145 40% 96%)" }}>
                    <span className="text-sm mt-0.5">→</span>
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Best Study Order for Me ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <ListOrdered className="h-5 w-5" style={{ color: "hsl(265 60% 50%)" }} />
                <h3 className="font-display text-base font-semibold text-foreground">Best Study Order for Me</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">TJ reorders every lesson to match your DNA. Here's your personalized sequence:</p>
              <div className="space-y-1.5">
                {rules.stepOrder.map((stepKey, i) => {
                  const stepLabels: Record<string, string> = {
                    visual: "Visualize", definition: "Define", scripture: "Scripture",
                    breakdown: "Break It Down", recognize: "Recognize", metaphor: "Metaphor",
                    information: "Information", reflection: "Reflect", application: "Apply", quiz: "Assess",
                  };
                  const isStrength = stepKey === (STYLE_MAP[layerStrength] ? stepKey : "");
                  return (
                    <div key={stepKey} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: i === 0 || i === 1 ? `${primaryStyle.color}10` : "transparent" }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: i < 2 ? primaryStyle.color : "hsl(var(--muted-foreground))" }}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{stepLabels[stepKey] || stepKey}</span>
                      {i === 1 && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${primaryStyle.color}20`, color: primaryStyle.color }}>Your strength</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── TJ Tone Selector ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-5 w-5" style={{ color: toneProfile.color }} />
                <h3 className="font-display text-base font-semibold text-foreground">TJ's Teaching Style</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Choose how TJ speaks to you throughout the app</p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(TJ_TONES) as [TJToneMode, typeof TJ_TONES[TJToneMode]][]).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => handleToneChange(key)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedTone === key ? `${t.color}12` : "transparent",
                      border: selectedTone === key ? `2px solid ${t.color}` : "2px solid transparent",
                    }}
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: selectedTone === key ? t.color : "hsl(var(--foreground))" }}>{t.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    </div>
                    {selectedTone === key && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: t.color, color: "white" }}>Active</span>}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Learning Style Profile ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">Learning Style Profile</h3>
              <div className="space-y-3">
                {Object.entries(stylePercentages).map(([style, pct]) => {
                  const icons: Record<string, any> = { Visual: Eye, Reflective: PenLine, Kinesthetic: Zap, Analytical: Brain };
                  const colors: Record<string, string> = { Visual: "hsl(215 70% 50%)", Reflective: "hsl(0 55% 50%)", Kinesthetic: "hsl(145 55% 38%)", Analytical: "hsl(275 55% 50%)" };
                  const Icon = icons[style] || Eye;
                  return (
                    <div key={style}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: colors[style] }} />
                          <span className="text-sm font-medium text-foreground">{style}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: colors[style] }}>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Growth Tracking ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5" style={{ color: "hsl(145 55% 40%)" }} />
                <h3 className="font-display text-base font-semibold text-foreground">Your Growth as a Learner</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-secondary text-center">
                  <p className="text-2xl font-display font-bold" style={{ color: retentionGrowth > 0 ? "hsl(145 55% 40%)" : "hsl(0 0% 50%)" }}>
                    {retentionGrowth > 0 ? `+${retentionGrowth}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Retention Growth</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary text-center">
                  <p className="text-2xl font-display font-bold" style={{ color: confidenceGrowth > 0 ? "hsl(215 70% 50%)" : "hsl(0 0% 50%)" }}>
                    {confidenceGrowth > 0 ? `+${confidenceGrowth}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Confidence Growth</p>
                </div>
              </div>
              {!earliestMetrics && (
                <p className="text-xs text-muted-foreground text-center py-4">Start learning to see your growth over time</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Micro signals */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 50% 30%)" }}>
            Retention: {retentionLevel}
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "hsl(215 40% 92%)", color: "hsl(215 50% 30%)" }}>
            Confidence: {confidenceLevel}
          </span>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default LearningDNAPage;
