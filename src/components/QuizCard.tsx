import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/data/quizData";
import { CheckCircle2, XCircle, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (result: "best" | "acceptable" | "wrong") => void;
  onNext: () => void;
}

const QuizCard = ({ question, currentIndex, totalQuestions, onAnswer, onNext }: QuizCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === question.bestAnswer) {
      onAnswer("best");
    } else if (index === question.acceptableAnswer) {
      onAnswer("acceptable");
    } else {
      onAnswer("wrong");
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    onNext();
  };

  const isBest = (index: number) => index === question.bestAnswer;
  const isAcceptable = (index: number) => index === question.acceptableAnswer;

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-2xl"
    >
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-body">Question {currentIndex + 1} of {totalQuestions}</span>
          <span className="font-body">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        <h2 className="mb-6 font-body text-base font-normal text-foreground leading-relaxed">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showResult = selectedAnswer !== null;
            const best = isBest(index);
            const acceptable = isAcceptable(index);

            let optionClasses = "w-full rounded-xl border-2 p-4 text-left font-body text-sm transition-all duration-200 ";
            if (!showResult) {
              optionClasses += "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer";
            } else if (best) {
              optionClasses += "border-green-400 bg-green-50 text-green-900";
            } else if (acceptable) {
              optionClasses += "border-amber-400 bg-amber-50 text-amber-900";
            } else if (isSelected) {
              optionClasses += "border-destructive/40 bg-destructive/5 text-destructive";
            } else {
              optionClasses += "border-border bg-card opacity-50";
            }

            return (
              <motion.button
                key={index}
                whileHover={!showResult ? { scale: 1.01 } : {}}
                whileTap={!showResult ? { scale: 0.99 } : {}}
                onClick={() => handleSelect(index)}
                className={optionClasses}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && best && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 shrink-0 text-green-500 fill-green-500" />
                      <span className="text-xs font-medium text-green-600">Best</span>
                    </div>
                  )}
                  {showResult && acceptable && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">Acceptable</span>
                    </div>
                  )}
                  {showResult && isSelected && !best && !acceptable && (
                    <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              {/* Result banner */}
              {selectedAnswer !== null && (
                <div className={`mb-3 rounded-lg px-4 py-2 text-sm font-medium ${
                  selectedAnswer === question.bestAnswer
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : selectedAnswer === question.acceptableAnswer
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-destructive/5 text-destructive border border-destructive/20"
                }`}>
                  {selectedAnswer === question.bestAnswer && "⭐ Excellent! You chose the best answer."}
                  {selectedAnswer === question.acceptableAnswer && "✓ Good — that's an acceptable answer, but there's a stronger choice."}
                  {selectedAnswer !== question.bestAnswer && selectedAnswer !== question.acceptableAnswer && "✗ Not quite. Review the explanation below."}
                </div>
              )}

              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-sm font-medium text-secondary-foreground mb-1">Explanation</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleNext} className="gap-2">
                  {currentIndex + 1 < totalQuestions ? "Next Question" : "See Results"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default QuizCard;
