// TJ Anderson Layer Method™ — Guided Lesson Generator
// Generates a 5-section TJ-voice "Guided Lesson" (breakdown layer) for a term
// and caches the result per term in `term_guided_lessons`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VOICE_VERSION = "tj-v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const TJ_SYSTEM_PROMPT = `You are TJ Anderson, a real cosmetology teacher writing a Guided Lesson in your own voice for a student who has never seen this term before.

YOUR VOICE — non-negotiable:
- Conversational, clear, grounded, slightly reflective.
- You sound like a real teacher talking to a real student — not a textbook, not a robot, not an academic.
- Confident but not overwhelming. Warm. Easy to follow.
- Short sentences. Plain words. Natural rhythm. Use "you" and sometimes "we" or "I".
- Never start a section with "In this section…" or "This is about…". Just teach.

WHAT TO AVOID:
- Textbook phrasing ("It is defined as…", "Refers to…", "Pertaining to…").
- Heavy scientific or Latin/Greek jargon unless the term itself requires it — and when you must use it, immediately translate it into normal language.
- Lists of facts to memorize. We are teaching for understanding, not memorization.
- Long paragraphs. Keep each section tight.

STRUCTURE — produce ALL five sections, each 2–5 short sentences:
1. opening_breakdown — Explain the term in simple, real language as if the student has never heard it before.
2. origin_root_meaning — Break down where the word comes from in a simple way. What does it mean at its root?
3. history_context — Briefly say where this concept comes from or why it exists in cosmetology practice. Keep it relevant to real-world salon/skin/hair work.
4. guided_understanding — Walk the learner through how this works in the body or system, step by step, in a grounded way.
5. why_it_matters — Explain why a cosmetologist or esthetician needs to understand this. Bring it back to the chair, the client, real practice.

Every section must sound like the same teacher (you). Stay consistent across all terms.`;

interface GuidedLesson {
  opening_breakdown: string;
  origin_root_meaning: string;
  history_context: string;
  guided_understanding: string;
  why_it_matters: string;
}

const guidedLessonTool = {
  type: "function",
  function: {
    name: "save_guided_lesson",
    description: "Return the 5-section TJ-voice Guided Lesson for this term.",
    parameters: {
      type: "object",
      properties: {
        opening_breakdown: { type: "string", description: "Section 1 — simple, real-language explanation." },
        origin_root_meaning: { type: "string", description: "Section 2 — root/origin in plain language." },
        history_context: { type: "string", description: "Section 3 — where this comes from / why it exists in practice." },
        guided_understanding: { type: "string", description: "Section 4 — step-by-step grounded walk-through." },
        why_it_matters: { type: "string", description: "Section 5 — why it matters for a real cosmetologist." },
      },
      required: [
        "opening_breakdown",
        "origin_root_meaning",
        "history_context",
        "guided_understanding",
        "why_it_matters",
      ],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service env missing");

    const body = await req.json().catch(() => ({}));
    const termId: string | undefined = body?.term_id;
    const force: boolean = !!body?.force;
    const model: string = body?.model || DEFAULT_MODEL;

    // Inline content path (no DB lookup) — used by ingestion pipelines
    const inlineTermTitle: string | undefined = body?.term_title;
    const inlineDefinition: string | undefined = body?.definition;

    if (!termId && !inlineTermTitle) {
      return json({ error: "term_id or term_title is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let termTitle = inlineTermTitle || "";
    let definition = inlineDefinition || "";
    let breakItDown = "";
    let metaphor = "";

    if (termId) {
      // Cache hit?
      if (!force) {
        const { data: cached } = await supabase
          .from("term_guided_lessons")
          .select("*")
          .eq("term_id", termId)
          .eq("voice_version", VOICE_VERSION)
          .maybeSingle();
        if (cached && cached.opening_breakdown) {
          return json({ lesson: cached, cached: true });
        }
      }

      const { data: term, error: termErr } = await supabase
        .from("terms")
        .select("term, definition, break_it_down_content, metaphor_content")
        .eq("id", termId)
        .single();
      if (termErr || !term) {
        return json({ error: "Term not found" }, 404);
      }
      termTitle = term.term;
      definition = term.definition || "";
      breakItDown = term.break_it_down_content || "";
      metaphor = term.metaphor_content || "";
    }

    const userPrompt = [
      `TERM: ${termTitle}`,
      definition ? `DEFINITION (textbook — rewrite in your voice): ${definition}` : "",
      breakItDown ? `EXISTING WORD BREAKDOWN (reference, do not copy verbatim): ${breakItDown}` : "",
      metaphor ? `EXISTING METAPHOR (do not repeat in the lesson): ${metaphor}` : "",
      "",
      "Generate the 5-section Guided Lesson now. Stay in TJ's voice. Keep each section tight (2–5 short sentences). No textbook phrasing.",
    ]
      .filter(Boolean)
      .join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: TJ_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [guidedLessonTool],
        tool_choice: { type: "function", function: { name: "save_guided_lesson" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return json({ error: "Rate limits exceeded, please try again in a moment." }, 429);
      }
      if (aiResp.status === 402) {
        return json({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }, 402);
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI gateway error" }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response", aiJson);
      return json({ error: "AI returned no structured lesson" }, 502);
    }

    let parsed: GuidedLesson;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e, toolCall.function.arguments);
      return json({ error: "AI returned invalid lesson format" }, 502);
    }

    // Cache it (only when we have a term_id)
    let saved: any = null;
    if (termId) {
      const { data, error: upsertErr } = await supabase
        .from("term_guided_lessons")
        .upsert(
          {
            term_id: termId,
            voice_version: VOICE_VERSION,
            model_used: model,
            opening_breakdown: parsed.opening_breakdown,
            origin_root_meaning: parsed.origin_root_meaning,
            history_context: parsed.history_context,
            guided_understanding: parsed.guided_understanding,
            why_it_matters: parsed.why_it_matters,
          },
          { onConflict: "term_id,voice_version" },
        )
        .select("*")
        .single();
      if (upsertErr) {
        console.error("Cache upsert failed", upsertErr);
      } else {
        saved = data;
      }
    }

    return json({ lesson: saved || { ...parsed, term_id: termId || null }, cached: false });
  } catch (e) {
    console.error("generate-guided-lesson error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
