// TJ Anderson Layer Method™ — Diversified Term Questions Generator
//
// Replaces the legacy "definition rewrite + fill-in-the-blank" pattern.
// For each term, generates EXACTLY 2 reasoning-based questions, rotating
// across 5 thinking types so no two terms get the same combo back-to-back:
//
//   1. spot_the_mistake   — wrong statement → identify + correct
//   2. compare_contrast   — vs a related concept
//   3. cause_effect       — what happens if disrupted
//   4. client_explanation — explain to a client in plain words
//   5. decision_based     — apply concept to a real cosmetology decision
//
// Output is persisted to terms.diversified_questions (jsonb).
// Includes a structured rubric so the rubric-based evaluator function
// can grade reasoning (not exact wording).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "gpt-4o-mini";

const QUESTION_TYPES = [
  "spot_the_mistake",
  "compare_contrast",
  "cause_effect",
  "client_explanation",
  "decision_based",
] as const;

type QType = (typeof QUESTION_TYPES)[number];

const TYPE_LABEL: Record<QType, string> = {
  spot_the_mistake: "Spot the Mistake",
  compare_contrast: "Compare & Contrast",
  cause_effect: "Cause & Effect",
  client_explanation: "Client Explanation",
  decision_based: "Decision-Based",
};

const SYSTEM_PROMPT = `You are TJ Anderson, writing two deep, reasoning-based practice questions for ONE cosmetology term.

GLOBAL RULES (non-negotiable):
- DO NOT write a "rewrite the definition" question.
- DO NOT write a basic fill-in-the-blank.
- Each question must require THINKING, not recall.
- Questions must be specific to THIS term — never generic.
- TJ voice: confident, direct, real-world salon language. Short sentences.
- Two questions only. They MUST be of two DIFFERENT types from the rotation list provided.

QUESTION TYPES (use only these two assigned to you):
1) spot_the_mistake
   - Provide one realistic-sounding INCORRECT statement about the term.
   - Ask the learner to spot what's wrong AND correct it.
   - Required field: incorrect_statement.

2) compare_contrast
   - Pick ONE related concept/structure that is genuinely confusable with this term.
   - Ask the learner to compare them — what's the same, what's different, when do you use which.
   - Required field: compared_with (the other concept's name).

3) cause_effect
   - Ask what happens (in the body, hair, skin, salon outcome) if this concept is disrupted, missing, damaged, or skipped.
   - Should require a chain of reasoning, not a one-word answer.

4) client_explanation
   - Ask the learner to explain this concept to a real client in plain, non-jargon words.
   - Frame it as a real moment ("a client asks why…", "during a consultation…").

5) decision_based
   - Give a brief realistic salon scenario where the learner must MAKE A DECISION grounded in this concept.
   - The right answer must depend on understanding the concept, not on guessing.

EVALUATION RUBRIC (you MUST provide for each question):
- must_include: 2-4 specific concepts/keywords/ideas a correct reasoning answer must contain (semantic — the grader checks meaning, not exact wording).
- must_not_say: 1-3 common wrong claims a confused learner might say.
- sample_correct_answer: 2-4 sentences in TJ voice showing what a strong answer looks like.
- common_misconceptions: 1-3 short phrases describing how learners typically misunderstand this.

Stay tight. Stay specific. The learner should finish each question thinking, "I had to actually reason through that."`;

const schema = {
  name: "save_diversified_questions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: [...QUESTION_TYPES] },
            prompt: { type: "string" },
            incorrect_statement: { type: "string" },
            compared_with: { type: "string" },
            rubric: {
              type: "object",
              properties: {
                must_include: { type: "array", items: { type: "string" } },
                must_not_say: { type: "array", items: { type: "string" } },
                sample_correct_answer: { type: "string" },
                common_misconceptions: { type: "array", items: { type: "string" } },
              },
              required: [
                "must_include",
                "must_not_say",
                "sample_correct_answer",
                "common_misconceptions",
              ],
              additionalProperties: false,
            },
          },
          required: [
            "type",
            "prompt",
            "incorrect_statement",
            "compared_with",
            "rubric",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  },
} as const;

interface QuestionOut {
  type: QType;
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
}

/** Pick two distinct types, biased to vary from the previously-used pair so we
 *  never repeat the same combination back-to-back across consecutive terms. */
function pickRotation(prevPair: QType[] | null): [QType, QType] {
  const pool = [...QUESTION_TYPES];
  // Shuffle deterministically-ish using Math.random — single-term test scope.
  pool.sort(() => Math.random() - 0.5);
  let first = pool[0];
  let second = pool[1];
  if (prevPair && prevPair.length === 2) {
    const sameAsPrev =
      (first === prevPair[0] && second === prevPair[1]) ||
      (first === prevPair[1] && second === prevPair[0]);
    if (sameAsPrev) {
      // Swap second with the next non-conflicting type.
      for (const cand of pool.slice(2)) {
        if (cand !== first) {
          second = cand;
          break;
        }
      }
    }
  }
  return [first, second];
}

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
    const force: boolean = !!body?.force;
    const dryRun: boolean = !!body?.dry_run;
    const model: string = body?.model || DEFAULT_MODEL;
    const rotationOverride: QType[] | undefined = Array.isArray(body?.rotation)
      ? body.rotation.filter((t: string) => (QUESTION_TYPES as readonly string[]).includes(t))
      : undefined;

    if (!termId) return json({ error: "term_id is required (single-term test scope)" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: term, error: termErr } = await supabase
      .from("terms")
      .select("id, term, definition, diversified_questions")
      .eq("id", termId)
      .maybeSingle();
    if (termErr || !term) return json({ error: "Term not found" }, 404);

    const existing = (term.diversified_questions ?? {}) as Record<string, unknown>;
    if (
      !force &&
      Array.isArray((existing as { questions?: unknown }).questions) &&
      ((existing as { questions: unknown[] }).questions ?? []).length === 2
    ) {
      return json({ skipped: true, reason: "already has 2 diversified questions", term_id: termId });
    }

    // Look at the most recently-generated term for rotation memory.
    const { data: prevRow } = await supabase
      .from("terms")
      .select("diversified_questions")
      .neq("id", termId)
      .not("diversified_questions->questions", "is", null)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prevPair: QType[] | null =
      prevRow?.diversified_questions &&
      Array.isArray((prevRow.diversified_questions as any).rotation)
        ? ((prevRow.diversified_questions as any).rotation as QType[])
        : null;

    const rotation: [QType, QType] =
      rotationOverride && rotationOverride.length === 2
        ? [rotationOverride[0] as QType, rotationOverride[1] as QType]
        : pickRotation(prevPair);

    const userPrompt = [
      `TERM: ${term.term}`,
      term.definition ? `REFERENCE DEFINITION: ${term.definition}` : "",
      "",
      `ASSIGNED ROTATION (use exactly these two types, in this order):`,
      `1) ${rotation[0]}  (${TYPE_LABEL[rotation[0]]})`,
      `2) ${rotation[1]}  (${TYPE_LABEL[rotation[1]]})`,
      "",
      "If a question type does not need 'incorrect_statement' or 'compared_with', return an empty string for that field — but include the field.",
      "",
      "Generate the two questions now in TJ voice. Be specific to this term.",
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
        temperature: 0.8,
      }),
    });

    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      console.error("OpenAI error", aiResp.status, errTxt);
      return json({ error: `openai_${aiResp.status}`, detail: errTxt.slice(0, 400) }, 502);
    }

    const aiJson = await aiResp.json();
    const content: string | undefined = aiJson?.choices?.[0]?.message?.content;
    if (!content) return json({ error: "no_content" }, 502);

    let parsed: { questions: Array<Record<string, any>> };
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: "bad_json", raw: content.slice(0, 400) }, 502);
    }

    // Validate: must be 2 distinct types matching rotation.
    if (
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== 2 ||
      parsed.questions[0].type === parsed.questions[1].type
    ) {
      return json({ error: "invalid_question_set", got: parsed }, 502);
    }

    const questions: QuestionOut[] = parsed.questions.map((q) => ({
      type: q.type as QType,
      label: TYPE_LABEL[q.type as QType] ?? String(q.type),
      prompt: String(q.prompt ?? "").trim(),
      incorrect_statement:
        q.type === "spot_the_mistake" && q.incorrect_statement
          ? String(q.incorrect_statement).trim()
          : undefined,
      compared_with:
        q.type === "compare_contrast" && q.compared_with
          ? String(q.compared_with).trim()
          : undefined,
      rubric: {
        must_include: (q.rubric?.must_include ?? []).map((s: unknown) => String(s).trim()),
        must_not_say: (q.rubric?.must_not_say ?? []).map((s: unknown) => String(s).trim()),
        sample_correct_answer: String(q.rubric?.sample_correct_answer ?? "").trim(),
        common_misconceptions: (q.rubric?.common_misconceptions ?? []).map((s: unknown) =>
          String(s).trim(),
        ),
      },
    }));

    const payload = {
      version: 1,
      rotation: questions.map((q) => q.type),
      questions,
      generated_at: new Date().toISOString(),
      model,
    };

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("terms")
        .update({ diversified_questions: payload })
        .eq("id", termId);
      if (upErr) {
        console.error("update terms failed", upErr);
        return json({ error: "db_update_failed", detail: upErr.message }, 500);
      }
    }

    return json({
      ok: true,
      term_id: termId,
      term: term.term,
      rotation,
      payload,
      dry_run: dryRun,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("generate-diversified-questions error", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
