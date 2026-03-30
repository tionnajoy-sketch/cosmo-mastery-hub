import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Wind, Droplets, Heart, Sparkles, X, Check, Volume2, VolumeX, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface TJCafeProps {
  open: boolean;
  onDismiss: () => void;
  requiredMode?: boolean; // true = must complete all prompts, false = optional (menu access)
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

const WELCOME_MESSAGE = "Hey love, you've been putting in the work and I'm so proud of you. Take a moment — breathe, stretch, grab some water. Your brain needs rest to lock in what you've learned.";

const BREATHING_NARRATIONS = {
  inhale: "Close your eyes… breathe in through your nose… 1, 2, 3, 4",
  hold: "Now hold it right there… let the stillness fill you",
  exhale: "Slowly release through your mouth… let everything go",
};

const TJCafe = ({ open, onDismiss, requiredMode = true }: TJCafeProps) => {
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [stretch] = useState(() => STRETCH_PROMPTS[Math.floor(Math.random() * STRETCH_PROMPTS.length)]);

  // Completion tracking
  const [breathingDone, setBreathingDone] = useState(false);
  const [affirmationRead, setAffirmationRead] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const reflectionWritten = reflectionText.trim().length >= 10;
  const canDismiss = !requiredMode || (breathingDone && affirmationRead && reflectionWritten);

  // Audio state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicBlobRef = useRef<string | null>(null);

  // Sound bath state
  const [soundBathOn, setSoundBathOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // TTS voice state
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Speak helper using existing elevenlabs-tts
  const speak = useCallback(async (text: string) => {
    try {
      setSpeaking(true);
      const cleanText = text.replace(/["""]/g, "").replace(/\s+/g, " ").trim().slice(0, 2000);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        URL.revokeObjectURL(voiceAudioRef.current.src);
      }
      const audio = new Audio(url);
      voiceAudioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch {
      setSpeaking(false);
    }
  }, []);

  // Auto-speak welcome on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => speak(WELCOME_MESSAGE), 800);
      return () => clearTimeout(timer);
    }
  }, [open, speak]);

  // Generate jazz music
  const startMusic = useCallback(async () => {
    // Check localStorage cache first
    const cached = localStorage.getItem("tj_cafe_jazz_blob");
    if (cached) {
      const audio = new Audio(`data:audio/mpeg;base64,${cached}`);
      audio.loop = true;
      audio.volume = musicVolume;
      musicAudioRef.current = audio;
      await audio.play();
      setMusicPlaying(true);
      return;
    }

    setMusicLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-music`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: "soft R&B jazz lounge, warm piano, gentle saxophone, slow tempo, relaxing, ambient",
            duration: 30,
          }),
        }
      );
      if (!response.ok) throw new Error("Music generation failed");
      const blob = await response.blob();

      // Cache as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        try { localStorage.setItem("tj_cafe_jazz_blob", base64); } catch {}
      };
      reader.readAsDataURL(blob);

      const url = URL.createObjectURL(blob);
      musicBlobRef.current = url;
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = musicVolume;
      musicAudioRef.current = audio;
      await audio.play();
      setMusicPlaying(true);
    } catch (err) {
      console.error("Music generation failed:", err);
    } finally {
      setMusicLoading(false);
    }
  }, [musicVolume]);

  const toggleMusic = useCallback(() => {
    if (musicPlaying && musicAudioRef.current) {
      musicAudioRef.current.pause();
      setMusicPlaying(false);
    } else if (musicAudioRef.current) {
      musicAudioRef.current.play();
      setMusicPlaying(true);
    } else {
      startMusic();
    }
  }, [musicPlaying, startMusic]);

  // Update music volume
  useEffect(() => {
    if (musicAudioRef.current) musicAudioRef.current.volume = musicVolume;
  }, [musicVolume]);

  // Sound bath — binaural beats
  const toggleSoundBath = useCallback(() => {
    if (soundBathOn) {
      if (gainRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, (audioCtxRef.current?.currentTime || 0) + 2);
        setTimeout(() => {
          osc1Ref.current?.stop();
          osc2Ref.current?.stop();
          audioCtxRef.current?.close();
          audioCtxRef.current = null;
        }, 2500);
      }
      setSoundBathOn(false);
    } else {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 3);
      gain.connect(ctx.destination);
      gainRef.current = gain;

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = 174;
      osc1.connect(gain);
      osc1.start();
      osc1Ref.current = osc1;

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 178;
      osc2.connect(gain);
      osc2.start();
      osc2Ref.current = osc2;

      setSoundBathOn(true);
    }
  }, [soundBathOn]);

  // Breathing exercise
  const startBreathing = useCallback(() => {
    setBreathing(true);
    setBreathCount(0);
    setBreathPhase("inhale");
    speak(BREATHING_NARRATIONS.inhale);
  }, [speak]);

  useEffect(() => {
    if (!breathing) return;
    const durations = { inhale: 4000, hold: 7000, exhale: 8000 };
    const next = { inhale: "hold" as const, hold: "exhale" as const, exhale: "inhale" as const };

    breathTimer.current = setTimeout(() => {
      const nextPhase = next[breathPhase];
      setBreathPhase(nextPhase);

      // Narrate next phase
      speak(BREATHING_NARRATIONS[nextPhase]);

      if (nextPhase === "inhale") {
        setBreathCount((c) => {
          if (c >= 2) {
            setBreathing(false);
            setBreathingDone(true);
            // Auto-speak affirmation after breathing completes
            setTimeout(() => {
              speak(affirmation);
              setAffirmationRead(true);
            }, 1500);
            return 0;
          }
          return c + 1;
        });
      }
    }, durations[breathPhase]);

    return () => {
      if (breathTimer.current) clearTimeout(breathTimer.current);
    };
  }, [breathing, breathPhase, speak, affirmation]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (musicAudioRef.current) { musicAudioRef.current.pause(); setMusicPlaying(false); }
      if (voiceAudioRef.current) { voiceAudioRef.current.pause(); }
      if (soundBathOn && gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
        setTimeout(() => {
          osc1Ref.current?.stop();
          osc2Ref.current?.stop();
          audioCtxRef.current?.close();
          audioCtxRef.current = null;
        }, 600);
        setSoundBathOn(false);
      }
      // Reset completion state
      setBreathingDone(false);
      setAffirmationRead(false);
      setReflectionText("");
      setBreathing(false);
    }
  }, [open, soundBathOn]);

  if (!open) return null;

  const breathLabel = breathPhase === "inhale" ? "Breathe in… 4 seconds" : breathPhase === "hold" ? "Hold… 7 seconds" : "Breathe out… 8 seconds";
  const breathScale = breathPhase === "inhale" ? 1.3 : breathPhase === "hold" ? 1.3 : 1;

  const completedCount = [breathingDone, affirmationRead, reflectionWritten].filter(Boolean).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto"
        style={{
          background: "linear-gradient(135deg, hsl(0 75% 20%) 0%, hsl(215 80% 18%) 30%, hsl(155 70% 15%) 60%, hsl(45 90% 20%) 100%)",
        }}
      >
        {/* Ambient overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, hsl(0 75% 50%) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(215 80% 45%) 0%, transparent 50%), radial-gradient(circle at 50% 50%, hsl(45 90% 55%) 0%, transparent 60%)",
        }} />

        {/* Close button (only if not required mode or all done) */}
        {(!requiredMode || canDismiss) && (
          <button onClick={onDismiss} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-white/60" />
          </button>
        )}

        <div className="relative z-10 max-w-md w-full mx-4 py-8 space-y-5">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(0 75% 50%), hsl(45 90% 55%))" }}>
              <Coffee className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display, serif)" }}>
              TJ Anderson Café
            </h1>
            <p className="text-white/50 text-xs uppercase tracking-widest">Take a moment for yourself</p>
            {requiredMode && (
              <p className="text-white/40 text-[10px] mt-2">{completedCount}/3 activities completed</p>
            )}
          </motion.div>

          {/* Audio controls row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
            <Button variant="outline" size="sm" onClick={toggleMusic} disabled={musicLoading}
              className="border-white/20 text-white hover:bg-white/10 flex-1 text-xs">
              {musicLoading ? "Loading Jazz…" : musicPlaying ? <><VolumeX className="h-3 w-3 mr-1" /> Pause Jazz</> : <><Volume2 className="h-3 w-3 mr-1" /> Play Jazz</>}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSoundBath}
              className="border-white/20 text-white hover:bg-white/10 flex-1 text-xs">
              <Headphones className="h-3 w-3 mr-1" /> {soundBathOn ? "Stop Sound Bath" : "Sound Bath"}
            </Button>
          </motion.div>

          {musicPlaying && (
            <div className="px-2">
              <p className="text-white/40 text-[10px] mb-1">Volume</p>
              <Slider value={[musicVolume * 100]} onValueChange={([v]) => setMusicVolume(v / 100)} max={100} step={5} className="w-full" />
            </div>
          )}

          {/* Welcome message */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5" style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.12)" }}>
            <p className="text-white/90 text-sm leading-relaxed">{WELCOME_MESSAGE}</p>
          </motion.div>

          {/* Breathing Exercise */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 text-center" style={{ background: "hsl(215 80% 45% / 0.15)", border: "1px solid hsl(215 80% 45% / 0.2)" }}>
            <div className="flex items-center justify-between mb-2">
              <Wind className="h-5 w-5" style={{ color: "hsl(215 80% 65%)" }} />
              {breathingDone && <Check className="h-4 w-4" style={{ color: "hsl(155 70% 55%)" }} />}
            </div>
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
            ) : breathingDone ? (
              <p className="text-white/60 text-xs">✓ Breathing complete — well done!</p>
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
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-5 w-5" style={{ color: "hsl(45 90% 55%)" }} />
              {affirmationRead && <Check className="h-4 w-4" style={{ color: "hsl(155 70% 55%)" }} />}
            </div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">Affirmation</p>
            <p className="text-white/90 text-sm italic leading-relaxed">"{affirmation}"</p>
            {!affirmationRead && (
              <Button variant="outline" size="sm" onClick={() => { speak(affirmation); setAffirmationRead(true); }}
                className="border-white/20 text-white hover:bg-white/10 mt-3 text-xs">
                Hear & Receive This ✨
              </Button>
            )}
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

          {/* Reflection Prompt */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="rounded-2xl p-5" style={{ background: "hsl(0 75% 50% / 0.1)", border: "1px solid hsl(0 75% 50% / 0.15)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Reflect</p>
              {reflectionWritten && <Check className="h-4 w-4" style={{ color: "hsl(155 70% 55%)" }} />}
            </div>
            <p className="text-white/60 text-xs mb-3">What's one thing you're proud of from today's study session?</p>
            <Textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Take a moment to reflect…"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm min-h-[60px] resize-none"
              rows={3}
            />
            {requiredMode && !reflectionWritten && (
              <p className="text-white/30 text-[10px] mt-1">Write at least 10 characters to continue</p>
            )}
          </motion.div>

          {/* Water Reminder */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "hsl(215 80% 45% / 0.1)", border: "1px solid hsl(215 80% 45% / 0.15)" }}>
            <Droplets className="h-5 w-5 flex-shrink-0" style={{ color: "hsl(215 80% 65%)" }} />
            <p className="text-white/70 text-sm">Have you had water recently? Hydration helps memory retention. 💧</p>
          </motion.div>

          {/* Dismiss */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Button
              onClick={canDismiss ? onDismiss : undefined}
              disabled={!canDismiss}
              className="w-full py-5 text-base font-semibold rounded-xl disabled:opacity-40"
              style={canDismiss ? { background: "linear-gradient(135deg, hsl(45 90% 55%), hsl(0 75% 50%))", color: "hsl(0 0% 10%)" } : {}}
            >
              {canDismiss ? "I'm Refreshed — Let's Keep Going ✨" : `Complete ${3 - completedCount} more activities`}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TJCafe;
