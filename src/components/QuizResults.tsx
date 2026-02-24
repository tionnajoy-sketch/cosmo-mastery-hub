import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizResultsProps {
  score: number;
  total: number;
  categoryTitle: string;
  onRetry: () => void;
  onHome: () => void;
}

const QuizResults = ({ score, total, categoryTitle, onRetry, onHome }: QuizResultsProps) => {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 75;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-md text-center"
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            passed ? "bg-green-100" : "bg-secondary"
          }`}
        >
          <Trophy className={`h-10 w-10 ${passed ? "text-green-500" : "text-muted-foreground"}`} />
        </motion.div>

        <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
          {passed ? "Congratulations!" : "Keep Studying!"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{categoryTitle}</p>

        <div className="mb-6">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-display text-5xl font-bold text-primary"
          >
            {percentage}%
          </motion.span>
          <p className="mt-2 text-sm text-muted-foreground">
            {score} out of {total} correct
          </p>
        </div>

        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          {passed
            ? "Great job! You're well prepared for this section of the state board exam."
            : "You need 75% to pass. Review the material and try again — you've got this!"}
        </p>

        <div className="flex gap-3">
          <Button onClick={onRetry} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" /> Retry
          </Button>
          <Button onClick={onHome} className="flex-1 gap-2">
            <Home className="h-4 w-4" /> Home
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizResults;
