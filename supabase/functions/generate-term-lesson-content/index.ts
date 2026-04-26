// TJ Anderson Layer Method™ — One-Shot Term Lesson Content Generator
//
// Generates and persists three pieces of structured lesson content per term,
// directly into the `terms` table. Skips terms that already have content
// unless `force: true`. After this runs, the app renders cached fields with
// ZERO live AI calls.
//
// 1) BREAK DOWN  → terms.break_it_down_content (root, origin, plain breakdown)
// 2) INFORMATION → terms.information_content   (what / does / why it matters)
// 3) ASSESS      → terms.assess_question + assess_answer + assess_explanation

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "gpt-4o-mini";

const TJ_SYSTEM_PROMPT = `You are TJ Anderson, a real cosmetology teacher writing structured lesson content in your own voice for a student who has never seen this term before.

YOUR VOICE — non-negotiable:
- Conversational, clear, grounded, simple, confident, slightly reflective.
- You sound like a real teacher talking to a real student — not a textbook, not a robot, not academic.
- Short sentences. Plain words. Use "you" and sometimes "we" or "I".
- Never start with "In this section…" or "This is about…". Just teach.

WHAT TO AVOID:
- Textbook phrasing ("It is defined as…", "Refers to…", "Pertaining to…").
- Heavy scientific/Latin/Greek jargon unless the term itself requires it — and when you must use it, immediately translate it.
- Lists of facts to memorize. Teach for understanding.
- Long paragraphs. Keep things tight.

YOU MUST PRODUCE THREE THINGS:

1) BREAK DOWN (Anatomy of the Word) — 3 short fields:
   - root_meaning: the literal meaning of the root(s), one sentence.
   - word_origin: where the word comes from (Greek, Latin, French, modern, etc.), one sentence.
   - simple_breakdown: split the word into pieces and translate each in plain language. 2–4 short sentences.

2) INFORMATION (Full Lesson) — one tight teaching paragraph (5–9 short sentences) covering:
   - what the term is in plain words,
   - what it does,
   - why it matters in real-world cosmetology (chair, client, salon).
   Conversational. TJ voice. No headings inside this field. No bullet points. No textbook tone.

3) ASSESS (One state-board-style question):
   - assess_question: a clear scenario or knowledge-check question. One question only.
   - choice_a, choice_b, choice_c, choice_d: four plausible options. Only ONE correct.
   - correct_choice: exactly one of "A", "B", "C", "D".
   - assess_explanation: 2–4 short sentences explaining why the correct answer is correct, and briefly why the others are not. TJ voice.

Stay consistent across all terms.`;

const lessonJsonSchema = {
  name: "save_term_lesson",
  strict: true,
  schema: {
    type: "object",
    properties: {
      root_meaning: { type: "string" },
      word_origin: { type: "string" },
      simple_breakdown: { type: "string" },
      information: { type: "string" },
      assess_question: { type: "string" },
      choice_a: { type: "string" },
      choice_b: { type: "string" },
      choice_c: { type: "string" },
      choice_d: { type: "string" },
      correct_choice: { type: "string", enum: ["A", "B", "C", "D"] },
      assess_explanation: { type: "string" },
    },
    required: [
      "root_meaning",
      "word_origin",
      "simple_breakdown",
      "information",
      "assess_question",
      "choice_a",
      "choice_b",
      "choice_c",
      "choice_d",
      "correct_choice",
      "assess_explanation",
    ],
    additionalProperties: false,
  },
} as const;

interface LessonPayload {
  root_meaning: string;
  word_origin: string;
  simple_breakdown: string;
  information: string;
  assess_question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: "A" | "B" | "C" | "D";
  assess_explanation: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service env missing");

    const body = await req.json().catch(() => ({}));
    const termId: string | undefined = body?.term_id;
    const batch: boolean = !!body?.batch;
    const limit: number = Math.max(1, Math.min(25, Number(body?.limit ?? 10)));
    const force: boolean = !!body?.force;
    const model: string = body?.model || DEFAULT_MODEL;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve target list
    let targets: Array<{ id: string; term: string; definition: string | null }> = [];
    if (termId) {
      const { data, error } = await supabase
        .from("terms")
        .select("id, term, definition, break_it_down_content, information_content, assess_question")
        .eq("id", termId)
        .maybeSingle();
      if (error || !data) return json({ error: "Term not found" }, 404);
      const hasAll = !!(data.break_it_down_content && data.information_content && data.assess_question);
      if (hasAll && !force) return json({ skipped: true, reason: "already has content", term_id: termId });
      targets = [{ id: data.id, term: data.term, definition: data.definition }];
    } else if (batch) {
      let q = supabase.from("terms").select("id, term, definition").order("term").limit(limit);
      if (!force) {
        // Only terms missing any of the three fields
        q = q.or("break_it_down_content.is.null,break_it_down_content.eq.,information_content.is.null,information_content.eq.,assess_question.is.null,assess_question.eq.");
      }
      const { data, error } = await q;
      if (error) throw error;
      targets = (data ?? []) as never;
    } else {
      return json({ error: "Provide term_id or batch:true" }, 400);
    }

    const results: Array<{ term_id: string; term: string; status: "ok" | "error"; error?: string }> = [];

    for (const t of targets) {
      try {
        const userPrompt = [
          `TERM: ${t.term}`,
          t.definition ? `DEFINITION (textbook reference — rewrite in your voice): ${t.definition}` : "",
          "",
          "Generate the Break Down, Information, and Assess content now. Stay in TJ's voice. Keep things tight. The Assess question must be state-board style with exactly one correct option.",
        ].filter(Boolean).join("\n");

        const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: TJ_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_schema", json_schema: lessonJsonSchema },
            temperature: 0.7,
          }),
        });

        if (!aiResp.ok) {
          const errTxt = await aiResp.text();
          console.error("OpenAI error", aiResp.status, errTxt);
          if (aiResp.status === 429) {
            results.push({ term_id: t.id, term: t.term, status: "error", error: "rate_limited" });
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          if (aiResp.status === 401) {
            results.push({ term_id: t.id, term: t.term, status: "error", error: "invalid_api_key" });
            break;
          }
          if (aiResp.status === 402 || aiResp.status === 403) {
            results.push({ term_id: t.id, term: t.term, status: "error", error: "billing_or_access" });
            break;
          }
          results.push({ term_id: t.id, term: t.term, status: "error", error: `openai_${aiResp.status}` });
          continue;
        }

        const aiJson = await aiResp.json();
        const content: string | undefined = aiJson?.choices?.[0]?.message?.content;
        if (!content) {
          results.push({ term_id: t.id, term: t.term, status: "error", error: "no_content" });
          continue;
        }
        let parsed: LessonPayload;
        try { parsed = JSON.parse(content); }
        catch { results.push({ term_id: t.id, term: t.term, status: "error", error: "bad_json" }); continue; }

        const breakDown = [
          `**Root meaning:** ${parsed.root_meaning.trim()}`,
          `**Where it comes from:** ${parsed.word_origin.trim()}`,
          `**Plain-language breakdown:** ${parsed.simple_breakdown.trim()}`,
        ].join("\n\n");

        const correctText =
          parsed.correct_choice === "A" ? parsed.choice_a :
          parsed.correct_choice === "B" ? parsed.choice_b :
          parsed.correct_choice === "C" ? parsed.choice_c :
          parsed.choice_d;

        const assessQ = [
          parsed.assess_question.trim(),
          "",
          `A) ${parsed.choice_a.trim()}`,
          `B) ${parsed.choice_b.trim()}`,
          `C) ${parsed.choice_c.trim()}`,
          `D) ${parsed.choice_d.trim()}`,
        ].join("\n");

        const assessAnswer = `${parsed.correct_choice}) ${correctText.trim()}`;

        const { error: updErr } = await supabase
          .from("terms")
          .update({
            break_it_down_content: breakDown,
            information_content: parsed.information.trim(),
            assess_question: assessQ,
            assess_answer: assessAnswer,
            assess_explanation: parsed.assess_explanation.trim(),
          })
          .eq("id", t.id);

        if (updErr) {
          console.error("Update failed for term", t.id, updErr);
          results.push({ term_id: t.id, term: t.term, status: "error", error: "db_update_failed" });
          continue;
        }

        results.push({ term_id: t.id, term: t.term, status: "ok" });
      } catch (e) {
        console.error("Term failed", t.id, e);
        results.push({ term_id: t.id, term: t.term, status: "error", error: e instanceof Error ? e.message : "unknown" });
      }
    }

    const ok = results.filter((r) => r.status === "ok").length;
    return json({ processed: results.length, ok, results });
  } catch (e) {
    console.error("generate-term-lesson-content error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
