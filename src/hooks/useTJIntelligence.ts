import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  IntelligenceSnapshot,
  LayerBreakdown,
  LayerKey,
  DoThisNowAction,
} from "@/lib/intelligence/types";

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: "visualize", label: "Visualize" },
  { key: "define", label: "Define" },
  { key: "breakdown", label: "Break It Down" },
  { key: "recognize", label: "Recognize" },
  { key: "metaphor", label: "Metaphor" },
  { key: "information", label: "Information" },
  { key: "reflect", label: "Reflect" },
  { key: "apply", label: "Apply" },
  { key: "assess", label: "Assess" },
];

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today miss if streak just started
      if (streak === 0) {
        d.setDate(d.getDate() - 1);
        const k2 = d.toISOString().slice(0, 10);
        if (set.has(k2)) { streak++; d.setDate(d.getDate() - 1); continue; }
      }
      break;
    }
  }
  return streak;
}

const EMPTY: IntelligenceSnapshot = {
  overview: {
    studyStreak: 0, termsCompleted: 0, totalTerms: 0,
    weakestTopic: "—", strongestTopic: "—",
    confidenceScore: 0, retentionScore: 0, passReadiness: 0,
    todaysFocus: "Start with one term today — the rest will follow.",
  },
  breakdown: LAYERS.map((l) => ({ layer: l.key, label: l.label, completionPct: 0, performance: 0, count: 0 })),
  dna: {
    preferredLayer: "—", strongestStyle: "—", weakestStyle: "—",
    confidenceState: "developing", retentionState: "developing",
    recommendedNext: "Open any term to begin building your profile.",
  },
  action: {
    headline: "Start your first term",
    detail: "Pick any section in Learn and complete one full TJ lesson to unlock your intelligence profile.",
    cta: "Open Learn",
    route: "/learn",
  },
  loading: true,
};

export function useTJIntelligence() {
  const { user } = useAuth();
  const [snap, setSnap] = useState<IntelligenceSnapshot>(EMPTY);

  const load = useCallback(async () => {
    if (!user) return;
    setSnap((s) => ({ ...s, loading: true }));

    const [
      metricsRes, activityRes, termsRes, sectionsRes, confRes,
      profileRes, behaviorRes, struggleRes,
    ] = await Promise.all([
      supabase.from("user_learning_metrics").select("*").eq("user_id", user.id),
      supabase.from("study_activity").select("activity_date").eq("user_id", user.id).order("activity_date", { ascending: false }).limit(60),
      supabase.from("terms").select("id, term, section_id"),
      supabase.from("sections").select("id, name"),
      supabase.from("confidence_ratings").select("confidence_rating, term_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      (supabase.from("profiles") as any).select("tj_dna_code, dna_engagement, dna_retention, dna_confidence, dna_layer_strength").eq("id", user.id).maybeSingle(),
      supabase.from("learner_behavior_signals").select("stage_id, confidence_rating, term_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("term_struggle").select("term_id, incorrect_attempts").eq("user_id", user.id),
    ]);

    const metrics = metricsRes.data || [];
    const terms = termsRes.data || [];
    const sections = sectionsRes.data || [];
    const conf = confRes.data || [];
    const behavior = behaviorRes.data || [];
    const struggle = struggleRes.data || [];
    const profile = (profileRes as any).data || {};

    const sectionById = new Map(sections.map((s: any) => [s.id, s.name]));
    const termById = new Map(terms.map((t: any) => [t.id, t]));

    // Streak
    const dates = (activityRes.data || []).map((r: any) => r.activity_date);
    const studyStreak = computeStreak(dates);

    // Completion + section perf
    const totalTerms = terms.length;
    const termsCompleted = metrics.filter((m: any) => m.mastery_achieved || (Array.isArray(m.layers_completed) && m.layers_completed.length >= 8)).length;

    const sectionStats = new Map<string, { sum: number; n: number }>();
    metrics.forEach((m: any) => {
      const t = termById.get(m.term_id);
      if (!t) return;
      const score = (m.understanding + m.retention + m.confidence) / 3;
      const cur = sectionStats.get(t.section_id) || { sum: 0, n: 0 };
      cur.sum += score; cur.n += 1;
      sectionStats.set(t.section_id, cur);
    });
    let weakest = { name: "—", v: 101 };
    let strongest = { name: "—", v: -1 };
    sectionStats.forEach((v, k) => {
      const avg = v.sum / Math.max(1, v.n);
      const name = sectionById.get(k) || "Section";
      if (avg < weakest.v) weakest = { name, v: avg };
      if (avg > strongest.v) strongest = { name, v: avg };
    });

    // Confidence + retention scores
    const confAvg = conf.length ? Math.round((conf.reduce((a: number, c: any) => a + (c.confidence_rating || 0), 0) / conf.length) * 20) : 0;
    const retAvg = metrics.length ? Math.round(metrics.reduce((a: number, m: any) => a + m.retention, 0) / metrics.length) : 0;
    const undAvg = metrics.length ? Math.round(metrics.reduce((a: number, m: any) => a + m.understanding, 0) / metrics.length) : 0;

    // Pass readiness — weighted blend
    const completionPct = totalTerms ? Math.round((termsCompleted / totalTerms) * 100) : 0;
    const passReadiness = Math.round(
      undAvg * 0.25 + retAvg * 0.20 + confAvg * 0.20 + completionPct * 0.25 + Math.min(100, studyStreak * 10) * 0.10
    );

    // Layer breakdown — completion from metrics.layers_completed; performance from behavior signals
    const layerCounts = new Map<string, { done: number; conf: number[] }>();
    metrics.forEach((m: any) => {
      const layers = Array.isArray(m.layers_completed) ? m.layers_completed : [];
      layers.forEach((l: string) => {
        const cur = layerCounts.get(l) || { done: 0, conf: [] };
        cur.done++;
        layerCounts.set(l, cur);
      });
    });
    behavior.forEach((b: any) => {
      if (!b.stage_id || b.confidence_rating == null) return;
      const cur = layerCounts.get(b.stage_id) || { done: 0, conf: [] };
      cur.conf.push(b.confidence_rating);
      layerCounts.set(b.stage_id, cur);
    });
    const totalForCompletion = Math.max(1, totalTerms);
    const breakdown: LayerBreakdown[] = LAYERS.map((l) => {
      const c = layerCounts.get(l.key) || { done: 0, conf: [] };
      const completionPct = Math.min(100, Math.round((c.done / totalForCompletion) * 100));
      const performance = c.conf.length
        ? Math.round((c.conf.reduce((a, n) => a + n, 0) / c.conf.length) * 20)
        : completionPct;
      return { layer: l.key, label: l.label, completionPct, performance, count: c.done };
    });

    // DNA summary
    const strongestLayer = breakdown.slice().sort((a, b) => b.performance - a.performance)[0];
    const weakestLayer = breakdown.slice().filter((b) => b.count > 0).sort((a, b) => a.performance - b.performance)[0] || strongestLayer;

    const confidenceState: "low" | "developing" | "high" =
      confAvg < 40 ? "low" : confAvg < 70 ? "developing" : "high";
    const retentionState: "low" | "developing" | "strong" =
      retAvg < 40 ? "low" : retAvg < 70 ? "developing" : "strong";

    // Do This Now
    const action = buildDoThisNow({
      streak: studyStreak,
      passReadiness,
      weakestSection: weakest.name,
      weakestLayer: weakestLayer?.label || "Reflect",
      struggleCount: struggle.length,
      confidenceState,
      hasMetrics: metrics.length > 0,
    });

    setSnap({
      overview: {
        studyStreak,
        termsCompleted,
        totalTerms,
        weakestTopic: weakest.name,
        strongestTopic: strongest.name,
        confidenceScore: confAvg,
        retentionScore: retAvg,
        passReadiness,
        todaysFocus: action.headline,
      },
      breakdown,
      dna: {
        preferredLayer: profile.dna_layer_strength || strongestLayer?.label || "Define",
        strongestStyle: strongestLayer?.label || "—",
        weakestStyle: weakestLayer?.label || "—",
        confidenceState,
        retentionState,
        recommendedNext: action.detail,
      },
      action,
      loading: false,
    });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { ...snap, refresh: load };
}

function buildDoThisNow(args: {
  streak: number; passReadiness: number; weakestSection: string;
  weakestLayer: string; struggleCount: number;
  confidenceState: "low" | "developing" | "high"; hasMetrics: boolean;
}): DoThisNowAction {
  if (!args.hasMetrics) {
    return {
      headline: "Start your first term",
      detail: "Pick any section in Learn and complete one full TJ lesson — that unlocks your intelligence profile.",
      cta: "Open Learn", route: "/learn",
    };
  }
  if (args.struggleCount >= 3) {
    return {
      headline: `Revisit your struggle terms`,
      detail: `You have ${args.struggleCount} terms flagged. Spend 10 minutes reviewing them before any new quiz.`,
      cta: "Open My Notes", route: "/my-notes",
    };
  }
  if (args.confidenceState === "low") {
    return {
      headline: "Slow down — confidence needs rebuilding",
      detail: `Open one term in ${args.weakestSection} and use the ${args.weakestLayer} layer. No quizzes today.`,
      cta: "Open Learn", route: "/learn",
    };
  }
  if (args.passReadiness < 60) {
    return {
      headline: `Strengthen ${args.weakestSection}`,
      detail: `Your weakest topic is ${args.weakestSection}. Complete 2 terms there using the ${args.weakestLayer} layer.`,
      cta: "Open Learn", route: "/learn",
    };
  }
  return {
    headline: "Run a Mastery Check",
    detail: `Pass-readiness is ${args.passReadiness}. Take a focused quiz in ${args.weakestSection} to lock it in.`,
    cta: "Open Practice", route: "/learn",
  };
}
