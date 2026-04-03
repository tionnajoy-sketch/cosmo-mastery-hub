import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Brain, Play, Pause, RotateCcw, Sparkles, TrendingUp, Eye, Mic, PenLine, Zap } from "lucide-react";
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
};

const LearningDNAPage = () => {
  const { profile, user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionIdx, setCaptionIdx] = useState(-1);
  const [hasPlayed, setHasPlayed] = useState(false);
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
        const first = data[0];
        const last = data[data.length - 1];
        setEarliestMetrics({ retention: first.retention, confidence: first.confidence });
        setCurrentMetrics({ retention: last.retention, confidence: last.confidence });
      }
    });
  }, [user]);

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

  // Style percentages (derived from layer + learning style)
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

  // Growth deltas
  const retentionGrowth = currentMetrics && earliestMetrics ? currentMetrics.retention - earliestMetrics.retention : 0;
  const confidenceGrowth = currentMetrics && earliestMetrics ? currentMetrics.confidence - earliestMetrics.confidence : 0;

  // Layer completion analysis
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

    // Captions timer
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
        audio.onended = () => {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
        };
        await audio.play();
      }
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const replayExplainer = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => playExplainer(), 100);
  }, [playExplainer]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
              {/* Avatar circle */}
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(42 70% 50%), hsl(25 65% 50%))" }}>
                <Brain className="h-12 w-12 text-white" />
              </div>

              <h1 className="font-display text-2xl font-bold text-white">Your Learning DNA</h1>
              <p className="text-sm text-white/50">Discover how your brain learns best</p>

              {/* Caption display */}
              <div className="min-h-[48px] flex items-center justify-center">
                {captionIdx >= 0 && (
                  <motion.p key={captionIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-display font-semibold text-white/90">
                    {CAPTIONS[captionIdx].text}
                  </motion.p>
                )}
              </div>

              {/* Controls */}
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

              {/* CTA */}
              {hasPlayed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <a href="#dna-profile" className="text-sm font-medium underline" style={{ color: "hsl(42 70% 60%)" }}>
                    See My DNA ↓
                  </a>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* DNA Code Display */}
        <div id="dna-profile">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5" style={{ color: primaryStyle.color }} />
                  <h2 className="font-display text-lg font-bold text-foreground">Your DNA Code</h2>
                </div>

                {/* Code tiles */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {dnaCode.split("").map((char, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg flex items-center justify-center font-display text-2xl font-bold text-white" style={{ background: primaryStyle.color }}>
                      {char}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  [Layer] [Engagement] [Retention] [Confidence]
                </p>

                {/* Identity Statement */}
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-sm text-foreground leading-relaxed font-medium">{identityStatement}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Style Percentages */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
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
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                You learn best when you {layerStrength === "V" ? "SEE it, then THINK about it, then APPLY it" : layerStrength === "R" ? "REFLECT on it, then CONNECT it, then TEST yourself" : "ENGAGE with it, then PROCESS it, then MASTER it"}.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Evolution Tracking */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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

              {/* Timeline comparison */}
              {earliestMetrics && currentMetrics && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Week 1</span>
                    <span>Current</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Retention</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${earliestMetrics.retention}%`, background: "hsl(0 0% 60%)" }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{earliestMetrics.retention}%</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${currentMetrics.retention}%`, background: "hsl(145 55% 40%)" }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: "hsl(145 55% 40%)" }}>{currentMetrics.retention}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${earliestMetrics.confidence}%`, background: "hsl(0 0% 60%)" }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{earliestMetrics.confidence}%</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${currentMetrics.confidence}%`, background: "hsl(215 70% 50%)" }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: "hsl(215 70% 50%)" }}>{currentMetrics.confidence}%</span>
                    </div>
                  </div>
                </div>
              )}

              {!earliestMetrics && (
                <p className="text-xs text-muted-foreground text-center py-4">Start learning to see your growth over time</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Session Feedback */}
        {topLayers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-md bg-card">
              <CardContent className="p-6">
                <h3 className="font-display text-base font-semibold text-foreground mb-3">Your brain responded best to…</h3>
                <div className="flex flex-wrap gap-2">
                  {topLayers.map(layer => (
                    <span key={layer} className="px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ background: STYLE_MAP[layer]?.color || "hsl(215 50% 50%)" }}>
                      {STYLE_MAP[layer]?.label || layer}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
