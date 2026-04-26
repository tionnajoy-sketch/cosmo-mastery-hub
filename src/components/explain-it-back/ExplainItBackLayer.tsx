import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, BookOpen, Sparkles, HelpCircle, Lightbulb } from "lucide-react";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import {
  useExplainItBack,
  type ExplainTrigger,
  type FollowUpAction,
} from "@/hooks/useExplainItBack";

interface Props {
  termId?: string | null;
  moduleId?: string | null;
  blockNumber?: number | null;
  trigger: ExplainTrigger;
  contextRef?: string;
  /** Called once the learner submits, follows up, or skips. */
  onComplete?: (result: {
    completed: boolean;
    skipped: boolean;
    flag: "avoids explanation" | null;
    recommendation: "guided_lesson" | null;
    followUp: FollowUpAction | null;
  }) => void;
}

const FOLLOW_UPS: Array<{
  key: FollowUpAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "understand", label: "I understand this", icon: CheckCircle2 },
  { key: "need_explanation", label: "I need another explanation", icon: HelpCircle },
  { key: "want_visual", label: "I want the visual", icon: Eye },
  { key: "want_metaphor", label: "I want the metaphor", icon: Sparkles },
];

const TRIGGER_LABEL: Record<ExplainTrigger, string> = {
  definition: "Right after the definition",
  guided_lesson: "After the guided lesson",
  missed_question: "After a missed question",
};

export default function ExplainItBackLayer({
  termId,
  moduleId,
  blockNumber,
  trigger,
  contextRef,
  onComplete,
}: Props) {
  const { save, skipCount, flag } = useExplainItBack({
    termId,
    moduleId,
    blockNumber,
    trigger,
    contextRef,
  });
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [picked, setPicked] = useState<FollowUpAction | null>(null);
  const [savedFlag, setSavedFlag] = useState<"avoids explanation" | null>(flag);
  const [savedRec, setSavedRec] = useState<"guided_lesson" | null>(null);

  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 6;

  const handleSubmit = async (followUp: FollowUpAction | null = null) => {
    const result = await save({ response: text, followUp, skipped: false });
    setSubmitted(true);
    setPicked(followUp);
    setSavedFlag(result.flag);
    setSavedRec(result.recommendation);
    onComplete?.({
      completed: true,
      skipped: false,
      flag: result.flag,
      recommendation: result.recommendation,
      followUp,
    });
  };

  const handleSkip = async () => {
    const result = await save({ response: "", skipped: true });
    setSkipped(true);
    setSavedFlag(result.flag);
    setSavedRec(result.recommendation);
    onComplete?.({
      completed: false,
      skipped: true,
      flag: result.flag,
      recommendation: result.recommendation,
      followUp: null,
    });
  };

  return (
    <div
      className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 sm:p-5 space-y-3 shadow-sm"
      style={{ borderColor: "hsl(var(--primary) / 0.25)" }}
    >
      <div className="flex items-start gap-2">
        <div
          className="mt-0.5 grid place-items-center w-7 h-7 rounded-full"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-primary">
            Explain-It-Back · {TRIGGER_LABEL[trigger]}
          </p>
          <h3 className="text-base sm:text-lg font-semibold leading-snug mt-0.5">
            Explain this in your own words like you are explaining it to a client.
          </h3>
        </div>
      </div>

      {!submitted && !skipped && (
        <>
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pretend the client is sitting in your chair. Tell them what this means…"
              className="min-h-[90px] resize-none pr-10 text-sm"
            />
            <div className="absolute right-1.5 top-1.5">
              <SpeechToTextButton
                onTranscript={(t) => setText(text ? `${text} ${t}` : t)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {wc}/{minWords} words {wc >= minWords && "✓"}
            </span>
            {skipCount > 0 && (
              <span className="text-amber-600">
                Skipped {skipCount} time{skipCount === 1 ? "" : "s"} for this term
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleSubmit(null)}
              disabled={wc < minWords}
            >
              Save my explanation
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
              Or tell me what you need next:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FOLLOW_UPS.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => handleSubmit(key)}
                  disabled={wc < minWords && key !== "need_explanation"}
                  title={
                    wc < minWords && key !== "need_explanation"
                      ? `Write at least ${minWords} words first`
                      : ""
                  }
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {submitted && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Saved. That mental rep is what makes it stick.
          </div>
          {picked && (
            <p className="text-xs text-muted-foreground mt-1">
              You asked for: <strong>{FOLLOW_UPS.find((f) => f.key === picked)?.label}</strong>.
              We'll surface that next.
            </p>
          )}
        </div>
      )}

      {skipped && (
        <div className="rounded-xl bg-muted/60 border p-3 text-sm">
          <p className="text-muted-foreground">No worries — noted that you skipped this one.</p>
          {savedFlag === "avoids explanation" && (
            <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Try the Guided Lesson layer
              </p>
              <p className="text-[11px] text-amber-700/90 mt-0.5">
                You've skipped explaining this term twice. A guided lesson walks you through
                it step-by-step before asking you to teach it back.
              </p>
            </div>
          )}
        </div>
      )}

      {!skipped && savedRec === "guided_lesson" && (
        <p className="text-[11px] text-amber-700">
          Recommended next: Guided Lesson layer.
        </p>
      )}
    </div>
  );
}
