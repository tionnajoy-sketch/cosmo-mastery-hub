import { useState } from "react";
import LmsLayout, { LmsChip } from "@/lms/LmsLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Layers } from "lucide-react";

interface LayerBlock {
  key: string;
  title: string;
  description: string;
}

function buildPlan(title: string, objective: string): LayerBlock[] {
  const t = title || "this concept";
  const o = objective || "demonstrate understanding in a real salon moment";
  return [
    {
      key: "Outcome",
      title: "Outcome",
      description: `By the end of this lesson, the learner can ${o.toLowerCase()}.`,
    },
    {
      key: "Concept",
      title: "Concept",
      description: `Define ${t} in plain English. Connect it to the relevant Layer Method step (Define + Break It Down) so the learner sees both the word and the meaning.`,
    },
    {
      key: "Demonstration",
      title: "Demonstration",
      description: `Walk through ${t} as it shows up in a real salon moment — consultation, mid-service, or recovery. Use a one-client example, not a textbook list.`,
    },
    {
      key: "Practice",
      title: "Practice",
      description: `Give the learner one Apply task on ${t}: Explain it in their own words, decide between two options, predict what happens next, or coach a teammate through it.`,
    },
    {
      key: "Evidence",
      title: "Evidence",
      description: `Capture proof of mastery: a short Assess question, a recorded explain-back, or a salon scenario decision the learner can justify in two sentences.`,
    },
  ];
}

export default function LmsCurriculumBuilderPage() {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [showPlan, setShowPlan] = useState(false);

  const plan = buildPlan(title, objective);

  return (
    <LmsLayout>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-[hsl(var(--lms-muted))] mb-1">Preview</div>
        <h1 className="lms-display text-3xl sm:text-4xl font-semibold mb-2">Curriculum Builder</h1>
        <p className="text-[hsl(var(--lms-ink-soft))] max-w-2xl">
          Sketch a lesson and see the Layer Method plan it would generate. This preview helps you author courses that
          stay aligned to TJ's framework before saving.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lms-card p-6">
          <div className="lms-display text-lg font-semibold mb-4">Lesson Sketch</div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Reading porosity at the bowl"
                className="bg-[hsl(var(--lms-cream))]"
              />
            </div>
            <div>
              <Label htmlFor="lesson-objective">Learning Objective</Label>
              <Textarea
                id="lesson-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={4}
                placeholder="e.g. Diagnose porosity using a strand test in under three minutes."
                className="bg-[hsl(var(--lms-cream))]"
              />
            </div>
            <Button onClick={() => setShowPlan(true)} className="lms-btn-primary h-11 w-full">
              <Eye className="w-4 h-4 mr-2" /> Generate Layer Plan
            </Button>
          </div>
        </div>

        <div className="lms-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="lms-display text-lg font-semibold">Generated Layer Plan</div>
            <LmsChip variant="teal"><Layers className="w-3 h-3 mr-1 inline" /> Preview</LmsChip>
          </div>
          {!showPlan ? (
            <div className="text-sm text-[hsl(var(--lms-muted))]">
              Add a title and objective, then generate to see the five-block Layer Method plan.
            </div>
          ) : (
            <ol className="space-y-3">
              {plan.map((b, i) => (
                <li key={b.key} className="border border-[hsl(var(--lms-border))] rounded-xl p-4 bg-[hsl(var(--lms-cream))]/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-[hsl(var(--lms-teal))] text-[hsl(var(--lms-cream))] text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="lms-display font-semibold">{b.title}</div>
                  </div>
                  <p className="text-sm text-[hsl(var(--lms-ink-soft))]">{b.description}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </LmsLayout>
  );
}
