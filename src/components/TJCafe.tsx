import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Wind, Droplets, Heart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/SpeakButton";

interface TJCafeProps {
  open: boolean;
  onDismiss: () => void;
}

const AFFIRMATIONS = [
  "You are becoming the professional you were meant to be.",
  "Every hour you invest in yourself pays dividends forever.",
  "Your dedication right now is building your future.",
  "Learning takes courage — and you have plenty of it.",
  "Rest is not laziness. Rest is strategy.",
];

const STRETCH_PROMPTS = [
  "Roll your shoulders back five times. Let the tension melt away.",
  "Stand up and touch your toes. Your body needs movement to help your brain learn.",
  "Stretch your arms above your head and take three deep breaths.",
  "Gently turn your head side to side. Release the neck tension from studying.",
];

const WELCOME_MESSAGE = "Hey love, you've been studying for over an hour. I'm so proud of you. Take a moment — breathe, stretch, grab some water. Your brain needs rest to lock in what you've learned.";

const TJCafe = ({ open, onDismiss }: TJCafeProps) => {
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [stretch] = useState(() => STRETCH_PROMPTS[Math.floor(Math.random() * STRETCH_PROMPTS.length)]);

  const startBreathing = useCallback(() => {
    setBreathing(true);
    setBreathCount(0);
    setBreathPhase("inhale");
  }, []);

  useEffect(() => {
    if (!breathing) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const next = { inhale: "hold" as const, hold: "exhale" as const, exhale: "inhale" as const };

    breathTimer.current = setTimeout(() => {
      const nextPhase = next[breathPhase];
      setBreathPhase(nextPhase);
      if (nextPhase === "inhale") {
        setBreathCount(c => {
          if (c >= 2) { setBreathing(false); return 0; }
          return c + 1;
        });
      }
    }, durations[breathPhase]);

    return () => { if (breathTimer.current) clearTimeout(breathTimer.current); };
  }, [breathing, breathPhase]);

  if (!open) return null;

  const breathLabel = breathPhase === "inhale" ? "Breathe in… 4 seconds" : breathPhase === "hold" ? "Hold… 7 seconds" : "Breathe out… 8 seconds";
  const breathScale = breathPhase === "inhale" ? 1.3 : breathPhase === "hold" ? 1.3 : 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, hsl(0 75% 20%) 0%, hsl(215 80% 18%) 30%, hsl(155 70% 15%) 60%, hsl(45 90% 20%) 100%)",
        }}
      >
        {/* Ambient overlay pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, hsl(0 75% 50%) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(215 80% 45%) 0%, transparent 50%), radial-gradient(circle at 50% 50%, hsl(45 90% 55%) 0%, transparent 60%)",
        }} />

        {/* Close button */}
        <button onClick={onDismiss} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="h-5 w-5 text-white/60" />
        </button>

        <div className="relative z-10 max-w-md w-full mx-4 py-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(0 75% 50%), hsl(45 90% 55%))" }}>
              <Coffee className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display, serif)" }}>
              TJ Anderson Café
            </h1>
            <p className="text-white/50 text-xs uppercase tracking-widest">Take a moment for yourself</p>
          </motion.div>

          {/* Welcome message with voice */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5" style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.12)" }}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-white/90 text-sm leading-relaxed">{WELCOME_MESSAGE}</p>
              </div>
              <SpeakButton text={WELCOME_MESSAGE} size="icon" className="text-white/60 hover:text-white" />
            </div>
          </motion.div>

          {/* Breathing Exercise */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 text-center" style={{ background: "hsl(215 80% 45% / 0.15)", border: "1px solid hsl(215 80% 45% / 0.2)" }}>
            <Wind className="h-5 w-5 mx-auto mb-2" style={{ color: "hsl(215 80% 65%)" }} />
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">4-7-8 Breathing</p>
            {breathing ? (
              <div className="space-y-3">
                <motion.div
                  animate={{ scale: breathScale }}
                  transition={{ duration: breathPhase === "inhale" ? 4 : breathPhase === "hold" ? 0.3 : 8, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(215 80% 45% / 0.4), hsl(155 70% 40% / 0.4))" }}
                >
                  <span className="text-white/80 text-xs font-medium">{breathPhase}</span>
                </motion.div>
                <p className="text-white/60 text-xs">{breathLabel}</p>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={startBreathing}
                className="border-white/20 text-white hover:bg-white/10">
                Start Breathing Exercise
              </Button>
            )}
          </motion.div>

          {/* Affirmation */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl p-5 text-center" style={{ background: "hsl(45 90% 55% / 0.12)", border: "1px solid hsl(45 90% 55% / 0.2)" }}>
            <Sparkles className="h-5 w-5 mx-auto mb-2" style={{ color: "hsl(45 90% 55%)" }} />
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">Affirmation</p>
            <p className="text-white/90 text-sm italic leading-relaxed">"{affirmation}"</p>
          </motion.div>

          {/* Stretch */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl p-5" style={{ background: "hsl(155 70% 40% / 0.12)", border: "1px solid hsl(155 70% 40% / 0.2)" }}>
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(155 70% 50%)" }} />
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">Stretch & Move</p>
                <p className="text-white/70 text-sm leading-relaxed">{stretch}</p>
              </div>
            </div>
          </motion.div>

          {/* Water Reminder */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "hsl(0 75% 50% / 0.1)", border: "1px solid hsl(0 75% 50% / 0.15)" }}>
            <Droplets className="h-5 w-5 flex-shrink-0" style={{ color: "hsl(215 80% 65%)" }} />
            <p className="text-white/70 text-sm">Have you had water recently? Hydration helps memory retention. 💧</p>
          </motion.div>

          {/* Dismiss */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Button onClick={onDismiss} className="w-full py-5 text-base font-semibold rounded-xl"
              style={{ background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(0 75% 50%))", color: "hsl(0 0% 10%)" }}>
              I'm Refreshed — Let's Keep Going ✨
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TJCafe;
