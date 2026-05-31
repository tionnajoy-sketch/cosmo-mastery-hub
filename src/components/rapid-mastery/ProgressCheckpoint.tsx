import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, ArrowRight } from "lucide-react";
import MultipleChoiceRunner from "./MultipleChoiceRunner";

interface CheckpointTerm {
  id: string;
  term: string;
  definition: string;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  quiz_answer?: string | null;
  section_id?: string | null;
  block_number?: number | null;
}

/**
 * Mini-check shown at the end of any lesson — 3 MCQs + a confidence slider.
 */
export default function ProgressCheckpoint({ terms, onComplete }: { terms: CheckpointTerm[]; onComplete?: () => void }) {
  const [phase, setPhase] = useState<"questions" | "confidence" | "done">("questions");
  const [confidence, setConfidence] = useState([7]);

  return (
    <Card className="p-6 bg-card border-2 border-primary/20">
      <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-[0.2em] font-semibold text-primary">
        <CheckCircle2 className="h-4 w-4" /> Progress Checkpoint
      </div>

      {phase === "questions" && (
        <>
          <MultipleChoiceRunner terms={terms} limit={3} />
          <div className="mt-4 text-right">
            <Button variant="ghost" size="sm" onClick={() => setPhase("confidence")}>
              Skip to confidence <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}

      {phase === "confidence" && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-bold mb-1">How confident are you?</h3>
            <p className="text-sm text-muted-foreground">
              Slide to where you actually are — not where you want to be.
            </p>
          </div>
          <div className="px-2">
            <Slider value={confidence} onValueChange={setConfidence} min={1} max={10} step={1} />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
              <span>Shaky</span>
              <span className="font-bold text-foreground">{confidence[0]}/10</span>
              <span>Locked in</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => { setPhase("done"); onComplete?.(); }}>
            Save checkpoint
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-6">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary" />
          <h3 className="font-display text-xl font-bold mb-1">Checkpoint logged</h3>
          <p className="text-sm text-muted-foreground">Your Readiness Meter just updated.</p>
        </div>
      )}
    </Card>
  );
}
