/* Learner Behavior Intake — Public API barrel. */

export * from "./types";
export { BEHAVIOR_RULES } from "./rules";
export {
  wordCount,
  deriveCognitiveLoad,
  deriveLayerIntegrity,
  deriveBreakdownPoint,
} from "./derive";
export {
  saveSignal,
  loadRecentSignals,
  loadProfileAggregate,
  getBehaviorAggregateForDNA,
} from "./store";
export { recommendNextRoute } from "./router";
export type { BehaviorRoute, BehaviorSuggestion } from "./router";
