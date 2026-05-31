import { useEffect, useRef, useState, useCallback } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { stopGlobalNarration } from "@/hooks/useAutoNarrate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Hexagon, Pause, Play,
  Star, Heart, Eye, Globe, CloudDrizzle, RefreshCw, GraduationCap,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useSoundsEnabled } from "@/hooks/useCoins";
import SpeakButton from "@/components/SpeakButton";
import TJInsight from "@/components/TJInsight";
import learningGeometryHero from "@/assets/learning-geometry-hero.png";

/* ─────────────────────────────────────────────────────────────
 * The Seven Learning Dimensions™
 * Canonical structure for every lesson across the platform.
 * ───────────────────────────────────────────────────────────── */
const DIMENSIONS = [
  {
    icon: Star,
    label: "Core Term Mastery™",
    desc: "The foundation of learning.",
    color: "42 80% 50%",
  },
  {
    icon: Heart,
    label: "Personal Connection™",
    desc: "Link information to your own experiences and identity.",
    color: "285 55% 45%",
  },
  {
    icon: Eye,
    label: "Visual Mapping™",
    desc: "See relationships through diagrams, symbols, and the Knowledge Web™.",
    color: "270 60% 50%",
  },
  {
    icon: Globe,
    label: "Real World Application™",
    desc: "Connect concepts to practical situations.",
    color: "12 70% 50%",
  },
  {
    icon: CloudDrizzle,
    label: "Reflection™",
    desc: "Pause and connect learning to meaning.",
    color: "190 55% 42%",
  },
  {
    icon: RefreshCw,
    label: "Practice & Recall™",
    desc: "Strengthen retention through retrieval and repetition.",
    color: "145 50% 38%",
  },
  {
    icon: GraduationCap,
    label: "Assessment & Transfer™",
    desc: "Demonstrate understanding by explaining, applying, and teaching.",
    color: "220 60% 45%",
  },
] as const;

const FOUNDER_BIO = `My name is Tionna Joy Anderson.

I am a licensed cosmetologist, educator, entrepreneur, and creator of the TJ Anderson Layer Method™.

For more than twenty years, I have worked in beauty, education, leadership, and personal development.

Throughout my career, I noticed something important: Many people do not struggle because they are incapable. They struggle because they have never been taught in a way that truly connects with how they learn.

As someone who often had to create my own pathways to understanding, I became fascinated by learning itself — why some concepts stick, why others disappear, and how meaning transforms information into lasting knowledge.

That journey led to the creation of the TJ Anderson Layer Method™.

A framework built on connections.
A system designed to transform memorization into understanding.
A method that helps learners retain information, build confidence, apply knowledge in real-world situations, and create lasting transformation.

This platform is not simply about passing an exam.

It is about changing the way people learn.

Because when learning connects to meaning, transformation becomes possible.

— Tionna Joy Anderson
Creator, TJ Anderson Layer Method™`;

const DIMENSIONS_SCRIPT = DIMENSIONS.map((d, i) => `${i + 1}. ${d.label}. ${d.desc}`).join("\n");

const VOICE_SCRIPT = `Hey… it's Tionna…

Before you start anything in here, I want you to know — you're not behind.

A lot of us were just taught in a way that didn't actually make sense.

So I created something I wish I had — built on connections, layered for retention, designed for transformation.

This isn't about cramming. This is about understanding.

So take your time… breathe… and let's go through this together.`;

const WelcomePage = () => {
  const navigate = useNavigate();
  const { soundsEnabled } = useSoundsEnabled();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    stopGlobalNarration();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playVoice = useCallback(async (text: string) => {
    cleanup();
    try {
      const audio = await fetchTTSWithFallback(text, { usageType: "onboarding" });
      if (!audio) return;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      setIsPlaying(true);
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }, [cleanup]);

  const toggleVoice = useCallback(() => {
    if (isPlaying) cleanup();
    else playVoice(VOICE_SCRIPT);
  }, [isPlaying, cleanup, playVoice]);

  useEffect(() => {
    if (soundsEnabled && !hasAutoPlayed) {
      setHasAutoPlayed(true);
      const timer = setTimeout(() => playVoice(VOICE_SCRIPT), 1500);
      return () => clearTimeout(timer);
    }
  }, [soundsEnabled, hasAutoPlayed, playVoice]);

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--cream))" }}>
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        {/* ─── Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ background: "hsl(var(--violet) / 0.12)", color: "hsl(var(--violet))" }}
          >
            <Hexagon className="h-3 w-3" /> TJ Anderson Layer Method™
          </div>
          <h1
            className="font-display text-3xl font-bold mb-2"
            style={{ color: "hsl(var(--plum))" }}
          >
            The First Learning System Built<br />
            Around How Students Actually Learn.
          </h1>
          <p
            className="text-sm italic leading-relaxed"
            style={{ color: "hsl(var(--plum) / 0.75)" }}
          >
            Built on Connections.<br />
            Layered for Retention. Designed for Transformation.
          </p>

          {/* Voice control */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={toggleVoice} className="gap-2 text-xs">
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause TJ Voice" : "Listen to Tionna"}
            </Button>
          </div>
        </motion.div>

        {/* ─── Official Learning Geometry™ Artwork ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.6 }}
          className="mb-8"
        >
          <Card
            className="border-0 shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--plum)), hsl(var(--violet)))",
            }}
          >
            <img
              src={learningGeometryHero}
              alt="The TJ Anderson Layer Method™ — Learning Geometry™ visual architecture"
              className="w-full h-auto block"
              loading="eager"
            />
            <div
              className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.24em] font-bold"
              style={{ background: "hsl(var(--plum))", color: "hsl(var(--gold))" }}
            >
              Learning is not memorization. Learning is geometry.
            </div>
          </Card>
        </motion.div>

        {/* ─── The Seven Learning Dimensions™ ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-bold" style={{ color: "hsl(var(--plum))" }}>
              The Seven Learning Dimensions™
            </h2>
            <SpeakButton text={DIMENSIONS_SCRIPT} label="Listen" size="sm" />
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            The TJ Anderson Layer Method™ is built around seven interconnected dimensions that
            transform information into understanding.
          </p>

          <div className="space-y-3">
            {DIMENSIONS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
              >
                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="flex">
                    <div
                      className="w-1.5 flex-shrink-0"
                      style={{ background: `hsl(${d.color})` }}
                    />
                    <CardContent className="p-4 flex items-start gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `hsl(${d.color} / 0.14)` }}
                      >
                        <d.icon className="h-5 w-5" style={{ color: `hsl(${d.color})` }} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold font-display"
                          style={{ color: "hsl(var(--plum))" }}
                        >
                          {i + 1}. {d.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                          {d.desc}
                        </p>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── TJ Insight™ ─── */}
        <div className="mb-8">
          <TJInsight
            text="When learning connects to meaning, transformation becomes possible. You are not behind — you just needed a different approach."
          />
        </div>

        {/* ─── Who I Am ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="font-display text-xl font-bold"
                  style={{ color: "hsl(var(--plum))" }}
                >
                  Who I Am
                </h2>
                <SpeakButton text={FOUNDER_BIO} label="Listen" size="sm" />
              </div>
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {FOUNDER_BIO}
              </div>
              <div
                className="mt-4 pt-4 border-t text-[11px] uppercase tracking-[0.2em] font-bold"
                style={{
                  borderColor: "hsl(var(--plum) / 0.15)",
                  color: "hsl(var(--violet))",
                }}
              >
                Built on Connections. Layered for Retention. Designed for Transformation.
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ─── CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pb-10"
        >
          <Button
            className="w-full py-7 text-lg font-display font-semibold gap-3 rounded-xl shadow-xl"
            onClick={() => navigate("/")}
            style={{
              background: "linear-gradient(135deg, hsl(var(--plum)), hsl(var(--violet)))",
              color: "hsl(var(--cream))",
            }}
          >
            Enter the Method <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
