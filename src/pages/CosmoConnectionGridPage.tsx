import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCoins } from "@/hooks/useCoins";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import CrosswordGame from "@/components/cosmo-grid/CrosswordGame";
import GridResults from "@/components/cosmo-grid/GridResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { generateCrossword, getLevelConfig, type CrosswordGrid } from "@/lib/crosswordGenerator";
import { Grid3X3, Zap, Trophy, Target, ArrowLeft, Play, Flame } from "lucide-react";

type Phase = "intro" | "playing" | "results";

interface SessionData {
  level: number;
  score: number;
  totalWords: number;
  wordsCorrect: number;
  timeTaken: number;
  weakCategories: string[];
  completedWords: string[];
}

const CosmoConnectionGridPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [readiness, setReadiness] = useState(0);
  const [crossword, setCrossword] = useState<CrosswordGrid | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weakCategories, setWeakCategories] = useState<string[]>([]);

  // Load user progress
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: sessions } = await supabase
        .from("cosmo_grid_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessions && sessions.length > 0) {
        setTotalSessions(sessions.length);

        // Determine level from recent performance
        const recent = sessions.slice(0, 5);
        const avgScore = recent.reduce((s, r) => s + (r.total_words > 0 ? r.words_correct / r.total_words : 0), 0) / recent.length;
        const completedCount = sessions.filter((s: any) => s.completed).length;

        let newLevel = 1;
        if (avgScore >= 0.9 && completedCount >= 10) newLevel = 5;
        else if (avgScore >= 0.85 && completedCount >= 7) newLevel = 4;
        else if (avgScore >= 0.75 && completedCount >= 4) newLevel = 3;
        else if (avgScore >= 0.6 && completedCount >= 2) newLevel = 2;
        setLevel(newLevel);

        // Calculate streak
        let streakCount = 0;
        const today = new Date().toISOString().split("T")[0];
        for (let i = 0; i < sessions.length; i++) {
          const d = new Date(sessions[i].session_date).toISOString().split("T")[0];
          const expected = new Date();
          expected.setDate(expected.getDate() - streakCount);
          if (d === expected.toISOString().split("T")[0] && sessions[i].completed) {
            streakCount++;
          } else if (i === 0 && d !== today) {
            break;
          } else {
            break;
          }
        }
        setStreak(streakCount);

        // Readiness = overall accuracy across all sessions
        const totalCorrect = sessions.reduce((s, r) => s + r.words_correct, 0);
        const totalWords = sessions.reduce((s, r) => s + r.total_words, 0);
        setReadiness(totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0);

        // Weak categories from recent sessions
        const weak = new Set<string>();
        recent.forEach((s: any) => {
          if (Array.isArray(s.weak_categories)) {
            (s.weak_categories as string[]).forEach((c) => weak.add(c));
          }
        });
        setWeakCategories(Array.from(weak));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const startGrid = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const config = getLevelConfig(level);

    // Fetch terms from all sections
    const { data: terms } = await supabase
      .from("terms")
      .select("id, term, definition, section_id, sections(name)");

    if (!terms || terms.length === 0) {
      setLoading(false);
      return;
    }

    // Also get user's wrong answers to prioritize weak areas
    const { data: wrongAnswers } = await supabase
      .from("wrong_answers")
      .select("question_id, questions(related_term_id, section_id, sections(name))")
      .eq("user_id", user.id);

    const weakTermIds = new Set<string>();
    const weakSections = new Set<string>();
    wrongAnswers?.forEach((wa: any) => {
      if (wa.questions?.related_term_id) weakTermIds.add(wa.questions.related_term_id);
      if (wa.questions?.sections?.name) weakSections.add(wa.questions.sections.name);
    });

    // Prioritize weak terms, then fill with others
    const termPool = terms.map((t: any) => ({
      id: t.id,
      term: t.term,
      clue: t.definition,
      category: t.sections?.name || "General",
      isWeak: weakTermIds.has(t.id),
    }));

    // Shuffle and prioritize
    const shuffled = termPool.sort(() => Math.random() - 0.5);
    const weakFirst = [
      ...shuffled.filter((t) => t.isWeak),
      ...shuffled.filter((t) => !t.isWeak),
    ].slice(0, config.wordCount * 3); // provide extra for the algorithm to pick from

    const grid = generateCrossword(weakFirst, config.wordCount);
    setCrossword(grid);
    setPhase("playing");
    setLoading(false);
  }, [user, level]);

  const handleComplete = useCallback(async (result: SessionData) => {
    if (!user) return;
    setSessionResult(result);

    // Save session
    await supabase.from("cosmo_grid_sessions").insert({
      user_id: user.id,
      level: result.level,
      score: result.score,
      total_words: result.totalWords,
      words_correct: result.wordsCorrect,
      time_taken_seconds: result.timeTaken,
      weak_categories: result.weakCategories,
      completed_words: result.completedWords,
      completed: true,
    });

    // Award coins
    const coinsEarned = result.wordsCorrect * 2 + (result.wordsCorrect === result.totalWords ? 10 : 0);
    addCoins(coinsEarned, "correct");

    setPhase("results");
  }, [user, addCoins]);

  const config = getLevelConfig(level);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white/60 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Button>

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm mb-4">
                  <Grid3X3 className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300">TJ Anderson Layer Method™</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                  Cosmo Connection Grid™
                </h1>
                <p className="text-white/60 max-w-lg mx-auto">
                  Your daily adaptive mastery system. Each grid reinforces what you know and challenges your weak spots until you're board ready.
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{streak}</p>
                    <p className="text-xs text-white/50">Day Streak</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{totalSessions}</p>
                    <p className="text-xs text-white/50">Grids Done</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <Target className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{readiness}%</p>
                    <p className="text-xs text-white/50">Board Ready</p>
                  </CardContent>
                </Card>
              </div>

              {/* Readiness Meter */}
              <Card className="bg-white/5 border-white/10 mb-6">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">State Board Readiness</span>
                    <span className="text-sm font-bold" style={{ color: config.color }}>{readiness}%</span>
                  </div>
                  <Progress value={readiness} className="h-3 bg-white/10" />
                  {readiness >= 90 && (
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Board Ready! Keep practicing to maintain mastery.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Current Level */}
              <Card className="border-2 mb-6" style={{ borderColor: config.color, background: `${config.color}15` }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Current Level</p>
                      <p className="text-xl font-bold" style={{ color: config.color }}>Level {level} — {config.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <div
                          key={l}
                          className="w-3 h-3 rounded-full"
                          style={{ background: l <= level ? config.color : "rgba(255,255,255,0.1)" }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    {level === 1 && "Basic definitions and simple recall. Build your foundation."}
                    {level === 2 && "Detailed definitions with some scenario-based clues."}
                    {level === 3 && "Real-life salon scenarios and decision-based questions."}
                    {level === 4 && "Timed, no hints, exam-style language. State board simulation."}
                    {level === 5 && "Mixed categories, weak area focus, fast recall. Mastery mode."}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs text-white/40">
                    <span>{config.wordCount} terms</span>
                    {config.timed && <span>⏱ Timed</span>}
                    {config.hints ? <span>💡 Hints enabled</span> : <span>🚫 No hints</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Weak Areas */}
              {weakCategories.length > 0 && (
                <Card className="bg-rose-500/10 border-rose-500/20 mb-6">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-rose-300 mb-2">Focus Areas for Today</p>
                    <div className="flex flex-wrap gap-2">
                      {weakCategories.map((c) => (
                        <span key={c} className="px-2 py-1 bg-rose-500/20 text-rose-200 rounded-full text-xs">{c}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={startGrid}
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
              >
                <Play className="h-5 w-5 mr-2" /> Start Today's Grid
              </Button>
            </motion.div>
          )}

          {phase === "playing" && crossword && (
            <motion.div key="playing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <CrosswordGame
                grid={crossword}
                level={level}
                onComplete={handleComplete}
              />
            </motion.div>
          )}

          {phase === "results" && sessionResult && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <GridResults
                result={sessionResult}
                onPlayAgain={() => {
                  setPhase("intro");
                  setCrossword(null);
                  setSessionResult(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AppFooter />
    </div>
  );
};

export default CosmoConnectionGridPage;
