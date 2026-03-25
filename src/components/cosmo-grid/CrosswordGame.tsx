import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLevelConfig, type CrosswordGrid, type CrosswordWord } from "@/lib/crosswordGenerator";
import { CheckCircle2, Eye, Clock, Lightbulb, Send } from "lucide-react";
import LayerReveal from "./LayerReveal";

interface Props {
  grid: CrosswordGrid;
  level: number;
  onComplete: (result: {
    level: number;
    score: number;
    totalWords: number;
    wordsCorrect: number;
    timeTaken: number;
    weakCategories: string[];
    completedWords: string[];
  }) => void;
}

const CrosswordGame = ({ grid, level, onComplete }: Props) => {
  const config = getLevelConfig(level);
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    grid.cells.map((row) => row.map((cell) => (cell !== null ? "" : "")))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [checkedWords, setCheckedWords] = useState<Map<string, boolean>>(new Map());
  const [revealedWord, setRevealedWord] = useState<CrosswordWord | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const startTime = useRef(Date.now());

  // Timer
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [completed]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getWordsAtCell = useCallback((row: number, col: number): CrosswordWord[] => {
    return grid.words.filter((w) => {
      const len = w.word.length;
      if (w.direction === "across") {
        return w.row === row && col >= w.col && col < w.col + len;
      } else {
        return w.col === col && row >= w.row && row < w.row + len;
      }
    });
  }, [grid.words]);

  const handleCellClick = (row: number, col: number) => {
    if (grid.cells[row][col] === null) return;
    const words = getWordsAtCell(row, col);
    if (words.length === 0) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction
      const newDir = direction === "across" ? "down" : "across";
      setDirection(newDir);
      const wordInDir = words.find((w) => w.direction === newDir) || words[0];
      setSelectedWord(wordInDir);
    } else {
      setSelectedCell({ row, col });
      const wordInDir = words.find((w) => w.direction === direction) || words[0];
      setSelectedWord(wordInDir);
      if (wordInDir.direction !== direction) setDirection(wordInDir.direction);
    }
  };

  const handleInput = (row: number, col: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "");
    if (!char && value !== "") return;

    setUserGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = char || "";
      return next;
    });

    // Move to next cell in current word direction
    if (char && selectedWord) {
      const dr = selectedWord.direction === "down" ? 1 : 0;
      const dc = selectedWord.direction === "across" ? 1 : 0;
      const nextR = row + dr;
      const nextC = col + dc;
      if (nextR < grid.height && nextC < grid.width && grid.cells[nextR][nextC] !== null) {
        setSelectedCell({ row: nextR, col: nextC });
        const input = inputRefs.current[nextR]?.[nextC];
        if (input) setTimeout(() => input.focus(), 0);
      }
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !userGrid[row][col] && selectedWord) {
      const dr = selectedWord.direction === "down" ? -1 : 0;
      const dc = selectedWord.direction === "across" ? -1 : 0;
      const prevR = row + dr;
      const prevC = col + dc;
      if (prevR >= 0 && prevC >= 0 && grid.cells[prevR]?.[prevC] !== null) {
        setSelectedCell({ row: prevR, col: prevC });
        setUserGrid((prev) => {
          const next = prev.map((r) => [...r]);
          next[prevR][prevC] = "";
          return next;
        });
        const input = inputRefs.current[prevR]?.[prevC];
        if (input) setTimeout(() => input.focus(), 0);
      }
    }
  };

  const isInSelectedWord = (row: number, col: number): boolean => {
    if (!selectedWord) return false;
    const len = selectedWord.word.length;
    if (selectedWord.direction === "across") {
      return selectedWord.row === row && col >= selectedWord.col && col < selectedWord.col + len;
    }
    return selectedWord.col === col && row >= selectedWord.row && row < selectedWord.row + len;
  };

  const checkWord = (word: CrosswordWord) => {
    let correct = true;
    for (let i = 0; i < word.word.length; i++) {
      const r = word.row + (word.direction === "down" ? i : 0);
      const c = word.col + (word.direction === "across" ? i : 0);
      if (userGrid[r][c] !== word.word[i]) {
        correct = false;
        break;
      }
    }
    setCheckedWords((prev) => new Map(prev).set(word.id, correct));
    return correct;
  };

  const revealWord = (word: CrosswordWord) => {
    setUserGrid((prev) => {
      const next = prev.map((r) => [...r]);
      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === "down" ? i : 0);
        const c = word.col + (word.direction === "across" ? i : 0);
        next[r][c] = word.word[i];
      }
      return next;
    });
    setCheckedWords((prev) => new Map(prev).set(word.id, false)); // revealed = not earned
  };

  const handleSubmitAll = () => {
    const results = new Map<string, boolean>();
    const weakCats = new Set<string>();
    const correctWords: string[] = [];

    grid.words.forEach((w) => {
      const correct = checkWord(w);
      results.set(w.id, correct);
      if (!correct) weakCats.add(w.category);
      else correctWords.push(w.word);
    });

    setCheckedWords(results);
    setCompleted(true);

    const wordsCorrect = Array.from(results.values()).filter(Boolean).length;
    onComplete({
      level,
      score: wordsCorrect * 10 + (wordsCorrect === grid.words.length ? 25 : 0),
      totalWords: grid.words.length,
      wordsCorrect,
      timeTaken: Math.floor((Date.now() - startTime.current) / 1000),
      weakCategories: Array.from(weakCats),
      completedWords: correctWords,
    });
  };

  const getWordStatus = (word: CrosswordWord): "correct" | "incorrect" | "unchecked" => {
    if (!checkedWords.has(word.id)) return "unchecked";
    return checkedWords.get(word.id) ? "correct" : "incorrect";
  };

  const getCellStatus = (row: number, col: number): string | null => {
    for (const w of grid.words) {
      if (!checkedWords.has(w.id)) continue;
      const len = w.word.length;
      const isIn = w.direction === "across"
        ? w.row === row && col >= w.col && col < w.col + len
        : w.col === col && row >= w.row && row < w.row + len;
      if (isIn) return checkedWords.get(w.id) ? "correct" : "incorrect";
    }
    return null;
  };

  const getNumberForCell = (row: number, col: number): number | null => {
    const word = grid.words.find((w) => w.row === row && w.col === col);
    return word?.number || null;
  };

  const acrossWords = grid.words.filter((w) => w.direction === "across").sort((a, b) => a.number - b.number);
  const downWords = grid.words.filter((w) => w.direction === "down").sort((a, b) => a.number - b.number);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Cosmo Connection Grid™</h2>
          <p className="text-sm text-white/50">Level {level} — {config.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/60 text-sm">
            <Clock className="h-4 w-4" />
            {formatTime(timeElapsed)}
          </div>
          <div className="text-sm text-white/60">
            {Array.from(checkedWords.values()).filter(Boolean).length}/{grid.words.length}
          </div>
        </div>
      </div>

      {/* Grid */}
      <Card className="bg-white/5 border-white/10 mb-4 overflow-x-auto">
        <CardContent className="p-3">
          <div className="inline-block min-w-fit">
            {grid.cells.map((row, ri) => (
              <div key={ri} className="flex">
                {row.map((cell, ci) => {
                  if (cell === null) {
                    return <div key={ci} className="w-8 h-8 md:w-10 md:h-10" />;
                  }
                  const number = getNumberForCell(ri, ci);
                  const inSelected = isInSelectedWord(ri, ci);
                  const isActive = selectedCell?.row === ri && selectedCell?.col === ci;
                  const status = getCellStatus(ri, ci);

                  return (
                    <div
                      key={ci}
                      className="w-8 h-8 md:w-10 md:h-10 border border-white/20 relative cursor-pointer"
                      style={{
                        background: isActive
                          ? "hsl(45 90% 55%)"
                          : inSelected
                          ? "hsl(45 80% 75% / 0.2)"
                          : status === "correct"
                          ? "hsl(145 50% 30% / 0.5)"
                          : status === "incorrect"
                          ? "hsl(0 50% 30% / 0.5)"
                          : "hsl(230 30% 15%)",
                      }}
                      onClick={() => handleCellClick(ri, ci)}
                    >
                      {number && (
                        <span className="absolute top-0 left-0.5 text-[8px] md:text-[10px] text-white/60 font-medium leading-none">
                          {number}
                        </span>
                      )}
                      <input
                        ref={(el) => {
                          if (!inputRefs.current[ri]) inputRefs.current[ri] = [];
                          inputRefs.current[ri][ci] = el;
                        }}
                        className="w-full h-full text-center text-sm md:text-base font-bold bg-transparent text-white outline-none uppercase"
                        maxLength={1}
                        value={userGrid[ri]?.[ci] || ""}
                        onChange={(e) => handleInput(ri, ci, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(ri, ci, e)}
                        onFocus={() => handleCellClick(ri, ci)}
                        disabled={completed}
                        style={{ caretColor: "hsl(45 90% 55%)" }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clues */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3 uppercase tracking-wider">Across</h3>
            <div className="space-y-2">
              {acrossWords.map((w) => {
                const status = getWordStatus(w);
                return (
                  <div
                    key={w.id}
                    className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                      selectedWord?.id === w.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      setSelectedWord(w);
                      setDirection("across");
                      setSelectedCell({ row: w.row, col: w.col });
                      inputRefs.current[w.row]?.[w.col]?.focus();
                    }}
                  >
                    <span className="font-bold text-white/70 mr-2">{w.number}.</span>
                    <span className={status === "correct" ? "text-emerald-300 line-through" : status === "incorrect" ? "text-rose-300" : "text-white/80"}>
                      {w.clue.slice(0, 100)}{w.clue.length > 100 ? "…" : ""}
                    </span>
                    {status === "correct" && <CheckCircle2 className="inline h-3 w-3 text-emerald-400 ml-1" />}
                    {status === "correct" && !completed && (
                      <button onClick={(e) => { e.stopPropagation(); setRevealedWord(w); }} className="ml-2 text-xs text-amber-400 hover:text-amber-300">
                        View Layers
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-amber-300 mb-3 uppercase tracking-wider">Down</h3>
            <div className="space-y-2">
              {downWords.map((w) => {
                const status = getWordStatus(w);
                return (
                  <div
                    key={w.id}
                    className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                      selectedWord?.id === w.id ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                    onClick={() => {
                      setSelectedWord(w);
                      setDirection("down");
                      setSelectedCell({ row: w.row, col: w.col });
                      inputRefs.current[w.row]?.[w.col]?.focus();
                    }}
                  >
                    <span className="font-bold text-white/70 mr-2">{w.number}.</span>
                    <span className={status === "correct" ? "text-emerald-300 line-through" : status === "incorrect" ? "text-rose-300" : "text-white/80"}>
                      {w.clue.slice(0, 100)}{w.clue.length > 100 ? "…" : ""}
                    </span>
                    {status === "correct" && <CheckCircle2 className="inline h-3 w-3 text-emerald-400 ml-1" />}
                    {status === "correct" && !completed && (
                      <button onClick={(e) => { e.stopPropagation(); setRevealedWord(w); }} className="ml-2 text-xs text-amber-400 hover:text-amber-300">
                        View Layers
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {!completed && (
        <div className="flex gap-3">
          {config.hints && selectedWord && (
            <>
              <Button
                variant="outline"
                className="border-white/20 text-white/70 hover:text-white flex-1"
                onClick={() => selectedWord && checkWord(selectedWord)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Check Word
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white/70 hover:text-white flex-1"
                onClick={() => selectedWord && revealWord(selectedWord)}
              >
                <Eye className="h-4 w-4 mr-1" /> Reveal
              </Button>
            </>
          )}
          <Button
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
            onClick={handleSubmitAll}
          >
            <Send className="h-4 w-4 mr-1" /> Submit All
          </Button>
        </div>
      )}

      {/* Layer Reveal Dialog */}
      {revealedWord && (
        <LayerReveal word={revealedWord} onClose={() => setRevealedWord(null)} />
      )}
    </div>
  );
};

export default CrosswordGame;
