import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Target, Eye, XCircle, CheckCircle2, Lightbulb } from "lucide-react";
import BrainNote from "@/components/BrainNote";
import { pageColors } from "@/lib/colors";

const c = pageColors.strategy;

const steps = [
  {
    icon: Eye,
    title: "Step 1: Read the Answer Choices First",
    description: "Before you even look at the question, read all four answer choices. This primes your brain to know what kind of information you're looking for. It's like scanning a menu before the waiter asks what you want — you already know your options.",
    tip: "Look for patterns. Often two answers will be clearly related and two will seem off. That's your first clue.",
    brainNote: "Brain note: When you look at the answer choices first, your brain knows what to look for. It stops reading on autopilot and starts searching for key words on purpose.",
    example: {
      answers: ["Epidermis", "Dermis", "Hypodermis", "Melanocyte"],
      insight: "Notice: three are skin layers, one is a cell type. That difference matters."
    }
  },
  {
    icon: BookOpen,
    title: "Step 2: Read the Question Stem",
    description: "Now read the question or passage carefully. Because you already know the answer choices, your brain is filtering for relevant information as you read. You're reading with purpose, not passively.",
    tip: "Underline or mentally note key words like 'outermost,' 'deepest,' 'primary function,' or 'most likely.'",
    brainNote: "Brain note: Because you already know the choices, your brain filters for what matters. You're reading with intention, not guessing what the question wants.",
    example: {
      question: "Which layer of the skin is the outermost layer and serves as the body's first line of defense against environmental damage?",
      insight: "Key words: 'outermost' and 'first line of defense' — these narrow it down immediately."
    }
  },
  {
    icon: XCircle,
    title: "Step 3: Eliminate Two Wrong Answers",
    description: "This is where the magic happens. Don't try to find the right answer yet. Instead, find the two answers that are clearly wrong. Crossing out wrong answers reduces your stress and increases your odds from 25% to 50%.",
    tip: "Ask yourself: 'Is this answer even in the same category as what the question is asking?' If not, eliminate it.",
    brainNote: "Brain note: Crossing out wrong answers reduces overload. Your brain can focus better when it only has to compare two options instead of four.",
    example: {
      eliminated: ["Hypodermis — this is the deepest layer, not outermost", "Melanocyte — this is a cell, not a layer"],
      remaining: ["Epidermis", "Dermis"],
      insight: "Now you only have two choices. Your brain can focus."
    }
  },
  {
    icon: CheckCircle2,
    title: "Step 4: Choose the Best Remaining Answer",
    description: "Look at your two remaining answers. Re-read the question if needed. Choose the one that is most directly supported by the information in the question. Don't overthink — trust your preparation.",
    tip: "The best answer is the one that matches the most key words from the question stem.",
    brainNote: "Brain note: The best answer is usually the one that repeats or matches the most key words from the question. Your brain loves patterns — let them guide you.",
    example: {
      correct: "Epidermis",
      reasoning: "'Outermost' and 'first line of defense' both describe the epidermis. The dermis is the second layer. Epidermis is the strongest answer."
    }
  }
];

const StrategyPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: c.gradient }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2" style={{ color: c.backButton }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <Target className="h-10 w-10 mx-auto mb-3" style={{ color: c.heading }} />
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: c.heading }}>
              The TJ Anderson Layer Method
            </h1>
            <p className="text-base leading-relaxed" style={{ color: c.subtext }}>
              A proven 4-step strategy for answering state board exam questions with confidence.
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="w-10 h-10 rounded-full font-bold text-sm transition-all"
                style={{
                  background: currentStep === i ? c.stepActive : c.stepInactive,
                  color: currentStep === i ? c.stepActiveText : c.stepInactiveText,
                  boxShadow: currentStep === i ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {(() => {
                const step = steps[currentStep];
                const Icon = step.icon;
                return (
                  <div className="space-y-4">
                    <Card className="border-0 shadow-lg" style={{ background: c.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-xl" style={{ background: c.iconBg }}>
                            <Icon className="h-6 w-6" style={{ color: c.iconColor }} />
                          </div>
                          <h2 className="font-display text-xl font-semibold" style={{ color: c.cardHeading }}>
                            {step.title}
                          </h2>
                        </div>
                        <p className="text-base leading-relaxed mb-4" style={{ color: c.cardText }}>
                          {step.description}
                        </p>
                         <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: c.tipBg }}>
                          <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: c.tipIcon }} />
                          <p className="text-sm leading-relaxed" style={{ color: c.tipText }}>
                            {step.tip}
                          </p>
                        </div>
                        {step.brainNote && <BrainNote text={step.brainNote} />}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Worked example */}
                    <Card className="border-2" style={{ background: c.exampleBg, borderColor: c.exampleBorder }}>
                      <CardContent className="p-5">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: c.exampleLabel }}>
                          Worked Example
                        </p>

                        {step.example.answers && (
                          <div className="space-y-2 mb-3">
                            {step.example.answers.map((a, i) => (
                              <div key={i} className="px-3 py-2 rounded-lg text-sm" style={{ background: c.card, color: c.cardText }}>
                                <span className="font-semibold mr-1" style={{ color: c.cardHeading }}>{String.fromCharCode(65 + i)}.</span> {a}
                              </div>
                            ))}
                          </div>
                        )}

                        {step.example.question && (
                          <div className="p-3 rounded-lg mb-3" style={{ background: c.card }}>
                            <p className="text-sm leading-relaxed" style={{ color: c.cardText }}>
                              "{step.example.question}"
                            </p>
                          </div>
                        )}

                        {step.example.eliminated && (
                          <div className="space-y-2 mb-3">
                            {step.example.eliminated.map((e, i) => (
                              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 40% 96%)" }}>
                                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(0 55% 50%)" }} />
                                <p className="text-sm line-through" style={{ color: "hsl(0 20% 50%)" }}>{e}</p>
                              </div>
                            ))}
                            {step.example.remaining && (
                              <div className="flex gap-2 mt-2">
                                {step.example.remaining.map((r, i) => (
                                  <div key={i} className="flex-1 px-3 py-2 rounded-lg text-sm text-center font-medium" style={{ background: "hsl(145 40% 94%)", color: "hsl(145 40% 28%)", border: "2px solid hsl(145 40% 75%)" }}>
                                    {r}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {step.example.correct && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "hsl(145 40% 94%)", border: "2px solid hsl(145 50% 50%)" }}>
                            <CheckCircle2 className="h-5 w-5" style={{ color: "hsl(145 60% 35%)" }} />
                            <span className="font-semibold text-sm" style={{ color: "hsl(145 40% 25%)" }}>✓ {step.example.correct}</span>
                          </div>
                        )}

                        {step.example.reasoning && (
                          <p className="text-sm italic leading-relaxed" style={{ color: c.cardText }}>
                            {step.example.reasoning}
                          </p>
                        )}

                        <p className="text-sm font-medium mt-3 pt-3 border-t" style={{ color: c.exampleLabel, borderColor: c.exampleBorder }}>
                          💡 {step.example.insight}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
              className="gap-1"
              style={{ color: c.backButton }}
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(s => s + 1)}
                className="gap-1"
                style={{ background: c.nextButton, color: "white" }}
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/")}
                className="gap-1"
                style={{ background: c.nextButton, color: "white" }}
              >
                Start Studying <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StrategyPage;
