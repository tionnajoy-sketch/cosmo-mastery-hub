import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { questions } from "@/data/quizData";
import QuizCard from "./QuizCard";
import QuizResults from "./QuizResults";

interface QuizViewProps {
  categoryId: string;
  categoryTitle: string;
  onBack: () => void;
}

const QuizView = ({ categoryId, categoryTitle, onBack }: QuizViewProps) => {
  const categoryQuestions = useMemo(
    () => questions.filter((q) => q.category === categoryId),
    [categoryId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < categoryQuestions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <QuizResults
        score={score}
        total={categoryQuestions.length}
        categoryTitle={categoryTitle}
        onRetry={handleRetry}
        onHome={onBack}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <QuizCard
        key={currentIndex}
        question={categoryQuestions[currentIndex]}
        currentIndex={currentIndex}
        totalQuestions={categoryQuestions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
    </AnimatePresence>
  );
};

export default QuizView;
