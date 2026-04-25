/* BehaviorIntakeStrip — compact, premium intake card.
 *
 * Mounts inline at the bottom of each Learning Orb stage, above the
 * TJ Feedback Panel. Captures: mode, confidence, thinking path,
 * explain-it-back, error type (when not complete), second-chance.
 * Micro-decisions are recorded via the hook elsewhere in the orb.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import ModeToggle from "./ModeToggle";
import ConfidenceSlider from "./ConfidenceSlider";
import ThinkingPathChips from "./ThinkingPathChips";
import ExplainItBack from "./ExplainItBack";
import ErrorTypePicker from "./ErrorTypePicker";
import SecondChanceBanner from "./SecondChanceBanner";
import type { UseBehaviorIntakeResult } from "@/hooks/useBehaviorIntake";

interface BehaviorIntakeStripProps {
  intake: UseBehaviorIntakeResult;
  /** Show the Explain-it-Back textarea on layers where putting words to it matters. */
  showExplainBack?: boolean;
  /** Show the Error-Type picker when the engine flagged this attempt as incomplete. */
  showErrorPicker?: boolean;
  attemptCount?: number;
  accentColor?: string;
}

export default function BehaviorIntakeStrip({
  intake,
  showExplainBack = false,
  showErrorPicker = false,
  attemptCount = 1,
  accentColor = "hsl(215 70% 55%)",
}: BehaviorIntakeStripProps) {
  if (!intake.ready || !intake.draft) return null;
  const d = intake.draft;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 rounded-2xl border bg-card/60 p-4 backdrop-blur-sm"
      style={{
        borderColor: `${accentColor}30`,
        boxShadow: `0 8px 24px -16px ${accentColor}40`,
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            <Brain className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Quick Check-In
          </p>
        </div>
        <ModeToggle value={d.mode} onChange={intake.setMode} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ConfidenceSlider value={d.confidenceRating} onChange={intake.setConfidence} />
        <ThinkingPathChips value={d.thinkingPath} onChange={intake.setThinkingPath} />
      </div>

      <AnimatePresence>
        {showExplainBack && (
          <motion.div
            key="explain"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <ExplainItBack value={d.explainBackText} onChange={intake.setExplainBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorPicker && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <ErrorTypePicker value={d.errorType} onChange={intake.markErrorType} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3">
        <SecondChanceBanner
          attemptCount={attemptCount}
          improved={d.secondChanceImproved}
          onMark={(improved) => intake.markSecondChance(true, improved)}
        />
      </div>
    </motion.section>
  );
}
