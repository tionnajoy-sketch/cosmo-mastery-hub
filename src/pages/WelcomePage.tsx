import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, BookOpen, Brain, Target, GraduationCap,
  Eye, MessageSquare, Pen, Shield, CheckCircle2, ArrowRight,
} from "lucide-react";
import AppTutorialVideo from "@/components/AppTutorialVideo";

const methodLayers = [
  { icon: BookOpen, label: "Definition", desc: "Understand the concept in clear, original language." },
  { icon: Eye, label: "Visualize", desc: "See the structure or process through an illustration." },
  { icon: Sparkles, label: "Metaphor", desc: "Connect the concept to something familiar in everyday life." },
  { icon: Heart, label: "Affirmation", desc: "Reinforce confidence with grounding statements." },
  { icon: MessageSquare, label: "Reflection", desc: "Process the idea in your own words." },
  { icon: Pen, label: "Journal", desc: "Strengthen memory through personal writing." },
  { icon: GraduationCap, label: "Quiz", desc: "Practice with state board style questions." },
];

const howToSteps = [
  "Choose a study module.",
  "Work through each learning block.",
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
  const firstName = profile?.name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, hsl(346 45% 96%), hsl(280 30% 96%), hsl(38 40% 96%), hsl(195 30% 96%))" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Section 1 — Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-7 w-7" style={{ color: "hsl(346 45% 56%)" }} />
            <span className="font-display text-3xl font-bold text-foreground">CosmoPrep</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-2" style={{ background: "linear-gradient(135deg, hsl(346 45% 56%), hsl(280 50% 55%), hsl(25 70% 55%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Welcome to CosmoPrep
          </h1>
          <p className="text-base text-muted-foreground mb-4">Powered by The TJ Anderson Layer Method™</p>
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

        {/* Section 4 — How the TJ Anderson Layer Method Works */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">How the TJ Anderson Layer Method™ Works</h2>
          <p className="text-sm text-muted-foreground mb-4">Each concept is studied through multiple layers so the information stays in your memory.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {methodLayers.map((layer, i) => (
              <Card key={layer.label} className="border-0 shadow-sm bg-card">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center bg-secondary">
                    <layer.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{layer.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{layer.desc}</p>
                </CardContent>
              </Card>
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
