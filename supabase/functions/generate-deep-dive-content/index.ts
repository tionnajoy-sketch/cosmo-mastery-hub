// TJ Anderson Layer Method™ — Deep Dive with TJ Generator
// Generates an optional, story-driven "Deep Dive" section for a term
// and caches the result on public.terms.deep_dive_content.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VOICE_VERSION = "tj-deep-dive-v1";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const TJ_SYSTEM_PROMPT = `You are TJ Anderson, a real cosmetology teacher writing a "Deep Dive with TJ" — an OPTIONAL, story-driven extension for a learner who already finished the main lesson and wants to go deeper.

YOUR VOICE — non-negotiable:
- Story-driven. Emotionally engaging. Real-world. You sound like TJ pulling a student aside at the chair to share something most teachers skip.
- Confident, warm, grounded. Plain words. Short sentences. Use "you" and sometimes "I".
- Never sound like a textbook, a robot, or a study guide.
- Never start a section with "In this section…" or "This is about…". Just teach.

WHAT TO AVOID:
- Repeating the basic definition or the main-lesson breakdown. The learner already has those.
- Generic motivational fluff. Every sentence must teach or connect.
- Long paragraphs. Keep each section tight and visual.

STRUCTURE — produce ALL seven fields:

1. hook — A 2–4 sentence story-based entry point. Open with a real moment: a client in your chair, a stylist who got it wrong, a memory from school, a scene from the salon floor. Pull the learner in emotionally before you teach.

2. expanded_breakdown — 3–6 short sentences of detailed teaching that goes BEYOND the main lesson. Reveal the "why behind the why" — the deeper mechanism, the nuance, the part most students miss. Stay grounded in real cosmetology practice.

3. analogy — A vivid real-world or conceptual bridge (2–4 sentences). Compare the concept to something the learner already understands from outside the salon (cooking, weather, a relationship, a phone, a building). Make it stick.

4. challenge — A short critical-thinking or applied logic challenge (1 question + 1–2 sentence prompt). If the term involves numbers, ratios, timing, dilutions, pH, percentages, or measurements, make it quantitative. If not, make it a real-world decision puzzle ("A client walks in with X — what would you do and why?"). NEVER skip this — always include some form of logic challenge.

5. memory_cue — A visual or phrase-based anchor the learner can picture instantly. NOT a generic mnemonic like "think CHEEKBONES". Use sensory imagery tied to a real salon moment ("Picture the way conditioner beads on the cuticle layer — that's…"). 1–2 sentences.

6. why_it_matters — Connect this concept to the learner's life and career (2–4 sentences). Why does mastering THIS specific concept change how they show up as a professional? What does a stylist who gets this look like vs one who doesn't?

7. mentor_check_in — A single reflection or critical-thinking prompt from TJ to the learner. Not a quiz. A real question that makes them pause and think. ("If a new stylist asked you why this matters in 10 seconds — what would you say?")

Every section must sound like the same teacher. Story-driven, emotionally engaging, real-world.`;

interface DeepDive {
  hook: string;
  expanded_breakdown: string;
  analogy: string;
  challenge: string;
  memory_cue: string;
  why_it_matters: string;
  mentor_check_in: string;
}

const deepDiveTool = {
  type: "function",
  function: {
    name: "save_deep_dive",
    description: "Return the 7-section TJ-voice Deep Dive for this term.",
    parameters: {
      type: "object",
      properties: {
        hook: { type: "string", description: "Story-based entry point (2–4 sentences)." },
        expanded_breakdown: { type: "string", description: "Detailed teaching that goes beyond the main lesson (3–6 sentences)." },
        analogy: { type: "string", description: "Real-world or conceptual bridge (2–4 sentences)." },
        challenge: { type: "string", description: "Quantitative or logic challenge — always included (1 question + brief prompt)." },
        memory_cue: { type: "string", description: "Visual or phrase-based anchor tied to a real salon moment (1–2 sentences)." },
        why_it_matters: { type: "string", description: "Life and career connection (2–4 sentences)." },
        mentor_check_in: { type: "string", description: "A single reflection or critical-thinking prompt from TJ." },
      },
      required: [
        "hook",
        "expanded_breakdown",
        "analogy",
        "challenge",
        "memory_cue",
        "why_it_matters",
        "mentor_check_in",
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

    const inlineTermTitle: string | undefined = body?.term_title;
    const inlineDefinition: string | undefined = body?.definition;

    if (!termId && !inlineTermTitle) {
      return json({ error: "term_id or term_title is required" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let termTitle = inlineTermTitle || "";
    let definition = inlineDefinition || "";
    let breakItDown = "";
    let information = "";

    if (termId) {
      const { data: term } = await supabase
        .from("terms")
        .select("term, definition, break_it_down_content, information_content, deep_dive_content")
        .eq("id", termId)
        .maybeSingle();

      if (term) {
        // Cache hit (only if voice_version matches)
        if (!force && term.deep_dive_content && (term.deep_dive_content as any)?.voice_version === VOICE_VERSION) {
          return json({ deep_dive: term.deep_dive_content, cached: true });
        }
        termTitle = term.term;
        definition = term.definition || "";
        breakItDown = term.break_it_down_content || "";
        information = term.information_content || "";
      } else if (!inlineTermTitle) {
        return json({ error: "Term not found and no inline term_title provided" }, 404);
      }
    }

    const userPrompt = [
      `TERM: ${termTitle}`,
      definition ? `DEFINITION (do not repeat verbatim — go deeper): ${definition}` : "",
      breakItDown ? `MAIN-LESSON BREAKDOWN (already taught — do not repeat): ${breakItDown}` : "",
      information ? `MAIN-LESSON INFO (already taught — do not repeat): ${information.slice(0, 800)}` : "",
      "",
      "Generate the 7-section Deep Dive with TJ now. Stay in TJ's story-driven voice. Always include a logic or quantitative challenge. Do not repeat the main lesson.",
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
        tools: [deepDiveTool],
        tool_choice: { type: "function", function: { name: "save_deep_dive" } },
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
      return json({ error: "AI returned no structured deep dive" }, 502);
    }

    let parsed: DeepDive;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool args", e, toolCall.function.arguments);
      return json({ error: "AI returned invalid format" }, 502);
    }

    const deepDivePayload = {
      ...parsed,
      voice_version: VOICE_VERSION,
      model_used: model,
      generated_at: new Date().toISOString(),
    };

    if (termId) {
      const { error: updateErr } = await supabase
        .from("terms")
        .update({ deep_dive_content: deepDivePayload })
        .eq("id", termId);
      if (updateErr) {
        console.error("Cache update failed", updateErr);
      }
    }

    return json({ deep_dive: deepDivePayload, cached: false });
  } catch (e) {
    console.error("generate-deep-dive-content error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
