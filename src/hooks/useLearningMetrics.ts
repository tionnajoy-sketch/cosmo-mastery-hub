import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TermMetrics {
  term_id: string;
  confidence: number;
  retention: number;
  understanding: number;
  xp: number;
  layers_completed: string[];
  mastery_achieved: boolean;
}

export interface AggregateMetrics {
  totalXP: number;
  avgConfidence: number;
  avgRetention: number;
  avgUnderstanding: number;
  masteredCount: number;
  totalTerms: number;
}

export const useLearningMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Map<string, TermMetrics>>(new Map());
  const [aggregate, setAggregate] = useState<AggregateMetrics>({
    totalXP: 0, avgConfidence: 0, avgRetention: 0, avgUnderstanding: 0, masteredCount: 0, totalTerms: 0,
  });

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_learning_metrics")
      .select("*")
      .eq("user_id", user.id);
    if (!data) return;

    const map = new Map<string, TermMetrics>();
    let totalXP = 0, totalConf = 0, totalRet = 0, totalUnd = 0, mastered = 0;
    data.forEach((d: any) => {
      const layers = Array.isArray(d.layers_completed) ? d.layers_completed.map(String) : [];
      map.set(d.term_id, {
        term_id: d.term_id,
        confidence: d.confidence,
        retention: d.retention,
        understanding: d.understanding,
        xp: d.xp,
        layers_completed: layers,
        mastery_achieved: d.mastery_achieved,
      });
      totalXP += d.xp;
      totalConf += d.confidence;
      totalRet += d.retention;
      totalUnd += d.understanding;
      if (d.mastery_achieved) mastered++;
    });

    setMetrics(map);
    const count = data.length || 1;
    setAggregate({
      totalXP,
      avgConfidence: Math.round(totalConf / count),
      avgRetention: Math.round(totalRet / count),
      avgUnderstanding: Math.round(totalUnd / count),
      masteredCount: mastered,
      totalTerms: data.length,
    });
  }, [user]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // Realtime: re-fetch on any metric/quiz/wrong-answer change for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`learning-metrics-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_learning_metrics", filter: `user_id=eq.${user.id}` }, () => fetchMetrics())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quiz_results", filter: `user_id=eq.${user.id}` }, () => fetchMetrics())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wrong_answers", filter: `user_id=eq.${user.id}` }, () => fetchMetrics())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMetrics]);

  const updateTermMetrics = useCallback(async (
    termId: string,
    layerKey: string,
    xpEarned: number = 10
  ) => {
    if (!user) return;
    const existing = metrics.get(termId);
    const currentLayers = existing?.layers_completed || [];
    const newLayers = currentLayers.includes(layerKey) ? currentLayers : [...currentLayers, layerKey];
    
    const totalLayers = 8;
    const progress = Math.round((newLayers.length / totalLayers) * 100);
    const newMastery = newLayers.length >= totalLayers;

    const updates = {
      user_id: user.id,
      term_id: termId,
      understanding: Math.min(100, Math.round(progress * 0.8 + (existing?.understanding || 0) * 0.2)),
      retention: Math.min(100, Math.round(newLayers.length * 12)),
      confidence: Math.min(100, Math.round(newLayers.length * 10 + (existing?.confidence || 0) * 0.3)),
      xp: (existing?.xp || 0) + xpEarned,
      layers_completed: newLayers,
      mastery_achieved: newMastery,
      last_interaction_at: new Date().toISOString(),
    };

    await supabase.from("user_learning_metrics").upsert(updates, { onConflict: "user_id,term_id" });
    await fetchMetrics();
  }, [user, metrics, fetchMetrics]);

  const getTermStatus = useCallback((termId: string): "locked" | "active" | "in_progress" | "completed" | "mastery" => {
    const m = metrics.get(termId);
    if (!m) return "active";
    if (m.mastery_achieved) return "mastery";
    if (m.layers_completed.length >= 8) return "completed";
    if (m.layers_completed.length > 0) return "in_progress";
    return "active";
  }, [metrics]);

  return { metrics, aggregate, updateTermMetrics, getTermStatus, fetchMetrics };
};
