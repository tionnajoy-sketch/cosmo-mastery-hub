// TJ Anderson Layer Method™ — Rubric-Based Reasoning Evaluator
//
// Grades a learner's free-text answer to a diversified question.
// Uses the rubric stored on terms.diversified_questions[i].rubric — the
// AI is told to grade for REASONING, not exact wording.
//
// Returns a verdict ("correct" | "partial" | "incorrect"), a short
// TJ-voice feedback line, and the deltas the DNA engine should apply.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are TJ Anderson grading a cosmetology student's reasoning.
You grade for UNDERSTANDING, not exact wording.

You will receive:
- the question (plus its type)
- the rubric: must_include (semantic concepts), must_not_say, sample_correct_answer, common_misconceptions
- the student's answer

Decide ONE verdict:
- "correct"   — the student's reasoning covers the must_include concepts (in their own words is fine) AND avoids the must_not_say errors.
- "partial"   — the student is on the right track but missed key reasoning OR included a small misconception.
- "incorrect" — the answer is mostly wrong, off-topic, blank, or hits a must_not_say error squarely.

Then write ONE short TJ-voice feedback line (max 2 sentences):
- If correct: affirm what they got right, briefly.
- If partial: name what's missing in plain language.
- If incorrect: gently redirect — name the misunderstanding, point to the right idea. Never harsh.

Also return:
- matched_concepts: array of the must_include items the student actually demonstrated (semantic match).
- triggered_misconceptions: array of any must_not_say or common_misconceptions the student exhibited.

Be strict on REASONING, lenient on grammar/spelling.`;

const schema = {
  name: "grade_diversified_answer",
  strict: true,
  schema: {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
      feedback: { type: "string" },
      matched_concepts: { type: "array", items: { type: "string" } },
      triggered_misconceptions: { type: "array", items: { type: "string" } },
    },
    required: ["verdict", "feedback", "matched_concepts", "triggered_misconceptions"],
    additionalProperties: false,
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Supabase service env missing");

    const body = await req.json().catch(() => ({}));
    const termId: string | undefined = body?.term_id;
    const questionIndex: number =
      typeof body?.question_index === "number" ? body.question_index : 0;
    const studentAnswer: string = String(body?.answer ?? "").trim();
    const model: string = body?.model || DEFAULT_MODEL;

    if (!termId) return json({ error: "term_id is required" }, 400);
    if (questionIndex !== 0 && questionIndex !== 1)
      return json({ error: "question_index must be 0 or 1" }, 400);
    if (!studentAnswer) {
      // Empty answer = incorrect, no AI call needed (deterministic).
      return json({
        verdict: "incorrect",
        feedback: "Take a real swing at it — even one sentence shows me your thinking.",
        matched_concepts: [],
        triggered_misconceptions: ["blank_answer"],
        dna_signal: { correct: false, reattempt: false, skippedReflection: true },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: term, error: termErr } = await supabase
      .from("terms")
      .select("id, term, diversified_questions")
      .eq("id", termId)
      .maybeSingle();
    if (termErr || !term) return json({ error: "Term not found" }, 404);

    const dq = (term.diversified_questions ?? {}) as {
      questions?: Array<{
        type: string;
        label: string;
        prompt: string;
        incorrect_statement?: string;
        compared_with?: string;
        rubric: {
          must_include: string[];
          must_not_say: string[];
          sample_correct_answer: string;
          common_misconceptions: string[];
        };
      }>;
    };
    const question = dq.questions?.[questionIndex];
    if (!question) return json({ error: "no_question_at_index" }, 404);

    const userPrompt = [
      `TERM: ${term.term}`,
      `QUESTION TYPE: ${question.type} (${question.label})`,
      `QUESTION: ${question.prompt}`,
      question.incorrect_statement
        ? `INCORRECT STATEMENT TO CORRECT: ${question.incorrect_statement}`
        : "",
      question.compared_with ? `COMPARED WITH: ${question.compared_with}` : "",
      "",
      `RUBRIC:`,
      `- must_include (semantic): ${JSON.stringify(question.rubric.must_include)}`,
      `- must_not_say: ${JSON.stringify(question.rubric.must_not_say)}`,
      `- sample_correct_answer: ${question.rubric.sample_correct_answer}`,
      `- common_misconceptions: ${JSON.stringify(question.rubric.common_misconceptions)}`,
      "",
      `STUDENT ANSWER:`,
      studentAnswer,
      "",
      "Grade now. Return JSON only.",
    ].filter(Boolean).join("\n");

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_schema", json_schema: schema },
        temperature: 0.2,
      }),
    });

    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      console.error("OpenAI error", aiResp.status, errTxt);
      if (aiResp.status === 429)
        return json({ error: "rate_limited" }, 429);
      if (aiResp.status === 402 || aiResp.status === 403)
        return json({ error: "billing_or_access" }, aiResp.status);
      if (aiResp.status === 401)
        return json({ error: "invalid_api_key" }, 401);
      return json({ error: `openai_${aiResp.status}`, detail: errTxt.slice(0, 400) }, 502);
    }

    const aiJson = await aiResp.json();
    const content: string | undefined = aiJson?.choices?.[0]?.message?.content;
    if (!content) return json({ error: "no_content" }, 502);

    let graded: {
      verdict: "correct" | "partial" | "incorrect";
      feedback: string;
      matched_concepts: string[];
      triggered_misconceptions: string[];
    };
    try {
      graded = JSON.parse(content);
    } catch {
      return json({ error: "bad_json", raw: content.slice(0, 400) }, 502);
    }

    // Map verdict → adaptive DNA signal so the engine can apply rule-based deltas.
    // (Pure mapping; no scoring done here. The DNA engine owns the actual deltas.)
    const dna_signal = {
      correct: graded.verdict === "correct",
      partial: graded.verdict === "partial",
      reattempt: false, // caller passes reattempt context to useTJEngine separately
      skippedReflection: false,
      triggerReinforcement:
        graded.verdict === "incorrect" || graded.verdict === "partial",
    };

    return json({
      ok: true,
      term_id: termId,
      question_index: questionIndex,
      question_type: question.type,
      ...graded,
      dna_signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("evaluate-diversified-answer error", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
