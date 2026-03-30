import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Heart, BookOpen, Brain, CheckCircle2, ArrowRight,
  Eye, Lightbulb, PenLine, Wrench, HelpCircle, Mic, Fingerprint,
} from "lucide-react";
import AppTutorialVideo from "@/components/AppTutorialVideo";

const methodLayers = [
  { icon: Eye,         label: "Visualize",      desc: "See the concept before defining it.",                     color: "hsl(215 80% 42%)", neuro: "Activates the visual cortex and pattern recognition." },
  { icon: BookOpen,    label: "Define",          desc: "Understand the concept in clear, structured language.",    color: "hsl(45 90% 40%)",  neuro: "Engages language processing centers for cognitive labeling." },
  { icon: Mic,         label: "Break It Down",   desc: "Decode the word roots and origins.",                      color: "hsl(30 85% 45%)",  neuro: "Activates analytical processing and decoding pathways." },
  { icon: Fingerprint, label: "Recognize",       desc: "Identify the concept visually and physically.",           color: "hsl(275 70% 50%)", neuro: "Engages spatial memory and recall systems." },
  { icon: Lightbulb,   label: "Metaphor",        desc: "Connect the concept to something familiar in your life.", color: "hsl(265 72% 48%)", neuro: "Activates the limbic system and emotional association." },
  { icon: Heart,       label: "Information",     desc: "Expand understanding without overwhelming.",              color: "hsl(180 60% 32%)", neuro: "Engages comprehension and deeper reasoning." },
  { icon: PenLine,     label: "Reflect",         desc: "Process the idea in your own words.",                     color: "hsl(220 20% 35%)", neuro: "Activates metacognition and self-awareness." },
  { icon: Wrench,      label: "Apply",           desc: "Use your knowledge in real scenarios.",                   color: "hsl(145 65% 32%)", neuro: "Engages active recall and problem-solving." },
  { icon: HelpCircle,  label: "Assess",          desc: "Demonstrate mastery with state board questions.",         color: "hsl(0 75% 45%)",   neuro: "Triggers the testing effect for long-term consolidation." },
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

const WelcomePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, hsl(346 45% 96%), hsl(280 30% 96%), hsl(38 40% 96%), hsl(195 30% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Section 1 — Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-7 w-7" style={{ color: "hsl(346 45% 56%)" }} />
            <span className="font-display text-3xl font-bold text-foreground">TJ Test Prep</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-2" style={{ background: "linear-gradient(135deg, hsl(346 45% 56%), hsl(280 50% 55%), hsl(25 70% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Foreword
          </h1>
          <p className="text-base text-muted-foreground mb-1">By Tionna Joy Anderson</p>
          <p className="text-sm text-muted-foreground mb-4">Powered by The TJ Anderson Layer Method™</p>
          <AppTutorialVideo variant="card" label="Watch How to Navigate the App" />
        </motion.div>

        {/* Section 2 — Who I Am */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Who I Am</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                My name is Tionna Anderson and I created this learning system because every student learns differently. Cosmetology education often focuses on memorization, but true understanding requires deeper connection to the material. CosmoPrep was built to help students move beyond memorization and into confidence, comprehension, and long term knowledge.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Section 3 — Why I Created This Platform */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Why I Created This Platform</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Students struggle with memorizing hundreds of cosmetology terms. This system helps students understand concepts through multiple learning pathways. In many states, the first time pass rate for cosmetology exams can range between approximately fifty percent and seventy percent. This platform was designed to help students feel supported, encouraged, and confident while preparing for their exam.
              </p>
            </CardContent>
          </Card>
        </motion.section>

        {/* Section 4 — The TJ Anderson Layer Method™ (9 Layers) */}
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
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${layer.color}18` }}
                    >
                      <layer.icon className="h-5 w-5" style={{ color: layer.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {i + 1}. {layer.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-snug">{layer.desc}</p>
                      <p className="text-[11px] italic mt-1" style={{ color: layer.color }}>
                        🧠 {layer.neuro}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section 5 — How to Use the App */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">How to Use the App</h2>
              <div className="space-y-4">
                {howToSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-primary text-primary-foreground">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground/80">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Section 6 — Student Outcomes */}
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

        {/* Section 7 — Start Learning Button */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pb-10">
          <Button
            className="w-full py-7 text-lg font-display font-semibold gap-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => navigate("/")}
          >
            <ArrowRight className="h-5 w-5" />
            Start My Study Journey
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
