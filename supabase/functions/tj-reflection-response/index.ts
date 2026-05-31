// TJ Anderson Layer Method™ — Contextual Reflection Response
// Takes a student's reflection on a lesson and replies in TJ's voice with a
// 3-part response: mirror → affirm → next nudge.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_MODEL = "google/gemini-2.5-flash";

const TJ_SYSTEM_PROMPT = `You are TJ Anderson, a real cosmetology teacher responding directly to a student's reflection on a lesson.

YOUR VOICE — non-negotiable:
- Warm, calm, human. You talk like a real teacher who cares — not a chatbot, not a coach giving generic affirmations.
- Short sentences. Plain words. First-person where natural.
- Specific to what the student actually wrote. Reference their words or their meaning. Never generic.

STRUCTURE — produce all 3 sections, each 1–3 short sentences:
1. mirror — Reflect back what you heard them say in your own words. Show them you actually read it.
2. affirm — Name what they already understand or what's strong in their thinking. Be honest, not flattering.
3. next_nudge — Give them one small, concrete next move tied to this lesson (a question to sit with, a thing to notice, a person to think about). Not homework. A nudge.

Never say "Great reflection!" or "Wonderful job!" — TJ doesn't talk like that.`;

const reflectionTool = {
  type: "function",
  function: {
    name: "save_reflection_response",
    description: "Return TJ's 3-part response to a student reflection.",
    parameters: {
      type: "object",
      properties: {
        mirror: { type: "string", description: "1–3 sentences mirroring what the student said." },
        affirm: { type: "string", description: "1–3 sentences naming what's strong." },
        next_nudge: { type: "string", description: "1–3 sentences with one concrete next move." },
      },
      required: ["mirror", "affirm", "next_nudge"],
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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const lessonSlug: string = body?.lesson_slug ?? "";
    const lessonTitle: string = body?.lesson_title ?? lessonSlug;
    const prompt: string = body?.prompt ?? "";
    const reflection: string = (body?.reflection ?? "").toString().slice(0, 2000);
    const model: string = body?.model || DEFAULT_MODEL;

    if (!reflection.trim()) {
      return json({ error: "reflection is required" }, 400);
    }

    const userPrompt = [
      `LESSON: ${lessonTitle}`,
      prompt ? `REFLECTION PROMPT THE STUDENT ANSWERED: ${prompt}` : "",
      `STUDENT'S REFLECTION: """${reflection}"""`,
      "",
      "Respond now in TJ's voice using the 3-part structure. Be specific to what they wrote.",
    ].filter(Boolean).join("\n");

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
        tools: [reflectionTool],
        tool_choice: { type: "function", function: { name: "save_reflection_response" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return json({ error: "Rate limits exceeded, try again in a moment." }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json({ error: "AI gateway error" }, 502);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "AI returned no structured response" }, 502);
    }

    let parsed: { mirror: string; affirm: string; next_nudge: string };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ error: "AI returned invalid format" }, 502);
    }

    return json({ response: parsed });
  } catch (e) {
    console.error("tj-reflection-response error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
