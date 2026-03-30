import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Heart, BookOpen, ArrowRight, ArrowLeft, CheckCircle2,
  Eye, Lightbulb, PenLine, Wrench, HelpCircle, Mic, Fingerprint,
  Volume2, VolumeX, Pause, Play,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useSoundsEnabled } from "@/hooks/useCoins";

const methodLayers = [
  { icon: Eye, label: "Visualize", desc: "See the concept before defining it.", color: "hsl(215 80% 42%)", neuro: "Activates the visual cortex and pattern recognition." },
  { icon: BookOpen, label: "Define", desc: "Understand the concept in clear, structured language.", color: "hsl(45 90% 40%)", neuro: "Engages language processing centers for cognitive labeling." },
  { icon: Mic, label: "Break It Down", desc: "Decode the word roots and origins.", color: "hsl(30 85% 45%)", neuro: "Activates analytical processing and decoding pathways." },
  { icon: Fingerprint, label: "Recognize", desc: "Identify the concept visually and physically.", color: "hsl(275 70% 50%)", neuro: "Engages spatial memory and recall systems." },
  { icon: Lightbulb, label: "Metaphor", desc: "Connect the concept to something familiar in your life.", color: "hsl(265 72% 48%)", neuro: "Activates the limbic system and emotional association." },
  { icon: Heart, label: "Information", desc: "Expand understanding without overwhelming.", color: "hsl(180 60% 32%)", neuro: "Engages comprehension and deeper reasoning." },
  { icon: PenLine, label: "Reflect", desc: "Process the idea in your own words.", color: "hsl(220 20% 35%)", neuro: "Activates metacognition and self-awareness." },
  { icon: Wrench, label: "Apply", desc: "Use your knowledge in real scenarios.", color: "hsl(145 65% 32%)", neuro: "Engages active recall and problem-solving." },
  { icon: HelpCircle, label: "Assess", desc: "Demonstrate mastery with state board questions.", color: "hsl(0 75% 45%)", neuro: "Triggers the testing effect for long-term consolidation." },
];

const howToSteps = [
  "Choose a study module.",
  "Work through each learning block.",
  "Follow the 9 layers for each term.",
  "Use the Ask TJ Mentor when you need help.",
  "Take quizzes to reinforce knowledge.",
];

const outcomes = [
  "Confidence to pass your state board exam",
  "Deep understanding of cosmetology theory",
  "Test taking strategies that work",
  "Knowledge that stays with you throughout your career",
];

const FOREWORD_TEXT = `Hi, I'm Tionna Joy Anderson.

I didn't create this app because I had it all figured out.

I created it because I didn't.

I remember what it felt like to sit in a classroom and not fully understand what was being taught… to feel like I had to memorize instead of actually learn. And when you're dealing with hundreds of terms, memorization alone will fail you.

Over time, I realized something:

It wasn't that I couldn't learn…
It was that I wasn't being taught in a way my brain could receive.

And I know I'm not the only one.

This app was built for the student who:
• Needs to see it before they understand it
• Needs to feel it before it sticks
• Needs it broken down in real language
• Needs reassurance and guidance

That's where the TJ Anderson Layer Method™ comes in.

This is not about memorizing to pass a test.

This is about:
• Understanding what you're learning
• Building confidence
• Walking into your exam knowing you get it

You are not behind.

You just needed a different approach.

Let's get to work.

— Tionna ✨`;

const VOICE_SCRIPT = `Hey… it's Tionna…

Before you start anything in here, I just want you to know…

You're not behind.

A lot of us were just taught in a way that didn't actually make sense.

I've been there… trying to memorize everything and nothing sticking.

So I created something I wish I had.

This isn't about cramming.

This is about understanding.

So take your time… breathe…

and let's go through this together.`;

const ABOUT_ME_TEXT = `My name is Tionna Joy Anderson, and I am a licensed cosmetologist, educator, and creator of the TJ Anderson Layer Method™.

With over 20 years in the beauty industry and a background in business, leadership, and education, I've spent years helping people grow in both skill and confidence.

I've worked with hundreds of clients and students, and one thing became clear:

People don't struggle because they're incapable. They struggle because they haven't been taught in a way that connects.

This platform is the result of that realization.

This is about changing how people learn.`;

const ABOUT_VOICE = `I've been doing this for over 20 years…

but teaching… helping people understand…

that's my passion.

This app is me helping you connect the dots.`;

const WelcomePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { soundsEnabled } = useSoundsEnabled();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
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
      const cleanText = text.replace(/[#*_~`]/g, "").replace(/\s+/g, " ").trim().slice(0, 5000);
      const res = await fetch(
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
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      setIsPlaying(true);
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }, [cleanup]);

  const toggleVoice = useCallback(() => {
    if (isPlaying) {
      cleanup();
    } else {
      playVoice(VOICE_SCRIPT);
    }
  }, [isPlaying, cleanup, playVoice]);

  // Auto-play voice for new visitors
  useEffect(() => {
    if (soundsEnabled && !hasAutoPlayed) {
      setHasAutoPlayed(true);
      const timer = setTimeout(() => playVoice(VOICE_SCRIPT), 1500);
      return () => clearTimeout(timer);
    }
  }, [soundsEnabled, hasAutoPlayed, playVoice]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Heart className="h-8 w-8 mx-auto mb-3" style={{ color: "hsl(346 45% 56%)" }} />
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">A Message From Tionna</h1>
          <p className="text-sm text-muted-foreground">Powered by The TJ Anderson Layer Method™</p>

          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoice}
              className="gap-2 text-xs"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause TJ Voice" : "Listen to Tionna"}
            </Button>
          </div>
        </motion.div>

        {/* Foreword */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {FOREWORD_TEXT}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* About Me */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Who I Am</h2>
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {ABOUT_ME_TEXT}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playVoice(ABOUT_VOICE)}
                className="mt-3 gap-2 text-xs text-muted-foreground"
              >
                <Volume2 className="h-3.5 w-3.5" /> Hear Tionna
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* TJ Anderson Layer Method™ */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">The TJ Anderson Layer Method™</h2>
          <p className="text-sm text-muted-foreground mb-4">
            A neuroscience-based system — each layer activates a different part of your brain for deeper learning.
          </p>
          <div className="space-y-3">
            {methodLayers.map((layer, i) => (
              <motion.div key={layer.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.04 }}>
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${layer.color}18` }}>
                      <layer.icon className="h-5 w-5" style={{ color: layer.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{i + 1}. {layer.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{layer.desc}</p>
                      <p className="text-[11px] italic mt-1" style={{ color: layer.color }}>🧠 {layer.neuro}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How to Use */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">How to Use the App</h2>
              <div className="space-y-4">
                {howToSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-primary-foreground">{i + 1}</div>
                    <p className="text-sm text-foreground/80">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Student Outcomes */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">What You Will Walk Away With</h2>
              <div className="space-y-3">
                {outcomes.map((outcome, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    <p className="text-sm text-foreground/80">{outcome}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pb-10">
          <Button className="w-full py-7 text-lg font-display font-semibold gap-3 rounded-xl shadow-lg" onClick={() => navigate("/")}>
            <ArrowRight className="h-5 w-5" /> Start My Study Journey
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
