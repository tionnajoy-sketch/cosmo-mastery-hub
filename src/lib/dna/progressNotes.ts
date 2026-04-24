/* ─── Friendly auto-notes for DNA changes ─── */
import type { LessonContext } from "./currentLessonContext";

export type DNAField = "code" | "engagement" | "retention" | "confidence" | "layer";

interface Args {
  field: DNAField;
  delta: number;
  from: string;
  to: string;
  lesson: LessonContext;
}

const lessonPhrase = (lesson: LessonContext): string => {
  if (!lesson?.term_title && !lesson?.step_label) return "";
  if (lesson.term_title && lesson.step_label) {
    return ` after the ${lesson.step_label} step on ${lesson.term_title}`;
  }
  if (lesson.term_title) return ` while studying ${lesson.term_title}`;
  if (lesson.step_label) return ` during the ${lesson.step_label} step`;
  return "";
};

export function buildProgressNote({ field, delta, from, to, lesson }: Args): string {
  const where = lessonPhrase(lesson);

  if (field === "code") {
    return `Your DNA code evolved from ${from} → ${to}${where ? where : ""}. Your learning blueprint just leveled up.`;
  }
  if (field === "layer") {
    return `Your dominant layer shifted from ${from} → ${to}${where}. TJ will lead with this layer in your next lesson.`;
  }

  const metricName =
    field === "engagement" ? "Engagement" :
    field === "retention" ? "Retention" :
    "Confidence";

  if (delta > 0) {
    if (delta >= 10) {
      return `${metricName} surged ${delta > 0 ? "+" : ""}${delta}${where}. Big leap — keep the momentum.`;
    }
    return `${metricName} climbed ${delta > 0 ? "+" : ""}${delta}${where}. Steady progress is real progress.`;
  }
  if (delta < 0) {
    if (delta <= -10) {
      return `${metricName} dipped ${delta}${where}. That's okay — review the section you struggled with and try again.`;
    }
    return `${metricName} eased ${delta}${where}. Small dips happen — your brain is still consolidating.`;
  }
  return `${metricName} held steady at ${to}${where}.`;
}
