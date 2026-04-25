/* TJ Engine — Rule Repository
 *
 * Loads JSON defaults shipped in the repo, then overlays any rows from
 * the tj_rules table (DB overrides JSON). One source of truth for the
 * Engine. Cached per session to avoid re-fetching.
 */

import { supabase } from "@/integrations/supabase/client";
import stagesJson from "./rules/stages.json";
import mappingJson from "./rules/stage-mapping.json";
import feedbackJson from "./rules/feedback.json";
import completionJson from "./rules/completion.json";
import unlockJson from "./rules/unlock.json";
import dnaUpdateJson from "./rules/dna-update.json";
import reinforcementJson from "./rules/reinforcement.json";
import type {
  CompletionRule,
  DNAUpdateRule,
  FeedbackTemplate,
  ReinforcementRule,
  StageDefinition,
  StageId,
  StageMappingRule,
  UnlockRule,
} from "./types";

export interface TJRuleSet {
  stages: StageDefinition[];
  mapping: StageMappingRule[];
  feedback: FeedbackTemplate[];
  completion: CompletionRule[];
  unlock: UnlockRule[];
  dna: DNAUpdateRule[];
  reinforcement: ReinforcementRule[];
}

let cache: TJRuleSet | null = null;
let cachePromise: Promise<TJRuleSet> | null = null;

const defaults: TJRuleSet = {
  stages: (stagesJson as any).stages as StageDefinition[],
  mapping: (mappingJson as any).rules as StageMappingRule[],
  feedback: (feedbackJson as any).templates as FeedbackTemplate[],
  completion: (completionJson as any).rules as CompletionRule[],
  unlock: (unlockJson as any).rules as UnlockRule[],
  dna: (dnaUpdateJson as any).rules as DNAUpdateRule[],
  reinforcement: (reinforcementJson as any).rules as ReinforcementRule[],
};

function applyOverride(base: TJRuleSet, key: string, payload: any): TJRuleSet {
  // key format: "<rule_type>:<stage>" or "<rule_type>:all"
  const [type, target] = key.split(":");
  const next: TJRuleSet = {
    stages: [...base.stages],
    mapping: [...base.mapping],
    feedback: [...base.feedback],
    completion: [...base.completion],
    unlock: [...base.unlock],
    dna: [...base.dna],
    reinforcement: [...base.reinforcement],
  };

  switch (type) {
    case "feedback":
      if (target && payload) {
        next.feedback = next.feedback.map((f) =>
          f.stage === target ? { ...f, ...payload } : f,
        );
      }
      break;
    case "completion":
      if (target && payload) {
        next.completion = next.completion.map((c) =>
          c.stage === target ? { ...c, ...payload } : c,
        );
      }
      break;
    case "stage_mapping":
      if (target && payload?.patterns) {
        next.mapping = next.mapping.map((m) =>
          m.stage === target ? { ...m, ...payload } : m,
        );
      }
      break;
    case "unlock":
      if (target && payload) {
        next.unlock = next.unlock.map((u) =>
          u.stage === target ? { ...u, ...payload } : u,
        );
      }
      break;
    case "dna_update":
      if (target && payload) {
        next.dna = next.dna.map((d) =>
          d.stage === target ? { ...d, ...payload } : d,
        );
      }
      break;
    case "reinforcement":
      if (target && payload) {
        next.reinforcement = next.reinforcement.map((r) =>
          r.stage === target ? { ...r, ...payload } : r,
        );
      }
      break;
  }
  return next;
}

export async function loadRules(force = false): Promise<TJRuleSet> {
  if (cache && !force) return cache;
  if (cachePromise && !force) return cachePromise;

  cachePromise = (async () => {
    let merged: TJRuleSet = { ...defaults };
    try {
      const { data } = await (supabase.from("tj_rules") as any)
        .select("rule_key, payload, is_active")
        .eq("is_active", true);
      if (Array.isArray(data)) {
        for (const row of data) {
          merged = applyOverride(merged, row.rule_key as string, row.payload);
        }
      }
    } catch {
      // DB unavailable → defaults only. The engine still works.
    }
    cache = merged;
    return merged;
  })();

  return cachePromise;
}

/** Sync access to defaults — used by code paths that can't await. */
export function getDefaultRules(): TJRuleSet {
  return defaults;
}

export function findStage(rules: TJRuleSet, stage: StageId): StageDefinition | undefined {
  return rules.stages.find((s) => s.stage_id === stage);
}

export function findMapping(rules: TJRuleSet, stage: StageId) {
  return rules.mapping.find((m) => m.stage === stage);
}

export function findFeedback(rules: TJRuleSet, stage: StageId) {
  return rules.feedback.find((f) => f.stage === stage);
}

export function findCompletion(rules: TJRuleSet, stage: StageId) {
  return rules.completion.find((c) => c.stage === stage);
}

export function findUnlock(rules: TJRuleSet, stage: StageId) {
  return rules.unlock.find((u) => u.stage === stage);
}

export function findDNA(rules: TJRuleSet, stage: StageId) {
  return rules.dna.find((d) => d.stage === stage);
}

export function findReinforcement(rules: TJRuleSet, stage: StageId) {
  return rules.reinforcement.find((r) => r.stage === stage);
}
