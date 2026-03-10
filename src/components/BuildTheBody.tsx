import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { BuildExercise } from "@/lib/buildExercises";
import { pageColors } from "@/lib/colors";
import BodyDiagram from "@/components/BodyDiagram";

const c = pageColors.study;

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
    ? Object.values(results).reduce(
        (s, group) => s + Object.values(group).filter(Boolean).length,
        0
      )
    : 0;

  const perfect = checked && score === allCorrectItems.length && totalPlaced === allCorrectItems.length;

  return (
    <div className="space-y-4">
      {/* Header with skeleton + prompt */}
      <div className="flex items-start gap-4">
        <BodyDiagram highlightRegion={exercise.bodyRegion} completed={perfect} />
        <div className="flex-1 pt-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: c.accent }} />
            <p className="text-sm font-semibold" style={{ color: c.termHeading }}>{exercise.prompt}</p>
          </div>
          <p className="text-xs" style={{ color: c.subtext }}>
            Tap each piece into the correct group to build this structure.
          </p>
        </div>
      </div>

      {/* Group selector tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {exercise.groups.map((g) => (
          <button
            key={g.label}
            onClick={() => !checked && setActiveGroup(g.label)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background: activeGroup === g.label ? c.tabActive : c.tabInactive,
              color: activeGroup === g.label ? c.tabActiveText : c.tabInactiveText,
            }}
          >
            {g.label} ({placements[g.label].length})
          </button>
        ))}
      </div>

      {/* Active group drop zone */}
      {activeGroup && (
        <div
          className="min-h-[48px] rounded-lg p-3 border-2 border-dashed transition-colors"
          style={{
            borderColor: c.tabActive,
            background: "hsl(42 30% 97%)",
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: c.subtext }}>
            {activeGroup}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {placements[activeGroup].map((item) => (
                <motion.button
                  key={item}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => handleRemovePiece(activeGroup, item)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                  style={{
                    background: checked
                      ? results[activeGroup]?.[item]
                        ? "hsl(145 40% 92%)"
                        : "hsl(0 50% 95%)"
                      : c.tabInactive,
                    borderColor: checked
                      ? results[activeGroup]?.[item]
                        ? "hsl(145 40% 70%)"
                        : "hsl(0 50% 60%)"
                      : "transparent",
                    color: c.bodyText,
                  }}
                >
                  {item}
                  {checked && (
                    <span className="ml-1">{results[activeGroup]?.[item] ? "✓" : "✗"}</span>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
            {placements[activeGroup].length === 0 && (
              <p className="text-xs italic" style={{ color: c.subtext }}>
                Tap pieces below to place them here
              </p>
            )}
          </div>
        </div>
      )}

      {/* Available pieces pool */}
      {pool.length > 0 && !checked && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: c.subtext }}>
            Available Pieces:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pool.map((item) => (
              <motion.button
                key={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTapPiece(item)}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all"
                style={{
                  background: "hsl(0 0% 100%)",
                  borderColor: c.tabActive,
                  color: c.bodyText,
                }}
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Check / Results */}
      <div className="flex gap-2 pt-1">
        {!checked && totalPlaced > 0 && (
          <button
            onClick={handleCheck}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: c.buttonPrimary, color: "white" }}
          >
            <Check className="h-3.5 w-3.5" /> Check My Build
          </button>
        )}
        {checked && (
          <>
            <div className="flex-1">
              {perfect ? (
                <p className="text-sm font-semibold" style={{ color: "hsl(145 60% 35%)" }}>
                  🎉 Perfect build! Your brain just created this structure.
                </p>
              ) : (
                <p className="text-sm" style={{ color: c.bodyText }}>
                  You got <strong>{score}</strong> of <strong>{allCorrectItems.length}</strong> correct.
                  {(exercise.distractors?.length ?? 0) > 0 &&
                    totalPlaced > allCorrectItems.length &&
                    " Some pieces don't belong — watch for distractors!"}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: c.tabInactive, color: c.tabInactiveText }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Rebuild
            </button>
          </>
        )}
      </div>

      {/* Show correct answer after check */}
      {checked && !perfect && (
        <div className="mt-2 p-3 rounded-lg" style={{ background: "hsl(42 40% 96%)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: c.termHeading }}>Correct Structure:</p>
          {exercise.groups.map((g) => (
            <div key={g.label} className="mb-2">
              <p className="text-xs font-semibold" style={{ color: c.subtext }}>{g.label}</p>
              {g.items.map((item) => (
                <p key={item} className="text-xs ml-3" style={{ color: c.bodyText }}>• {item}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuildTheBody;
