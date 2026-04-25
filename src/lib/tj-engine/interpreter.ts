/* TJ Engine — Submission Interpreter + Stage Mapper
 *
 * Takes student input (typed text, transcribed voice, quiz answer) and
 * classifies it into the most likely TJ stage based on the rule
 * repository's mapping patterns. AI is NOT in the loop here — this is
 * deterministic so the Engine governs the flow, not the model.
 */

import type { InterpretedSubmission, StageId } from "./types";
import type { TJRuleSet } from "./ruleRepository";

const ALL_STAGES: StageId[] = [
  "visualize",
  "define",
  "breakdown",
  "recall_reconstruction",
  "recognize",
  "metaphor",
  "information",
  "reflection",
  "application",
  "assess",
];

function emptyMatched(): Record<StageId, string[]> {
  return ALL_STAGES.reduce((acc, s) => {
    acc[s] = [];
    return acc;
  }, {} as Record<StageId, string[]>);
}

export function interpretSubmission(
  rules: TJRuleSet,
  rawText: string,
  expectedStage: StageId,
): InterpretedSubmission {
  const text = (rawText || "").toLowerCase().trim();
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const matched = emptyMatched();
  const scores: Partial<Record<StageId, number>> = {};

  for (const rule of rules.mapping) {
    let stageScore = 0;
    for (const pattern of rule.patterns) {
      if (text.includes(pattern.toLowerCase())) {
        matched[rule.stage].push(pattern);
        stageScore += rule.weight;
      }
    }
    if (stageScore > 0) scores[rule.stage] = stageScore;
  }

  // Pick best-scoring detected stage; fall back to expected if none matched.
  let detected: StageId = expectedStage;
  let bestScore = 0;
  for (const [stage, score] of Object.entries(scores)) {
    if ((score ?? 0) > bestScore) {
      bestScore = score ?? 0;
      detected = stage as StageId;
    }
  }
  const totalScore = Object.values(scores).reduce((a, b) => a + (b ?? 0), 0);
  const stageConfidence = totalScore > 0 ? bestScore / totalScore : 0;

  // Completion check happens in evaluator; here we surface basic signals.
  const completion = rules.completion.find((c) => c.stage === expectedStage);
  const minChars = completion?.min_chars ?? 0;
  const minHits = completion?.min_keyword_hits ?? 0;
  const expectedHits = matched[expectedStage]?.length ?? 0;
  const lenOk = text.length >= minChars;
  const hitsOk = expectedHits >= minHits;
  const isComplete = lenOk && hitsOk;

  // Missing signals = stages that the rule set considered relevant but
  // weren't represented in the response.
  const missing_signals: StageId[] = [];
  if (!isComplete) missing_signals.push(expectedStage);

  return {
    detected_stage: detected,
    stage_confidence: Math.round(stageConfidence * 100) / 100,
    matched_patterns: matched,
    is_complete: isComplete,
    missing_signals,
    raw_text: rawText,
    word_count: wordCount,
  };
}
