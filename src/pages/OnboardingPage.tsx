import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ArrowRight, Sparkles, Brain, Target, Heart, Zap, CheckCircle2 } from "lucide-react";

/* ── Program options ─────────────────────────────────── */
const PROGRAMS = [
  { id: "cosmetology", label: "Cosmetology", available: true },
  { id: "real_estate", label: "Real Estate", available: true },
  { id: "barbering", label: "Barbering", available: false },
  { id: "nursing", label: "Nursing", available: false },
];

/* ── Learning Identity Quiz questions ─────────────────── */
const QUIZ_QUESTIONS = [
  {
    question: "When learning something new, what helps you understand it best?",
    options: [
      { label: "Seeing a diagram or picture", value: "visual" },
      { label: "Hearing someone explain it", value: "auditory" },
      { label: "Doing it hands-on", value: "experiential" },
      { label: "Connecting it to a real story or person", value: "relational" },
    ],
  },
  {
    question: "What frustrates you most when studying?",
    options: [
      { label: "Too much text without visuals", value: "visual" },
      { label: "Not being able to ask questions", value: "relational" },
      { label: "Feeling like it is not relevant to real life", value: "experiential" },
      { label: "Going too fast without checking understanding", value: "auditory" },
    ],
  },
  {
    question: "How confident do you feel about passing your exam right now?",
    options: [
      { label: "Not confident at all", value: "low" },
      { label: "Somewhat nervous", value: "developing" },
      { label: "Fairly confident", value: "moderate" },
      { label: "Very confident", value: "high" },
    ],
  },
  {
    question: "When you get stuck on a concept, what do you usually do?",
    options: [
      { label: "Look for a video or image", value: "V" },
      { label: "Re-read the definition slowly", value: "D" },
      { label: "Try to relate it to something I know", value: "M" },
      { label: "Practice with a scenario or quiz", value: "A" },
    ],
  },
  {
    question: "Which layer of learning excites you most?",
    options: [
      { label: "Seeing the big picture visually", value: "V" },
      { label: "Understanding deeper information", value: "I" },
      { label: "Reflecting on what it means to me", value: "R" },
      { label: "Testing myself with real questions", value: "K" },
    ],
  },
  {
    question: "How do you prefer to review before an exam?",
    options: [
      { label: "Flashcards and visuals", value: "visual" },
      { label: "Practice tests repeatedly", value: "experiential" },
      { label: "Talk through concepts with someone", value: "relational" },
      { label: "Listen to summaries", value: "auditory" },
    ],
  },
];

/* ── DNA Code generator ───────────────────────────────── */
function generateDNACode(answers: string[]): { code: string; layer: string; engagement: number; retention: string; confidence: string } {
  // L: Layer strength — most picked layer-related answer
  const layerVotes: Record<string, number> = { D: 0, V: 0, M: 0, I: 0, R: 0, A: 0, K: 0 };
  answers.forEach(a => { if (layerVotes[a] !== undefined) layerVotes[a]++; });
  const layer = Object.entries(layerVotes).sort((a, b) => b[1] - a[1])[0][0];

  // E: Engagement (0–9) based on style diversity
  const uniqueAnswers = new Set(answers).size;
  const engagement = Math.min(9, Math.round((uniqueAnswers / answers.length) * 9));

  // R: Retention (A–Z) based on learning style consistency
  const styleVotes: Record<string, number> = { visual: 0, auditory: 0, experiential: 0, relational: 0 };
  answers.forEach(a => { if (styleVotes[a] !== undefined) styleVotes[a]++; });
  const topStyle = Object.values(styleVotes).sort((a, b) => b - a)[0];
  const retentionIndex = Math.min(25, Math.round((topStyle / answers.length) * 25));
  const retention = String.fromCharCode(65 + retentionIndex); // A–Z

  // C: Confidence (a–z)
  const confAnswer = answers[2]; // question 3 is confidence
  const confMap: Record<string, number> = { low: 3, developing: 10, moderate: 18, high: 24 };
  const confIndex = confMap[confAnswer] ?? 12;
  const confidence = String.fromCharCode(97 + confIndex); // a–z

  const code = `${layer}${engagement}${retention}${confidence}`;
  return { code, layer, engagement, retention, confidence };
}

function getDNAExplanation(layer: string, confidence: string): string {
  const layerNames: Record<string, string> = {
    D: "Definition", V: "Visualization", M: "Metaphor", I: "Information",
    R: "Reflection", A: "Application", K: "Knowledge Check",
  };
  const confLevel = confidence.charCodeAt(0) - 97;
  const confLabel = confLevel < 8 ? "building" : confLevel < 17 ? "developing" : "strong";
  return `Your strongest learning layer is ${layerNames[layer] || "Visualization"}. Your confidence is ${confLabel}. The platform will adapt to reinforce your strengths and support your growth areas.`;
}

/* ── Component ────────────────────────────────────────── */
const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0); // 0=welcome, 1=program, 2-7=quiz, 8=dna result
  const [selectedProgram, setSelectedProgram] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [dnaResult, setDnaResult] = useState<{ code: string; layer: string; engagement: number; retention: string; confidence: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const quizIndex = step - 2;
  const totalSteps = 2 + QUIZ_QUESTIONS.length + 1; // welcome + program + quiz + result
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  const handleAnswer = useCallback((value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setStep(s => s + 1);
    } else {
      const result = generateDNACode(newAnswers);
      setDnaResult(result);
      setStep(totalSteps - 1);
    }
  }, [answers, quizIndex, totalSteps]);

  const handleComplete = useCallback(async () => {
    if (!user || !dnaResult) return;
    setSaving(true);
    await supabase.from("profiles").update({
      selected_program: selectedProgram,
      has_completed_onboarding: true,
      tj_dna_code: dnaResult.code,
      dna_layer_strength: dnaResult.layer,
      dna_engagement: dnaResult.engagement,
      dna_retention: dnaResult.retention,
      dna_confidence: dnaResult.confidence,
    } as any).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    navigate("/");
  }, [user, dnaResult, selectedProgram, navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {step > 0 && (
        <div className="px-4 pt-4 max-w-lg mx-auto w-full">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1 text-right">Step {step + 1} of {totalSteps}</p>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full text-center space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/5 mb-2">
                  <BookOpen className="h-8 w-8 text-foreground" />
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">TJ Anderson Test Prep</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  This platform learns <span className="font-semibold text-foreground">YOU</span> first, then teaches you.
                </p>
              </div>
              <div className="space-y-3 text-left">
                {[
                  { icon: Brain, text: "Discover your unique learning identity" },
                  { icon: Target, text: "Get a personalized study path" },
                  { icon: Heart, text: "Learn with support, not stress" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <Icon className="h-5 w-5 text-foreground shrink-0" />
                    <span className="text-sm text-card-foreground">{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full py-6 text-base gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Choose Program */}
          {step === 1 && (
            <motion.div key="program" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-bold text-foreground">Choose Your Path</h2>
                <p className="text-sm text-muted-foreground">Select the program you are preparing for</p>
              </div>
              <div className="space-y-3">
                {PROGRAMS.map(p => (
                  <button
                    key={p.id}
                    disabled={!p.available}
                    onClick={() => setSelectedProgram(p.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProgram === p.id
                        ? "border-foreground bg-foreground/5"
                        : p.available
                        ? "border-border bg-card hover:border-foreground/30"
                        : "border-border/50 bg-muted/50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-card-foreground">{p.label}</span>
                      {!p.available && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Coming Soon</span>}
                      {selectedProgram === p.id && <CheckCircle2 className="h-5 w-5 text-foreground" />}
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(2)} disabled={!selectedProgram} className="w-full py-6 text-base gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Steps 2–7: Quiz */}
          {step >= 2 && step < totalSteps - 1 && (
            <motion.div key={`quiz-${quizIndex}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="max-w-md w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 mb-1">
                  <Zap className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Learning Identity Quiz — Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</p>
                <h2 className="font-display text-xl font-bold text-foreground leading-snug">{QUIZ_QUESTIONS[quizIndex].question}</h2>
              </div>
              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full p-4 rounded-xl border-2 border-border bg-card hover:border-foreground/40 hover:bg-foreground/5 text-left transition-all"
                  >
                    <span className="text-sm text-card-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Final: DNA Result */}
          {step === totalSteps - 1 && dnaResult && (
            <motion.div key="dna" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full space-y-6 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-foreground/5 mb-2">
                  <Sparkles className="h-7 w-7 text-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">Your TJ Learning DNA</h2>
                <p className="text-sm text-muted-foreground">Your personalized learning identity code</p>
              </div>

              {/* DNA Code Display */}
              <Card className="border-2 border-foreground/20 bg-card">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    {dnaResult.code.split("").map((char, i) => (
                      <div key={i} className="w-14 h-14 rounded-lg bg-foreground text-primary-foreground flex items-center justify-center font-display text-2xl font-bold">
                        {char}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    [Layer] [Engagement] [Retention] [Confidence]
                  </p>
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {getDNAExplanation(dnaResult.layer, dnaResult.confidence)}
                  </p>
                </CardContent>
              </Card>

              <Button onClick={handleComplete} disabled={saving} className="w-full py-6 text-base gap-2">
                {saving ? "Setting up your experience..." : "Start Learning"} <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;