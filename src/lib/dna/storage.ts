/* ─── DNA V2 Storage Abstraction ─── */
/* Today: reads/writes JSONB columns on profiles.
 * Tomorrow: swap to dedicated tables — only this file changes. */

import { supabase } from "@/integrations/supabase/client";
import type { BehaviorHistory, LayerScores } from "./types";
import { ensureHistory } from "./behaviorMemory";

export interface DNAStorageState {
  layerScores: LayerScores;
  behaviorHistory: BehaviorHistory;
}

export function readDNAStateFromProfile(profile: any): DNAStorageState {
  const layerScores: LayerScores =
    profile?.layer_scores && typeof profile.layer_scores === "object"
      ? (profile.layer_scores as LayerScores)
      : {};
  const behaviorHistory = ensureHistory(profile?.behavior_history as BehaviorHistory);
  return { layerScores, behaviorHistory };
}

export interface PersistDNAArgs {
  userId: string;
  tj_dna_code?: string;
  dna_engagement?: number;
  dna_retention?: string;
  dna_confidence?: string;
  dna_layer_strength?: string;
  layer_scores?: LayerScores;
  behavior_history?: BehaviorHistory;
}

export async function persistDNA(args: PersistDNAArgs): Promise<void> {
  const { userId, ...patch } = args;
  // Cast through any to tolerate Supabase types not yet including new columns
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v as unknown;
  }
  if (Object.keys(updates).length === 0) return;
  await (supabase.from("profiles") as any).update(updates).eq("id", userId);
}
