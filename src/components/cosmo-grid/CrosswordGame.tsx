import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLevelConfig, type CrosswordGrid, type CrosswordWord, type DisplayCell } from "@/lib/crosswordGenerator";
import { CheckCircle2, Eye, Clock, Send, ChevronRight, ChevronDown } from "lucide-react";
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

const CELL_SIZE = 44;
const LETTER_CELL_BG = "hsl(230 20% 95%)";
const SELECTED_BG = "hsl(45 90% 75%)";
const CORRECT_BG = "hsl(145 40% 85%)";
const INCORRECT_BG = "hsl(0 45% 88%)";
const EMPTY_BG = "transparent";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; arrow: string }> = {
  "Infection Control":    { bg: "hsl(340 65% 45%)", text: "hsl(340 80% 92%)", arrow: "hsl(340 60% 75%)" },
  "Bacteriology":         { bg: "hsl(280 50% 40%)", text: "hsl(280 70% 92%)", arrow: "hsl(280 50% 72%)" },
  "Skin Structure":       { bg: "hsl(25 75% 48%)",  text: "hsl(25 90% 93%)",  arrow: "hsl(25 70% 75%)" },
  "Hair Structure":       { bg: "hsl(195 65% 40%)", text: "hsl(195 80% 92%)", arrow: "hsl(195 60% 72%)" },
  "Nail Technology":      { bg: "hsl(350 55% 50%)", text: "hsl(350 80% 93%)", arrow: "hsl(350 55% 78%)" },
  "Chemistry":            { bg: "hsl(160 55% 35%)", text: "hsl(160 70% 92%)", arrow: "hsl(160 50% 70%)" },
  "Electricity":          { bg: "hsl(45 80% 42%)",  text: "hsl(45 90% 15%)",  arrow: "hsl(45 70% 25%)" },
  "Procedures & Safety":  { bg: "hsl(220 55% 45%)", text: "hsl(220 70% 92%)", arrow: "hsl(220 50% 72%)" },
};
const DEFAULT_CLUE_COLOR = { bg: "hsl(260 40% 42%)", text: "hsl(260 60% 92%)", arrow: "hsl(260 40% 72%)" };

const CrosswordGame = ({ grid, level, onComplete }: Props) => {
  const config = getLevelConfig(level);
  const [userInputs, setUserInputs] = useState<Map<string, string>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [checkedWords, setCheckedWords] = useState<Map<string, boolean>>(new Map());
  const [revealedWord, setRevealedWord] = useState<CrosswordWord | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
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

  const cellKey = (r: number, c: number) => `${r}-${c}`;

  const getWordsAtCell = useCallback(
    (row: number, col: number): CrosswordWord[] => {
      return grid.words.filter((w) => {
        const len = w.word.length;
        if (w.direction === "across") return w.row === row && col >= w.col && col < w.col + len;
        return w.col === col && row >= w.row && row < w.row + len;
      });
    },
    [grid.words]
  );

  const handleLetterCellClick = (row: number, col: number) => {
    const words = getWordsAtCell(row, col);
    if (words.length === 0) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      const newDir = direction === "across" ? "down" : "across";
      setDirection(newDir);
      const w = words.find((w) => w.direction === newDir) || words[0];
      setSelectedWord(w);
    } else {
      setSelectedCell({ row, col });
      const w = words.find((w) => w.direction === direction) || words[0];
      setSelectedWord(w);
      if (w.direction !== direction) setDirection(w.direction);
    }

    const ref = inputRefs.current.get(cellKey(row, col));
    if (ref) setTimeout(() => ref.focus(), 0);
  };

  const handleInput = (row: number, col: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "");
    const key = cellKey(row, col);
    setUserInputs((prev) => {
      const next = new Map(prev);
      next.set(key, char || "");
      return next;
    });

    if (char && selectedWord) {
      const dr = selectedWord.direction === "down" ? 1 : 0;
      const dc = selectedWord.direction === "across" ? 1 : 0;
      const nextR = row + dr;
      const nextC = col + dc;
      if (
        nextR < grid.height &&
        nextC < grid.width &&
        grid.displayCells[nextR]?.[nextC]?.type === "letter"
      ) {
        setSelectedCell({ row: nextR, col: nextC });
        const ref = inputRefs.current.get(cellKey(nextR, nextC));
        if (ref) setTimeout(() => ref.focus(), 0);
      }
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !userInputs.get(cellKey(row, col)) && selectedWord) {
      const dr = selectedWord.direction === "down" ? -1 : 0;
      const dc = selectedWord.direction === "across" ? -1 : 0;
      const prevR = row + dr;
      const prevC = col + dc;
      if (prevR >= 0 && prevC >= 0 && grid.displayCells[prevR]?.[prevC]?.type === "letter") {
        setSelectedCell({ row: prevR, col: prevC });
        setUserInputs((prev) => {
          const next = new Map(prev);
          next.set(cellKey(prevR, prevC), "");
          return next;
        });
        const ref = inputRefs.current.get(cellKey(prevR, prevC));
        if (ref) setTimeout(() => ref.focus(), 0);
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

  const getWordStatus = (word: CrosswordWord): "correct" | "incorrect" | "unchecked" => {
    if (!checkedWords.has(word.id)) return "unchecked";
    return checkedWords.get(word.id) ? "correct" : "incorrect";
  };

  const getCellWordStatus = (row: number, col: number): "correct" | "incorrect" | null => {
    for (const w of grid.words) {
      if (!checkedWords.has(w.id)) continue;
      const len = w.word.length;
      const isIn =
        w.direction === "across"
          ? w.row === row && col >= w.col && col < w.col + len
          : w.col === col && row >= w.row && row < w.row + len;
      if (isIn) return checkedWords.get(w.id) ? "correct" : "incorrect";
    }
    return null;
  };

  const checkWord = (word: CrosswordWord): boolean => {
    let correct = true;
    for (let i = 0; i < word.word.length; i++) {
      const r = word.row + (word.direction === "down" ? i : 0);
      const c = word.col + (word.direction === "across" ? i : 0);
      if ((userInputs.get(cellKey(r, c)) || "") !== word.word[i]) {
        correct = false;
        break;
      }
    }
    setCheckedWords((prev) => new Map(prev).set(word.id, correct));
    return correct;
  };

  const revealWord = (word: CrosswordWord) => {
    setUserInputs((prev) => {
      const next = new Map(prev);
      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === "down" ? i : 0);
        const c = word.col + (word.direction === "across" ? i : 0);
        next.set(cellKey(r, c), word.word[i]);
      }
      return next;
    });
    setCheckedWords((prev) => new Map(prev).set(word.id, false));
  };

  const handleSubmitAll = () => {
    const weakCats = new Set<string>();
    const correctWords: string[] = [];
    grid.words.forEach((w) => {
      const correct = checkWord(w);
      if (!correct) weakCats.add(w.category);
      else correctWords.push(w.word);
    });
    setCompleted(true);

    const wordsCorrect = correctWords.length;
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

  // Find the number for a letter cell (if a word starts there)
  const getNumberForCell = (row: number, col: number): number | null => {
    const w = grid.words.find((w) => w.row === row && w.col === col);
    return w?.number ?? null;
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Cosmo Connection Grid™</h2>
          <p className="text-xs text-white/50">Level {level} — {config.name} • {grid.words.length} terms</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatTime(timeElapsed)}</span>
          <span>{Array.from(checkedWords.values()).filter(Boolean).length}/{grid.words.length}</span>
        </div>
      </div>

      {/* THE GRID */}
      <Card className="border-0 shadow-xl mb-4 overflow-x-auto" style={{ background: "hsl(230 30% 20%)" }}>
        <CardContent className="p-2 md:p-3">
          <div className="inline-block min-w-fit">
            {grid.displayCells.map((row, ri) => (
              <div key={ri} className="flex">
                {row.map((cell, ci) => {
                  if (cell.type === "empty") {
                    return (
                      <div
                        key={ci}
                        style={{ width: CELL_SIZE, height: CELL_SIZE, background: EMPTY_BG }}
                      />
                    );
                  }

                  if (cell.type === "clue") {
                    const colors = CATEGORY_COLORS[cell.category || ""] || DEFAULT_CLUE_COLOR;
                    return (
                      <div
                        key={ci}
                        className="relative border border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-default"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          background: colors.bg,
                          fontSize: "6px",
                          lineHeight: "1.15",
                        }}
                        title={cell.clueText}
                      >
                        <span className="text-center px-0.5 font-semibold leading-tight overflow-hidden" style={{ fontSize: "6.5px", color: colors.text, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                          {cell.clueText}
                        </span>
                        <div className="absolute bottom-0 right-0 flex">
                          {cell.arrows?.includes("right") && (
                            <ChevronRight className="h-2.5 w-2.5" style={{ color: colors.arrow }} />
                          )}
                          {cell.arrows?.includes("down") && (
                            <ChevronDown className="h-2.5 w-2.5" style={{ color: colors.arrow }} />
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Letter cell
                  const number = getNumberForCell(ri, ci);
                  const inSelected = isInSelectedWord(ri, ci);
                  const isActive = selectedCell?.row === ri && selectedCell?.col === ci;
                  const wordStatus = getCellWordStatus(ri, ci);

                  let bg = LETTER_CELL_BG;
                  if (isActive) bg = SELECTED_BG;
                  else if (inSelected) bg = "hsl(45 60% 88%)";
                  else if (wordStatus === "correct") bg = CORRECT_BG;
                  else if (wordStatus === "incorrect") bg = INCORRECT_BG;

                  return (
                    <div
                      key={ci}
                      className="relative border border-slate-400/40 cursor-pointer"
                      style={{ width: CELL_SIZE, height: CELL_SIZE, background: bg }}
                      onClick={() => handleLetterCellClick(ri, ci)}
                    >
                      {number && (
                        <span
                          className="absolute top-0 left-0.5 font-semibold text-slate-500 leading-none select-none"
                          style={{ fontSize: "8px" }}
                        >
                          {number}
                        </span>
                      )}
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(cellKey(ri, ci), el);
                        }}
                        className="w-full h-full text-center font-bold bg-transparent outline-none uppercase text-slate-900"
                        style={{ fontSize: "16px", caretColor: "hsl(45 90% 45%)" }}
                        maxLength={1}
                        value={userInputs.get(cellKey(ri, ci)) || ""}
                        onChange={(e) => handleInput(ri, ci, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(ri, ci, e)}
                        onFocus={() => handleLetterCellClick(ri, ci)}
                        disabled={completed}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected word clue (full text) */}
      {selectedWord && (
        <motion.div
          key={selectedWord.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="bg-white/10 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold text-sm">{selectedWord.number}.</span>
                <div>
                  <span className="text-xs text-amber-300/70 uppercase tracking-wider">
                    {selectedWord.direction} • {selectedWord.category}
                  </span>
                  <p className="text-sm text-white/80 mt-0.5">{selectedWord.clue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      {!completed && (
        <div className="flex gap-2">
          {config.hints && selectedWord && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:text-white flex-1"
                onClick={() => selectedWord && checkWord(selectedWord)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white/70 hover:text-white flex-1"
                onClick={() => selectedWord && revealWord(selectedWord)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Reveal
              </Button>
            </>
          )}
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0"
            onClick={handleSubmitAll}
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Submit All
          </Button>
        </div>
      )}

      {/* Completed: show layer reveal buttons */}
      {completed && (
        <div className="space-y-2 mt-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Tap a word to explore its layers</p>
          <div className="flex flex-wrap gap-2">
            {grid.words.map((w) => {
              const status = getWordStatus(w);
              return (
                <button
                  key={w.id}
                  onClick={() => setRevealedWord(w)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: status === "correct" ? "hsl(145 40% 30%)" : "hsl(0 40% 30%)",
                    color: status === "correct" ? "hsl(145 60% 85%)" : "hsl(0 60% 85%)",
                  }}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {revealedWord && <LayerReveal word={revealedWord} onClose={() => setRevealedWord(null)} />}
    </div>
  );
};

export default CrosswordGame;
