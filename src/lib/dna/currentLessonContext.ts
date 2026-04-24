/* ─── Current Lesson Context ─── */
/* Tiny pub/sub so the DNA progress bubble can tag every event
 * with the lesson + step that caused it. */

export interface LessonContext {
  module_id?: string | null;
  term_id?: string | null;
  term_title?: string | null;
  step_key?: string | null;
  step_label?: string | null;
}

let current: LessonContext = {};
const listeners = new Set<(ctx: LessonContext) => void>();

export function setLessonContext(ctx: LessonContext) {
  current = { ...current, ...ctx };
  listeners.forEach((l) => l(current));
}

export function clearLessonContext() {
  current = {};
  listeners.forEach((l) => l(current));
}

export function getLessonContext(): LessonContext {
  return { ...current };
}

export function subscribeLessonContext(fn: (ctx: LessonContext) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
