/* TJ Engine — Public API barrel
 *
 * Import from "@/lib/tj-engine" everywhere — never reach into internals.
 * The Engine governs; AI assists.
 */

export * from "./types";
export {
  loadRules,
  getDefaultRules,
  findStage,
  findFeedback,
  findCompletion,
  findUnlock,
  findDNA,
  findReinforcement,
  findMapping,
} from "./ruleRepository";
export { interpretSubmission } from "./interpreter";
export { generateFeedback, renderFeedbackMarkdown } from "./feedbackGenerator";
export { decideProgress, computeUnlockedStages, nextStage } from "./progressController";
export { evaluateSubmission } from "./evaluator";
