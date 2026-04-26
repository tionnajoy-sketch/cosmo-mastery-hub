// Behavior Summary — rule-based aggregator that reads existing learner-signal
// tables and returns a fixed set of pre-written messages. No AI calls.

import { supabase } from "@/integrations/supabase/client";

export type SummaryKey =
  | "thinking_path"
  | "skipped_layer"
  | "error_type"
  | "confidence_trend"
  | "preferred_mode"
  | "cognitive_load"
  | "breakdown_pattern"
  | "recovery_pattern"
  | "next_layer";

export interface SummaryItem {
  key: SummaryKey;
  title: string;
  message: string;
  /** Optional accent token (HSL string) used by the UI. */
  accent?: string;
  /** True when there's not enough data yet — UI greys it out. */
  empty?: boolean;
}

/** ---------- helpers ---------- */

function topCount<T extends string>(rows: { value: T }[]): { value: T; count: number } | null {
  if (!rows.length) return null;
  const tally = new Map<T, number>();
  for (const r of rows) tally.set(r.value, (tally.get(r.value) ?? 0) + 1);
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of tally) {
    if (!best || count > best.count) best = { value, count };
  }
  return best;
}

const LOOKBACK_DAYS = 14;
const recentISO = () => new Date(Date.now() - LOOKBACK_DAYS * 86400_000).toISOString();

/** ---------- per-summary loaders ---------- */

const THINKING_PATH_LABEL: Record<string, string> = {
  visual: "visuals",
  metaphor: "metaphors",
  guided_lesson: "guided lessons",
  breakdown: "breakdowns",
  reflection: "reflection",
  question_first: "questions first",
};

const THINKING_PATH_LAYER_NOTE: Record<string, string> = {
  visual: "Visual learning may be your strongest entry point today.",
  metaphor: "Story and metaphor seem to unlock concepts for you.",
  guided_lesson: "Step-by-step instruction is anchoring your understanding.",
  breakdown: "Breaking words down helps you make sense of new terms.",
  reflection: "Thinking it through in your own words is your edge.",
  question_first: "You learn best by jumping in and testing what you know.",
};

async function buildThinkingPathSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("term_entry_choices")
    .select("preferred_thinking_path")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .limit(500);
  const top = topCount<string>((data ?? []).map((r: any) => ({ value: r.preferred_thinking_path })));
  if (!top || top.count < 2) {
    return {
      key: "thinking_path",
      title: "Most chosen thinking path",
      message: "Try a few terms to learn how you like to start.",
      empty: true,
    };
  }
  const label = THINKING_PATH_LABEL[top.value] ?? top.value.replace(/_/g, " ");
  const note = THINKING_PATH_LAYER_NOTE[top.value] ?? "";
  return {
    key: "thinking_path",
    title: "Most chosen thinking path",
    message: `You are choosing ${label} often. ${note}`.trim(),
    accent: "hsl(265 55% 55%)",
  };
}

const SKIPPED_LAYER_NOTE: Record<string, string> = {
  reflection: "Reflection may help move this from memory to understanding.",
  metaphor: "A metaphor can give your brain something familiar to hold onto.",
  visual: "A picture often makes hard ideas click faster.",
  breakdown: "Breaking the word apart makes it less intimidating.",
  definition: "Returning to the definition first builds a stronger base.",
  recall_reconstruction: "Rebuilding from memory is what makes it stick.",
  recognize: "Spotting it in context proves you really know it.",
  information: "The deeper info is where pieces start connecting.",
  application: "Using it in a scenario locks the meaning in.",
  quiz: "A quick check shows what's already strong.",
  explain_it_back: "Saying it in your own words is the fastest way to find gaps.",
};

const SKIPPED_LAYER_LABEL: Record<string, string> = {
  reflection: "reflection",
  metaphor: "the metaphor layer",
  visual: "the visual layer",
  breakdown: "the breakdown layer",
  definition: "the definition",
  recall_reconstruction: "recall practice",
  recognize: "recognize practice",
  information: "the deeper information",
  application: "the application step",
  quiz: "the quiz",
  explain_it_back: "the explain-it-back step",
};

async function buildSkippedLayerSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("micro_decision_events")
    .select("surface, action")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .in("action", ["skipped", "skip", "skipped_section", "skipped_reflection", "skipped_memory_anchor"])
    .limit(500);
  const tally = new Map<string, number>();
  for (const r of (data ?? []) as any[]) {
    const surface = (r.surface || "").toString();
    if (!surface) continue;
    tally.set(surface, (tally.get(surface) ?? 0) + 1);
  }
  let best: { surface: string; count: number } | null = null;
  for (const [surface, count] of tally) {
    if (!best || count > best.count) best = { surface, count };
  }
  if (!best || best.count < 2) {
    return {
      key: "skipped_layer",
      title: "Most skipped layer",
      message: "You're moving through layers steadily — nothing is being skipped.",
      empty: true,
    };
  }
  const label = SKIPPED_LAYER_LABEL[best.surface] ?? best.surface.replace(/_/g, " ");
  const note = SKIPPED_LAYER_NOTE[best.surface] ?? "Returning to it might help things click.";
  return {
    key: "skipped_layer",
    title: "Most skipped layer",
    message: `You are skipping ${label}. ${note}`,
    accent: "hsl(35 80% 50%)",
  };
}

const ERROR_TYPE_NOTE: Record<string, string> = {
  misread_question: "Slowing down to re-read the question may save points right away.",
  confused_two_terms: "A side-by-side comparison can clear this up fast.",
  did_not_understand: "Going back through a layer or two will rebuild the base.",
  overthought: "Trust your first read — your gut is closer than you think.",
  rushed: "A few extra seconds before answering will protect your score.",
  guessed: "Anchoring the term to a memory cue will make recall easier.",
  not_sure: "Naming what's happening is the first step — we'll meet you there.",
};

const ERROR_TYPE_LABEL: Record<string, string> = {
  misread_question: "misreading the question",
  confused_two_terms: "confusing two similar terms",
  did_not_understand: "the concept not being clear yet",
  overthought: "overthinking the answer",
  rushed: "rushing through",
  guessed: "guessing",
  not_sure: "uncertainty about what happened",
};

async function buildErrorTypeSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("error_type_picks")
    .select("error_type")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .limit(500);
  const top = topCount<string>((data ?? []).map((r: any) => ({ value: r.error_type })));
  if (!top || top.count < 2) {
    return {
      key: "error_type",
      title: "Most common error type",
      message: "No clear error pattern yet — keep going.",
      empty: true,
    };
  }
  const label = ERROR_TYPE_LABEL[top.value] ?? top.value.replace(/_/g, " ");
  const note = ERROR_TYPE_NOTE[top.value] ?? "";
  return {
    key: "error_type",
    title: "Most common error type",
    message: `Your most common stumble is ${label}. ${note}`.trim(),
    accent: "hsl(0 60% 55%)",
  };
}

async function buildConfidenceTrendSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("confidence_ratings")
    .select("confidence_rating, is_correct, created_at")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .order("created_at", { ascending: false })
    .limit(40);
  const rows = (data ?? []) as { confidence_rating: number; is_correct: boolean }[];
  if (rows.length < 4) {
    return {
      key: "confidence_trend",
      title: "Confidence trend",
      message: "Rate your confidence on a few more questions to see your trend.",
      empty: true,
    };
  }
  const correct = rows.filter((r) => r.is_correct);
  const wrong = rows.filter((r) => !r.is_correct);
  const avgCorrectConf = correct.length
    ? correct.reduce((s, r) => s + (r.confidence_rating || 0), 0) / correct.length
    : 0;
  const avgWrongConf = wrong.length
    ? wrong.reduce((s, r) => s + (r.confidence_rating || 0), 0) / wrong.length
    : 0;
  const correctRate = correct.length / rows.length;

  // Right but unsure → underconfident
  if (correctRate >= 0.7 && avgCorrectConf <= 3) {
    return {
      key: "confidence_trend",
      title: "Confidence trend",
      message:
        "You are getting answers right but rating confidence low. Your understanding may be stronger than you think.",
      accent: "hsl(200 65% 50%)",
    };
  }
  // Wrong but very sure → overconfident
  if (wrong.length >= 3 && avgWrongConf >= 4) {
    return {
      key: "confidence_trend",
      title: "Confidence trend",
      message:
        "You are answering with high confidence even when wrong. A second read may be your edge.",
      accent: "hsl(35 80% 50%)",
    };
  }
  // Aligned and strong
  if (correctRate >= 0.7 && avgCorrectConf >= 4) {
    return {
      key: "confidence_trend",
      title: "Confidence trend",
      message: "Confidence and accuracy are climbing together — you're in the zone.",
      accent: "hsl(145 55% 40%)",
    };
  }
  return {
    key: "confidence_trend",
    title: "Confidence trend",
    message: "Confidence is steadying as you practice.",
    accent: "hsl(220 30% 50%)",
  };
}

const PREFERRED_MODE_NOTE: Record<string, string> = {
  teach: "You prefer learning before testing — soak it in, then prove it.",
  test: "You learn by doing. Practice questions are sharpening your edge.",
};

async function buildPreferredModeSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("learning_mode_stats")
    .select("preferred_mode, teach_mode_time, test_mode_time, mode_switch_count")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as any[];
  if (!rows.length) {
    return {
      key: "preferred_mode",
      title: "Preferred mode",
      message: "Open a term and try Teach or Test mode to set your preference.",
      empty: true,
    };
  }
  let teach = 0;
  let test = 0;
  let switches = 0;
  for (const r of rows) {
    teach += r.teach_mode_time ?? 0;
    test += r.test_mode_time ?? 0;
    switches += r.mode_switch_count ?? 0;
  }
  if (switches >= 5 && Math.abs(teach - test) < Math.max(teach, test) * 0.3) {
    return {
      key: "preferred_mode",
      title: "Preferred mode",
      message: "You move between Teach and Test often — that flexibility is a strength.",
      accent: "hsl(265 55% 55%)",
    };
  }
  const mode = teach >= test ? "teach" : "test";
  return {
    key: "preferred_mode",
    title: "Preferred mode",
    message: `You spend more time in ${mode === "teach" ? "Teach" : "Test"} mode. ${PREFERRED_MODE_NOTE[mode]}`,
    accent: "hsl(220 50% 50%)",
  };
}

async function buildCognitiveLoadSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("cognitive_load_snapshots")
    .select("cognitive_load, created_at")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as { cognitive_load: string }[];
  if (!rows.length) {
    return {
      key: "cognitive_load",
      title: "Cognitive load level",
      message: "Your pace looks comfortable so far today.",
      accent: "hsl(145 50% 40%)",
    };
  }
  const high = rows.filter((r) => r.cognitive_load === "high").length;
  const moderate = rows.filter((r) => r.cognitive_load === "moderate").length;
  if (high >= 2) {
    return {
      key: "cognitive_load",
      title: "Cognitive load level",
      message: "Cognitive load has been running high. A short reset will help more than pushing through.",
      accent: "hsl(0 65% 55%)",
    };
  }
  if (moderate >= 3) {
    return {
      key: "cognitive_load",
      title: "Cognitive load level",
      message: "You're in a moderate-load stretch. Adding a visual or metaphor layer may lighten it.",
      accent: "hsl(35 80% 50%)",
    };
  }
  return {
    key: "cognitive_load",
    title: "Cognitive load level",
    message: "Cognitive load is low — a steady rhythm is forming.",
    accent: "hsl(145 50% 40%)",
  };
}

const BREAKDOWN_LABEL: Record<string, string> = {
  definition: "the definition",
  guided_explanation: "the guided explanation",
  visual: "the visual",
  metaphor: "the metaphor",
  question_wording: "the question wording",
  answer_choices: "the answer choices",
  not_sure: "naming where it broke down",
};

const BREAKDOWN_NOTE: Record<string, string> = {
  definition: "Starting with a simpler definition rebuild may help.",
  guided_explanation: "Walking through the guided lesson again should reset the foundation.",
  visual: "A fresh visual pass often clears the fog.",
  metaphor: "Try a different metaphor — the right one will stick.",
  question_wording: "A question-reading strategy will protect you in exams.",
  answer_choices: "Comparing similar choices side-by-side speeds up elimination.",
  not_sure: "We'll guide a soft reset whenever you're ready.",
};

async function buildBreakdownPatternSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("breakdown_point_picks")
    .select("breakdown_point")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .limit(200);
  const top = topCount<string>((data ?? []).map((r: any) => ({ value: r.breakdown_point })));
  if (!top || top.count < 2) {
    return {
      key: "breakdown_pattern",
      title: "Breakdown point pattern",
      message: "No recurring breakdown point — comprehension is holding.",
      empty: true,
    };
  }
  const label = BREAKDOWN_LABEL[top.value] ?? top.value.replace(/_/g, " ");
  const note = BREAKDOWN_NOTE[top.value] ?? "";
  return {
    key: "breakdown_pattern",
    title: "Breakdown point pattern",
    message: `Things often stop making sense at ${label}. ${note}`.trim(),
    accent: "hsl(280 55% 50%)",
  };
}

const RECOVERY_NOTE: Record<string, string> = {
  "self-corrected":
    "You often self-correct after a second chance. That shows strong recovery ability.",
  "support-seeking":
    "You reach for support when you need it — that's a sign of self-aware learning.",
  "answer-dependent":
    "You tend to ask for the answer first. Try one extra attempt before revealing it — your brain locks in more.",
};

async function buildRecoveryPatternSummary(userId: string): Promise<SummaryItem> {
  const { data } = await (supabase as any)
    .from("second_chance_picks")
    .select("recovery_pattern")
    .eq("user_id", userId)
    .gte("created_at", recentISO())
    .not("recovery_pattern", "is", null)
    .limit(200);
  const top = topCount<string>((data ?? []).map((r: any) => ({ value: r.recovery_pattern })));
  if (!top || top.count < 2) {
    return {
      key: "recovery_pattern",
      title: "Recovery pattern",
      message: "Take a second-chance moment to start building your recovery style.",
      empty: true,
    };
  }
  return {
    key: "recovery_pattern",
    title: "Recovery pattern",
    message: RECOVERY_NOTE[top.value] ?? "A clear recovery style is emerging.",
    accent: "hsl(160 50% 40%)",
  };
}

/** Suggested next layer derives from the other summaries — no extra query. */
function buildNextLayerSummary(others: SummaryItem[]): SummaryItem {
  const by = (k: SummaryKey) => others.find((s) => s.key === k);
  const cog = by("cognitive_load");
  const skipped = by("skipped_layer");
  const breakdown = by("breakdown_pattern");
  const error = by("error_type");

  if (cog && /high/.test(cog.message)) {
    return {
      key: "next_layer",
      title: "Suggested next layer",
      message: "Take a TJ Café reset, then return to a Visual or Metaphor layer.",
      accent: "hsl(265 55% 55%)",
    };
  }
  if (skipped && !skipped.empty) {
    const surface = Object.entries(SKIPPED_LAYER_LABEL).find(([, label]) =>
      skipped.message.includes(label),
    )?.[0];
    if (surface) {
      return {
        key: "next_layer",
        title: "Suggested next layer",
        message: `Spend a few minutes in ${SKIPPED_LAYER_LABEL[surface]} on your next term.`,
        accent: "hsl(265 55% 55%)",
      };
    }
  }
  if (breakdown && !breakdown.empty) {
    return {
      key: "next_layer",
      title: "Suggested next layer",
      message: "Re-enter the layer where things usually stop making sense — that's the unlock.",
      accent: "hsl(265 55% 55%)",
    };
  }
  if (error && !error.empty) {
    return {
      key: "next_layer",
      title: "Suggested next layer",
      message: "Try a Practice quiz to convert the pattern you noticed into points.",
      accent: "hsl(265 55% 55%)",
    };
  }
  return {
    key: "next_layer",
    title: "Suggested next layer",
    message: "Open a new term and let the flow guide you — your rhythm is good.",
    accent: "hsl(265 55% 55%)",
  };
}

/** ---------- public entry point ---------- */

export async function loadBehaviorSummary(userId: string): Promise<SummaryItem[]> {
  const [
    thinking,
    skipped,
    error,
    confidence,
    mode,
    cognitive,
    breakdown,
    recovery,
  ] = await Promise.all([
    buildThinkingPathSummary(userId).catch(() => null),
    buildSkippedLayerSummary(userId).catch(() => null),
    buildErrorTypeSummary(userId).catch(() => null),
    buildConfidenceTrendSummary(userId).catch(() => null),
    buildPreferredModeSummary(userId).catch(() => null),
    buildCognitiveLoadSummary(userId).catch(() => null),
    buildBreakdownPatternSummary(userId).catch(() => null),
    buildRecoveryPatternSummary(userId).catch(() => null),
  ]);
  const items: SummaryItem[] = [
    thinking, skipped, error, confidence, mode, cognitive, breakdown, recovery,
  ].filter(Boolean) as SummaryItem[];
  items.push(buildNextLayerSummary(items));
  return items;
}
