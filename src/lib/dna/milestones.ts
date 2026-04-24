/* ─── Milestone definitions + evaluator ─── */

export interface MilestoneDef {
  key: string;
  title: string;
  description: string;
  icon: "spark" | "trophy" | "trend" | "shield" | "crown" | "flame";
  color: string;
}

export const MILESTONES: MilestoneDef[] = [
  { key: "first_change", title: "First Spark", description: "Your DNA registered its very first update.", icon: "spark", color: "hsl(45 90% 55%)" },
  { key: "code_evolved", title: "Code Evolved", description: "A character of your DNA code changed for the first time.", icon: "crown", color: "hsl(265 70% 60%)" },
  { key: "confidence_climber", title: "Confidence Climber", description: "Your confidence rose by +20 cumulative points.", icon: "trend", color: "hsl(145 60% 50%)" },
  { key: "engagement_engine", title: "Engagement Engine", description: "Your engagement reached a strong, steady level.", icon: "flame", color: "hsl(15 80% 55%)" },
  { key: "retention_master", title: "Retention Master", description: "Your retention layer reached its strongest tier.", icon: "shield", color: "hsl(215 70% 55%)" },
  { key: "lesson_streak_5", title: "5 Lesson Streak", description: "You completed 5 lessons that moved your DNA.", icon: "trophy", color: "hsl(35 85% 55%)" },
  { key: "lesson_streak_10", title: "10 Lesson Streak", description: "You completed 10 lessons that moved your DNA.", icon: "trophy", color: "hsl(285 65% 60%)" },
  { key: "recovery_hero", title: "Recovery Hero", description: "You bounced back after a dip — resilience matters.", icon: "shield", color: "hsl(180 60% 50%)" },
];

export interface ProgressEvent {
  field: string;
  delta: number | null;
  from_value: string;
  to_value: string;
  lesson_context: { term_id?: string | null } | null;
  created_at: string;
}

/** Returns milestone keys that should be unlocked given full event history. */
export function evaluateMilestones(events: ProgressEvent[], unlocked: Set<string>): string[] {
  const newlyUnlocked: string[] = [];
  const has = (k: string) => unlocked.has(k) || newlyUnlocked.includes(k);

  if (events.length > 0 && !has("first_change")) newlyUnlocked.push("first_change");

  if (events.some((e) => e.field === "code") && !has("code_evolved")) {
    newlyUnlocked.push("code_evolved");
  }

  const confidenceGain = events
    .filter((e) => e.field === "confidence" && (e.delta ?? 0) > 0)
    .reduce((sum, e) => sum + (e.delta ?? 0), 0);
  if (confidenceGain >= 20 && !has("confidence_climber")) newlyUnlocked.push("confidence_climber");

  const lastEngagement = [...events].reverse().find((e) => e.field === "engagement");
  if (lastEngagement && parseInt(lastEngagement.to_value || "0", 10) >= 75 && !has("engagement_engine")) {
    newlyUnlocked.push("engagement_engine");
  }

  const lastRetention = [...events].reverse().find((e) => e.field === "retention");
  if (lastRetention && lastRetention.to_value?.toUpperCase() >= "S" && !has("retention_master")) {
    newlyUnlocked.push("retention_master");
  }

  const lessonIds = new Set(
    events.map((e) => e.lesson_context?.term_id).filter((x): x is string => Boolean(x))
  );
  if (lessonIds.size >= 5 && !has("lesson_streak_5")) newlyUnlocked.push("lesson_streak_5");
  if (lessonIds.size >= 10 && !has("lesson_streak_10")) newlyUnlocked.push("lesson_streak_10");

  // Recovery: any negative delta followed later by positive delta on same field
  const fields = ["confidence", "engagement", "retention"];
  for (const f of fields) {
    const series = events.filter((e) => e.field === f && e.delta !== null);
    let dipped = false;
    for (const e of series) {
      if ((e.delta ?? 0) < 0) dipped = true;
      else if (dipped && (e.delta ?? 0) > 0) {
        if (!has("recovery_hero")) newlyUnlocked.push("recovery_hero");
        break;
      }
    }
  }

  return newlyUnlocked;
}
