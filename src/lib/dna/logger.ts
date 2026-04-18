/* ─── DNA V2 Internal Decision Logger ─── */

import type { AdaptationDecisionLog, DecisionEntry } from "./types";

export function createLog(): AdaptationDecisionLog {
  return { timestamp: Date.now(), decisions: [] };
}

export function logDecision(
  log: AdaptationDecisionLog,
  field: string,
  value: DecisionEntry["value"],
  reason: string
): void {
  log.decisions.push({ field, value, reason });
}

export function emitLog(log: AdaptationDecisionLog, label = "DNA"): void {
  if (typeof console !== "undefined" && typeof console.debug === "function") {
    // eslint-disable-next-line no-console
    console.debug(`[${label}]`, log);
  }
}
