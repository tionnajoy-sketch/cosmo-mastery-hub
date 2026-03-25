import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLevelConfig } from "@/lib/crosswordGenerator";
import { Trophy, Target, Clock, Flame, RotateCcw, ArrowRight, Star, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface Props {
  result: {
    level: number;
    score: number;
    totalWords: number;
    wordsCorrect: number;
    timeTaken: number;
    weakCategories: string[];
    completedWords: string[];
  };
  onPlayAgain: () => void;
}

const GridResults = ({ result, onPlayAgain }: Props) => {
  const config = getLevelConfig(result.level);
  const pct = Math.round((result.wordsCorrect / result.totalWords) * 100);
  const isPerfect = result.wordsCorrect === result.totalWords;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (isPerfect) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [isPerfect]);

  const getMessage = () => {
    if (pct === 100) return "Perfect grid! You're showing real mastery. 🏆";
    if (pct >= 80) return "Excellent work! You're getting closer to board ready every day.";
    if (pct >= 60) return "Good progress! The areas you missed will show up in tomorrow's grid.";
    return "Keep going! Every grid builds your knowledge. The system will adapt to help you grow.";
  };

  return (
    <div>
      <div className="text-center mb-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
          {isPerfect ? (
            <Star className="h-16 w-16 mx-auto mb-3 text-amber-400" />
          ) : pct >= 70 ? (
            <Trophy className="h-16 w-16 mx-auto mb-3 text-amber-400" />
          ) : (
            <Target className="h-16 w-16 mx-auto mb-3 text-blue-400" />
          )}
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Grid Complete!</h2>
        <p className="text-white/60 text-sm max-w-md mx-auto">{getMessage()}</p>
      </div>

      {/* Score Card */}
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardContent className="p-5">
          <div className="text-center mb-4">
            <p className="text-4xl font-bold" style={{ color: config.color }}>{pct}%</p>
            <p className="text-sm text-white/50">{result.wordsCorrect}/{result.totalWords} words correct</p>
          </div>
          <Progress value={pct} className="h-3 bg-white/10 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Clock className="h-4 w-4 mx-auto text-white/40 mb-1" />
              <p className="text-sm font-bold text-white">{formatTime(result.timeTaken)}</p>
              <p className="text-xs text-white/40">Time</p>
            </div>
            <div>
              <Flame className="h-4 w-4 mx-auto text-orange-400 mb-1" />
              <p className="text-sm font-bold text-white">{result.score}</p>
              <p className="text-xs text-white/40">XP Earned</p>
            </div>
            <div>
              <Target className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-sm font-bold text-white">Lvl {result.level}</p>
              <p className="text-xs text-white/40">{config.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {result.weakCategories.length > 0 && (
        <Card className="bg-rose-500/10 border-rose-500/20 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <p className="text-sm font-medium text-rose-300">Areas to Focus On</p>
            </div>
            <p className="text-xs text-white/50 mb-2">These will appear more in your next grid:</p>
            <div className="flex flex-wrap gap-2">
              {result.weakCategories.map((c) => (
                <span key={c} className="px-2 py-1 bg-rose-500/20 text-rose-200 rounded-full text-xs">{c}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Words */}
      {result.completedWords.length > 0 && (
        <Card className="bg-emerald-500/10 border-emerald-500/20 mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-emerald-300 mb-2">Words Mastered</p>
            <div className="flex flex-wrap gap-2">
              {result.completedWords.map((w) => (
                <span key={w} className="px-2 py-1 bg-emerald-500/20 text-emerald-200 rounded-full text-xs font-medium">{w}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-white/20 text-white/70"
          onClick={onPlayAgain}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> New Grid
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
          onClick={onPlayAgain}
        >
          Continue Training <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default GridResults;
