/* TJFeedbackPanel — premium inline rendering of TJ Engine feedback.
 *
 * Shows the strict 5-part TJ format plus a row of action buttons whose
 * labels map to the engine's recommended_next_action verdict:
 *   - advance / complete_term      → Continue
 *   - stay                         → Practice Again
 *   - strengthen_layer             → Strengthen This Layer
 *   - review                       → Review Concept
 *   - practice                     → Practice Again
 *
 * The student NEVER sees raw AI output here — only structured TJ output.
 */

import { motion } from "framer-motion";
import {
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EngineEvaluation, NextActionType } from "@/lib/tj-engine";
import type { BehaviorSuggestion } from "@/lib/behavior-intake";

export interface TJFeedbackActions {
  onContinue: () => void;
  onPracticeAgain: () => void;
  onStrengthenLayer: () => void;
  onReviewConcept: () => void;
}

interface Props {
  evaluation: EngineEvaluation;
  accentColor: string;
  actions: TJFeedbackActions;
  /** Optional rule-based suggestion from the Learner Behavior Intake Layer. */
  behaviorSuggestion?: BehaviorSuggestion | null;
}

interface Row {
  label: string;
  body: string;
  icon: typeof Sparkles;
  tint: string;
}

const TJFeedbackPanel = ({ evaluation, accentColor, actions, behaviorSuggestion }: Props) => {
  const fb = evaluation.feedback;
  const decision = evaluation.decision;
  const isComplete = decision.completion_state === "complete";

  const rows: Row[] = [
    {
      label: "What you understood",
      body: fb.what_you_understood,
      icon: CheckCircle2,
      tint: "hsl(145 40% 45%)",
    },
    {
      label: "What is incomplete",
      body: fb.what_is_incomplete,
      icon: AlertCircle,
      tint: "hsl(35 80% 45%)",
    },
    {
      label: "What layer is missing",
      body: fb.what_layer_is_missing,
      icon: Sparkles,
      tint: "hsl(280 50% 50%)",
    },
    {
      label: "Why this step matters",
      body: fb.why_this_step_matters,
      icon: BookOpen,
      tint: "hsl(215 60% 45%)",
    },
    {
      label: "What to do next",
      body: fb.what_to_do_next,
      icon: ArrowRight,
      tint: accentColor,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-5 rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(40 35% 99%) 0%, hsl(40 30% 97%) 100%)",
        border: `1.5px solid ${accentColor}`,
        boxShadow: `0 18px 48px -22px ${accentColor}55`,
      }}
    >
      {/* Header strip */}
      <header
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: "white",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
            TJ Feedback
          </p>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90">
          {isComplete ? "Layer Locked" : decision.completion_state.replace(/_/g, " ")}
        </p>
      </header>

      {/* 5-part body */}
      <div className="px-5 py-4 space-y-3.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex gap-3">
              <div
                className="flex-shrink-0 mt-0.5 h-7 w-7 rounded-full flex items-center justify-center"
                style={{
                  background: `${row.tint}18`,
                  color: row.tint,
                  border: `1px solid ${row.tint}40`,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.16em] mb-0.5"
                  style={{ color: row.tint }}
                >
                  {row.label}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: "hsl(0 0% 18%)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {row.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended next action(s) */}
      <footer
        className="px-5 py-4 border-t"
        style={{
          background: "hsl(40 30% 96%)",
          borderColor: "hsl(0 0% 0% / 0.08)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2.5"
          style={{ color: "hsl(0 0% 35%)" }}
        >
          Recommended Next
        </p>
        {behaviorSuggestion && behaviorSuggestion.route !== "continue" && (
          <div
            className="mb-2.5 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
            style={{
              background: `${accentColor}10`,
              border: `1px dashed ${accentColor}55`,
              color: "hsl(0 0% 25%)",
            }}
          >
            <span className="font-semibold" style={{ color: accentColor }}>
              Behavior signal:
            </span>{" "}
            {behaviorSuggestion.reason}{" "}
            <span className="font-medium">→ {behaviorSuggestion.label}</span>
          </div>
        )}
        <ActionButtons
          nextAction={decision.next_action}
          accentColor={accentColor}
          actions={actions}
        />
      </footer>
    </motion.section>
  );
};

const ActionButtons = ({
  nextAction,
  accentColor,
  actions,
}: {
  nextAction: NextActionType;
  accentColor: string;
  actions: TJFeedbackActions;
}) => {
  // Primary action (recommended) gets the accent gradient; the rest stay quiet.
  const isPrimary = (key: NextActionType) => key === nextAction;

  const Btn = ({
    label,
    icon: Icon,
    primary,
    onClick,
  }: {
    label: string;
    icon: typeof ArrowRight;
    primary: boolean;
    onClick: () => void;
  }) => (
    <Button
      size="sm"
      onClick={onClick}
      variant={primary ? "default" : "outline"}
      className="gap-1.5 text-xs h-9"
      style={
        primary
          ? {
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}d0)`,
              color: "white",
              border: "none",
              boxShadow: `0 6px 16px -8px ${accentColor}`,
            }
          : {
              borderColor: "hsl(0 0% 0% / 0.18)",
              color: "hsl(0 0% 25%)",
              background: "white",
            }
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Btn
        label="Review Concept"
        icon={BookOpen}
        primary={isPrimary("review")}
        onClick={actions.onReviewConcept}
      />
      <Btn
        label="Strengthen This Layer"
        icon={Sparkles}
        primary={isPrimary("strengthen_layer")}
        onClick={actions.onStrengthenLayer}
      />
      <Btn
        label="Practice Again"
        icon={RefreshCw}
        primary={isPrimary("stay") || isPrimary("practice")}
        onClick={actions.onPracticeAgain}
      />
      <Btn
        label="Continue"
        icon={ArrowRight}
        primary={isPrimary("advance") || isPrimary("complete_term")}
        onClick={actions.onContinue}
      />
    </div>
  );
};

export default TJFeedbackPanel;
