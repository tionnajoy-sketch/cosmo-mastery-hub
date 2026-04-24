/* ───────────────────────────────────────────────────────────────────
 * useBrainStrengths — single source of truth for the new DNA brain.
 *
 * Reads brain_strengths from the profile (initialized to all-50 in the
 * migration), exposes mutators that:
 *   1. compute the next strengths
 *   2. derive the legacy [L][E][R][C] code so the rest of the app still works
 *   3. persist both to profiles
 *   4. emit dna_progress_events so the floating bubble lights up live
 * ─────────────────────────────────────────────────────────────────── */

import { useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLessonContext } from "@/lib/dna/currentLessonContext";
import {
  applyAssessUpdate,
  applyDelta,
  applyLayerCompletion,
  applyRecallReconstruction,
  brainBalanceScore,
  deriveDNACode,
  diffStrengths,
  ensureBrainStrengths,
  findStrongestBrain,
  findWeakestBrain,
  type BrainDelta,
  type BrainStrengths,
  type StrengthKey,
} from "@/lib/dna/brainStrengths";

export const useBrainStrengths = () => {
  const { user, profile, refreshProfile } = useAuth();

  const strengths: BrainStrengths = useMemo(
    () => ensureBrainStrengths((profile as any)?.brain_strengths),
    [profile],
  );

  const balance = useMemo(() => brainBalanceScore(strengths), [strengths]);
  const strongest = useMemo(() => findStrongestBrain(strengths), [strengths]);
  const weakest = useMemo(() => findWeakestBrain(strengths), [strengths]);
  const derived = useMemo(() => deriveDNACode(strengths), [strengths]);

  /** Persist updated strengths and the derived DNA code. */
  const persist = useCallback(
    async (next: BrainStrengths, deltas: BrainDelta[]) => {
      if (!user || !profile) return;
      const code = deriveDNACode(next);
      const updates: Record<string, unknown> = {
        brain_strengths: next,
        tj_dna_code: code.code,
        dna_layer_strength: code.layerLetter,
        dna_engagement: code.engagementDigit,
        dna_retention: code.retentionChar,
        dna_confidence: code.confidenceChar,
      };
      await (supabase.from("profiles") as any).update(updates).eq("id", user.id);

      // Log progress events so the floating DNA bubble updates live.
      if (deltas.length > 0) {
        const ctx = getLessonContext();
        const rows = deltas.map((d) => ({
          user_id: user.id,
          field: d.key,
          from_value: String(d.before),
          to_value: String(d.after),
          delta: d.delta,
          lesson_context: ctx ?? {},
          note: "",
        }));
        await (supabase.from("dna_progress_events") as any).insert(rows);
      }

      await refreshProfile();
    },
    [user, profile, refreshProfile],
  );

  /** Bump strengths after the learner completes one of the 9 layers. */
  const completeLayer = useCallback(
    async (layerKey: string) => {
      const next = applyLayerCompletion(strengths, layerKey);
      await persist(next, diffStrengths(strengths, next));
    },
    [strengths, persist],
  );

  /** Score the Assess step (right/wrong, no punishment for wrong). */
  const recordAssess = useCallback(
    async (correct: boolean) => {
      const next = applyAssessUpdate(strengths, correct);
      await persist(next, diffStrengths(strengths, next));
    },
    [strengths, persist],
  );

  /** Score the new Recall Reconstruction (10th) step. */
  const recordRecallReconstruction = useCallback(
    async (scorePct: number) => {
      const next = applyRecallReconstruction(strengths, scorePct);
      await persist(next, diffStrengths(strengths, next));
    },
    [strengths, persist],
  );

  /** Free-form delta (used by reinforcement micro-check, time-spent nudges, etc). */
  const applyManualDelta = useCallback(
    async (patch: Partial<Record<StrengthKey, number>>) => {
      const next = applyDelta(strengths, patch);
      await persist(next, diffStrengths(strengths, next));
    },
    [strengths, persist],
  );

  return {
    strengths,
    balance,
    strongest,
    weakest,
    derivedCode: derived.code,
    completeLayer,
    recordAssess,
    recordRecallReconstruction,
    applyManualDelta,
  };
};
