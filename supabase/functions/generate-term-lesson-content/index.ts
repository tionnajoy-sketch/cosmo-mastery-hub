// TJ Anderson Layer Method™ — One-Shot Term Lesson Content Generator
//
// Generates and persists FOUR pieces of structured lesson content per term,
// directly into the `terms` table. Skips terms that already have content
// unless `force: true`. After this runs, the app renders cached fields with
// ZERO live AI calls.
//
// 1) BREAK DOWN  → terms.break_it_down_content (root, prefix/suffix, plain breakdown)
// 2) INFORMATION → terms.information_content   (TJ teaching style + memory anchor)
// 3) APPLY       → terms.apply_content         (own-words prompt, TJ Anderson Layer Method)
// 4) ASSESS      → terms.assess_question + assess_answer + assess_explanation

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "gpt-4o-mini";

const TJ_SYSTEM_PROMPT = `You are TJ Anderson, a real cosmetology teacher writing structured lesson content in your own voice for a student who has never seen this term before.

YOUR VOICE — non-negotiable (TONE LOCK):
- Confident. Clear. Real-world. Never textbook.
- You sound like a real teacher talking to a real student — grounded, warm, slightly reflective.
- Short sentences. Plain words. Use "you" and sometimes "we" or "I".
- Never start with "In this section…" or "This is about…". Just teach.
- Prioritize UNDERSTANDING over memorization.
- The goal for every term: the learner should think "Oh… I actually get this now."

WHAT TO AVOID:
- Textbook phrasing ("It is defined as…", "Refers to…", "Pertaining to…").
- Heavy scientific/Latin/Greek jargon unless the term itself requires it — and when you must use it, immediately translate it.
- Lists of facts to memorize. Teach for understanding.
- Long paragraphs. Keep things tight.
- Basic mnemonics like "ROY G BIV" or label-based anchors like "Think CHEEKBONES." Those are LAZY anchors — banned.
- Generic salon framing like "When a client sits in your chair…" with nothing specific after it. Banned.
- Repeating the same Apply intro across terms.

YOU MUST PRODUCE FOUR THINGS:

1) BREAK DOWN (Anatomy of the Word):
   - root_meaning: the literal meaning of the root(s), one sentence.
   - prefix_suffix: any prefix/suffix and what it means, one sentence. If none, write "No prefix or suffix worth breaking down — the root carries the meaning."
   - word_origin: where the word comes from (Greek, Latin, French, modern, etc.), one sentence.
   - simple_breakdown: split the word into pieces and translate each in plain language. 2–4 short sentences.

2) INFORMATION (TJ Teaching Style — full lesson):
   Four short, clearly-separated parts:
   - what_it_is: what the term is in plain words, like you're sitting next to the student. 2–3 short sentences.
   - why_it_matters: why this matters in real cosmetology practice (chair, client, salon, license). 2–3 short sentences.
   - real_client_scenario: A REAL "in the chair" moment. Not generic. MUST include:
       (a) a specific client condition or feature (e.g., cystic acne along the jawline, dehydrated skin after winter, hyperpigmentation on the cheeks, fine baby hairs at the hairline, color-treated brittle ends, mature skin with crepey texture under the eyes, oily T-zone),
       (b) what YOU as the stylist are noticing or observing,
       (c) the decision you're making because of this term (product choice, technique change, area to avoid, area to focus, referral, etc.).
       3–5 short sentences. NEVER open with "When a client sits in your chair…". Open with the observation, the feature, or the moment.
   - memory_anchor: a SENSORY, VISUAL, REAL-WORLD hook tied to a specific cosmetology moment.
       MUST be:
       • Visual — something the learner can picture instantly in the salon (placement of a brush, where light hits, how skin feels, where a product goes).
       • Emotional or sensory — touch, appearance, feeling, sight, sound.
       • Connected to a real cosmetology moment (highlighting, draping, shampooing, sectioning, contouring, etc.).
       BANNED: "Think [WORD]." style anchors. Banned: defining the word again.
       GOOD example for "Zygomatic Bones": "Picture exactly where you place highlighter to make a client glow — that shimmer sits right on the zygomatic bones. Every time you contour a cheek, you're drawing a line around them."
       GOOD example for "Sebum": "Think of that mid-day shine on a client's forehead before a touch-up — that's sebum showing up. You can almost feel it on a tissue when you blot."
       2–4 short sentences. Lead with the picture, the moment, or the sensation — not with a label.

3) APPLY (TJ Anderson Layer Method — practice thinking like a pro):
   This section is where the learner stops studying and starts THINKING like a working stylist.

   - apply_intro: ONE short TJ-voice line that opens the practice moment.
       HARD RULES:
       • DO NOT use patterned/recycled openers. Banned phrases include (but not limited to): "Let's break this down…", "Let's bring this into the salon…", "Here's where this clicks…", "Now connect this to your real work…", "Okay — say it back to me…", "This is the part where it sticks…", "Apply the TJ Anderson Layer Method…", "In your own words…".
       • Make it feel like a unique coaching moment for THIS specific term — reference the term's real context (the chair, the product, the skin, the hair, the bone, the tool, the client situation).
       • One line. Confident. Direct. No fluff. No throat-clearing.
       • Examples of the vibe (DO NOT COPY — each term gets its own line): "Walk me through what you'd actually do here.", "Pretend the client is in the chair right now.", "You just spotted this on a consultation — go.", "A new stylist is shadowing you. Teach as you work."

   - apply_q1, apply_q2, apply_q3: THREE different practice questions.
       CRITICAL — DIVERSIFY THE THINKING. Each of the three questions MUST use a DIFFERENT thinking task, picked from this menu:
         • EXPLAIN  — teach it simply (to a client, a new stylist, a friend)
         • DECIDE   — what would you do in this situation?
         • IDENTIFY — what are you noticing / what do you see?
         • CORRECT  — what went wrong and how do you fix it?
         • COMPARE  — this vs that, when do you use which?
         • PREDICT  — what's going to happen next if…?
         • CONNECT  — tie this to another concept / another step in the service
       Pick the THREE thinking tasks that fit THIS term best. Rotate across terms — do not default to the same three every time.

       For each question:
       • Frame it like real salon work. The learner is in the chair, on a consultation, mid-service, or coaching another stylist.
       • Use specific scenarios when possible — "A client says her scalp itches after every shampoo — what are you noticing?" beats "What is this in your own words?"
       • TJ voice: confident, direct, practical. No "please" or "kindly". No fluff.
       • One question per item. Don't stack multiple questions inside one.

       For each question, also return its task type label (one of: Explain, Decide, Identify, Correct, Compare, Predict, Connect) so the UI can show it.

       NEVER use the old generic trio:
         1) "What is this in your own words?"
         2) "Why is it important?"
         3) "How would you explain it?"
       That pattern is BANNED.

       The learner should finish this section thinking: "I'm not just studying — I'm practicing thinking like a professional."

4) ASSESS (One state-board-style question):
   - assess_question: a clear scenario or knowledge-check question. One question only. Prefer scenario-style ("A client comes in with…").
   - choice_a, choice_b, choice_c, choice_d: four plausible options. Only ONE correct. Distractors must be realistic, not silly.
   - correct_choice: exactly one of "A", "B", "C", "D".
   - assess_explanation: 2–4 short sentences explaining why the correct answer is correct, and briefly why the others are not. TJ voice.

Stay consistent across all terms. Same voice every time. The learner should finish each term thinking: "Oh… I actually get this now."`;

const lessonJsonSchema = {
  name: "save_term_lesson",
  strict: true,
  schema: {
    type: "object",
    properties: {
      // Break Down
      root_meaning: { type: "string" },
      prefix_suffix: { type: "string" },
      word_origin: { type: "string" },
      simple_breakdown: { type: "string" },
      // Information
      what_it_is: { type: "string" },
      why_it_matters: { type: "string" },
      real_client_scenario: { type: "string" },
      memory_anchor: { type: "string" },
      // Apply
      apply_intro: { type: "string" },
      apply_q1: { type: "string" },
      apply_q2: { type: "string" },
      apply_q3: { type: "string" },
      // Assess
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
      "prefix_suffix",
      "word_origin",
      "simple_breakdown",
      "what_it_is",
      "why_it_matters",
      "real_client_scenario",
      "memory_anchor",
      "apply_intro",
      "apply_q1",
      "apply_q2",
      "apply_q3",
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
  prefix_suffix: string;
  word_origin: string;
  simple_breakdown: string;
  what_it_is: string;
  why_it_matters: string;
  real_client_scenario: string;
  memory_anchor: string;
  apply_intro: string;
  apply_q1: string;
  apply_q2: string;
  apply_q3: string;
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
    const termIds: string[] | undefined = Array.isArray(body?.term_ids) ? body.term_ids : undefined;
    const batch: boolean = !!body?.batch;
    const limit: number = Math.max(1, Math.min(25, Number(body?.limit ?? 10)));
    const force: boolean = !!body?.force;
    const dryRun: boolean = !!body?.dry_run;
    const model: string = body?.model || DEFAULT_MODEL;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve target list
    let targets: Array<{ id: string; term: string; definition: string | null }> = [];
    if (termId) {
      const { data, error } = await supabase
        .from("terms")
        .select("id, term, definition, break_it_down_content, information_content, apply_content, assess_question")
        .eq("id", termId)
        .maybeSingle();
      if (error || !data) return json({ error: "Term not found" }, 404);
      const hasAll = !!(
        data.break_it_down_content &&
        data.information_content &&
        data.apply_content &&
        data.assess_question
      );
      if (hasAll && !force) return json({ skipped: true, reason: "already has content", term_id: termId });
      targets = [{ id: data.id, term: data.term, definition: data.definition }];
    } else if (termIds && termIds.length > 0) {
      const { data, error } = await supabase
        .from("terms")
        .select("id, term, definition")
        .in("id", termIds);
      if (error) throw error;
      targets = (data ?? []) as never;
    } else if (batch) {
      let q = supabase.from("terms").select("id, term, definition").order("term").limit(limit);
      if (!force) {
        // Only terms missing any of the four fields
        q = q.or(
          [
            "break_it_down_content.is.null",
            "break_it_down_content.eq.",
            "information_content.is.null",
            "information_content.eq.",
            "apply_content.is.null",
            "apply_content.eq.",
            "assess_question.is.null",
            "assess_question.eq.",
          ].join(","),
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      targets = (data ?? []) as never;
    } else {
      return json({ error: "Provide term_id, term_ids, or batch:true" }, 400);
    }

    const results: Array<{
      term_id: string;
      term: string;
      status: "ok" | "error";
      error?: string;
      preview?: {
        break_it_down_content: string;
        information_content: string;
        apply_content: string;
        assess_question: string;
        assess_answer: string;
        assess_explanation: string;
      };
    }> = [];

    for (const t of targets) {
      try {
        const userPrompt = [
          `TERM: ${t.term}`,
          t.definition ? `DEFINITION (textbook reference — rewrite in your voice): ${t.definition}` : "",
          "",
          "Generate the Break Down, Information (with memory anchor), Apply (own-words prompts), and Assess content now. Stay in TJ's voice. Keep things tight. The Assess question must be state-board style with exactly one correct option.",
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

        // 1) BREAK DOWN
        const breakDown = [
          `**Root meaning:** ${parsed.root_meaning.trim()}`,
          `**Prefix / suffix:** ${parsed.prefix_suffix.trim()}`,
          `**Where it comes from:** ${parsed.word_origin.trim()}`,
          `**Plain-language breakdown:** ${parsed.simple_breakdown.trim()}`,
        ].join("\n\n");

        // 2) INFORMATION (TJ Teaching Style + Memory Anchor)
        const information = [
          `**What it is**\n\n${parsed.what_it_is.trim()}`,
          `**Why it matters in practice**\n\n${parsed.why_it_matters.trim()}`,
          `**In the chair — real client moment**\n\n${parsed.real_client_scenario.trim()}`,
          `**TJ Memory Anchor**\n\n${parsed.memory_anchor.trim()}`,
        ].join("\n\n");

        // 3) APPLY (TJ Anderson Layer Method — own words)
        const apply = [
          `**Apply the TJ Anderson Layer Method**`,
          ``,
          parsed.apply_intro.trim(),
          ``,
          `In your own words:`,
          ``,
          `1. ${parsed.apply_q1.trim()}`,
          ``,
          `2. ${parsed.apply_q2.trim()}`,
          ``,
          `3. ${parsed.apply_q3.trim()}`,
          ``,
          `*(Short answer box or voice input)*`,
        ].join("\n");

        // 4) ASSESS
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

        if (dryRun) {
          results.push({
            term_id: t.id,
            term: t.term,
            status: "ok",
            preview: {
              break_it_down_content: breakDown,
              information_content: information,
              apply_content: apply,
              assess_question: assessQ,
              assess_answer: assessAnswer,
              assess_explanation: parsed.assess_explanation.trim(),
            },
          });
          continue;
        }

        const { error: updErr } = await supabase
          .from("terms")
          .update({
            break_it_down_content: breakDown,
            information_content: information,
            apply_content: apply,
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
