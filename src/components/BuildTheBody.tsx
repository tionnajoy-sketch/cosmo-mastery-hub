import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, Puzzle } from "lucide-react";
import { BuildExercise } from "@/lib/buildExercises";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  exercise: BuildExercise;
}

const BuildTheBody = ({ exercise }: Props) => {
  const allCorrectItems = useMemo(() => exercise.groups.flatMap((g) => g.items), [exercise]);
  const allPieces = useMemo(() => {
    const pieces = [...allCorrectItems, ...(exercise.distractors || [])];
    return pieces.sort(() => Math.random() - 0.5);
  }, [allCorrectItems, exercise.distractors]);

  const [placements, setPlacements] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(exercise.groups.map((g) => [g.label, []]))
  );
  const [pool, setPool] = useState<string[]>(allPieces);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, Record<string, boolean>>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(exercise.groups[0]?.label || null);

  const handleTapPiece = useCallback(
    (item: string) => {
      if (checked || !activeGroup) return;
      setPool((p) => p.filter((i) => i !== item));
      setPlacements((prev) => ({ ...prev, [activeGroup]: [...prev[activeGroup], item] }));
    },
    [checked, activeGroup]
  );

  const handleRemovePiece = useCallback(
    (groupLabel: string, item: string) => {
      if (checked) return;
      setPlacements((prev) => ({ ...prev, [groupLabel]: prev[groupLabel].filter((i) => i !== item) }));
      setPool((p) => [...p, item]);
    },
    [checked]
  );

  const handleCheck = () => {
    const res: Record<string, Record<string, boolean>> = {};
    exercise.groups.forEach((g) => {
      res[g.label] = {};
      placements[g.label].forEach((item) => {
        res[g.label][item] = g.items.includes(item);
      });
    });
    setResults(res);
    setChecked(true);
  };

  const handleReset = () => {
    setPlacements(Object.fromEntries(exercise.groups.map((g) => [g.label, []])));
    setPool(allPieces.sort(() => Math.random() - 0.5));
    setChecked(false);
    setResults({});
    setActiveGroup(exercise.groups[0]?.label || null);
  };

  const totalPlaced = Object.values(placements).reduce((s, arr) => s + arr.length, 0);
  const score = checked
    ? Object.values(results).reduce((s, group) => s + Object.values(group).filter(Boolean).length, 0)
    : 0;
  const perfect = checked && score === allCorrectItems.length && totalPlaced === allCorrectItems.length;

  return (
    <div className="space-y-4">
      {/* Instruction card */}
      <Card className="border-none shadow-none bg-muted/50">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5 flex-shrink-0">
            <Puzzle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{exercise.prompt}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a group, then tap pieces below to place them. Tap a placed piece to remove it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Group selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {exercise.groups.map((g) => (
          <button
            key={g.label}
            onClick={() => !checked && setActiveGroup(g.label)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
              activeGroup === g.label
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {g.label} ({placements[g.label].length})
          </button>
        ))}
      </div>

      {/* Group drop zones */}
      <div className="grid gap-3" style={{ gridTemplateColumns: exercise.groups.length <= 2 ? `repeat(${exercise.groups.length}, 1fr)` : '1fr' }}>
        {exercise.groups.map((g) => (
          <Card
            key={g.label}
            className={`border-2 border-dashed transition-colors ${
              activeGroup === g.label ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
            }`}
          >
            <CardContent className="p-3">
              <p className={`text-xs font-semibold mb-2 ${
                activeGroup === g.label ? "text-primary" : "text-muted-foreground"
              }`}>
                {g.label}
              </p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                <AnimatePresence>
                  {placements[g.label].map((item) => (
                    <motion.button
                      key={item}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handleRemovePiece(g.label, item)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        checked
                          ? results[g.label]?.[item]
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-red-50 border-red-300 text-red-800"
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                      }`}
                    >
                      {item}
                      {checked && (
                        <span className="ml-1">{results[g.label]?.[item] ? "✓" : "✗"}</span>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
                {placements[g.label].length === 0 && (
                  <p className="text-xs italic text-muted-foreground">
                    {activeGroup === g.label ? "Tap pieces below" : "Select this group first"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available pieces pool */}
      {pool.length > 0 && !checked && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Available Pieces:</p>
          <div className="flex flex-wrap gap-2">
            {pool.map((item) => (
              <motion.button
                key={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTapPiece(item)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-background text-foreground hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Check / Results */}
      <div className="flex items-center gap-2 pt-1">
        {!checked && totalPlaced > 0 && (
          <button
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Check className="h-3.5 w-3.5" /> Check My Build
          </button>
        )}
        {checked && (
          <>
            <div className="flex-1">
              {perfect ? (
                <p className="text-sm font-semibold text-green-700">
                  🎉 Perfect build!
                </p>
              ) : (
                <p className="text-sm text-foreground">
                  You got <strong>{score}</strong> of <strong>{allCorrectItems.length}</strong> correct.
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Rebuild
            </button>
          </>
        )}
      </div>

      {/* Correct answer reveal */}
      {checked && !perfect && (
        <Card className="border-none shadow-none bg-muted/50">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-foreground mb-2">Correct Structure:</p>
            {exercise.groups.map((g) => (
              <div key={g.label} className="mb-2 last:mb-0">
                <p className="text-xs font-semibold text-muted-foreground">{g.label}</p>
                {g.items.map((item) => (
                  <p key={item} className="text-xs ml-3 text-foreground">• {item}</p>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildTheBody;
