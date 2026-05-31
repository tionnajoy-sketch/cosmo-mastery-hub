import { useMemo } from "react";
import MultipleChoiceRunner from "./MultipleChoiceRunner";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface Term {
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
 * State board format: mixed-section 25-question bank. Reuses MCQ runner with
 * stricter rules (no immediate "got it" feedback would be ideal, but the
 * Runner already shows correctness — kept for confidence calibration).
 */
export default function StateBoardPrep({ terms }: { terms: Term[] }) {
  const mixed = useMemo(() => [...terms].sort(() => Math.random() - 0.5), [terms]);

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-card border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">State Board Prep</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              25 questions, mixed sections, 4-option state-board format. You'll see your score at the end.
            </p>
          </div>
        </div>
      </Card>
      <MultipleChoiceRunner terms={mixed} limit={25} />
    </div>
  );
}
