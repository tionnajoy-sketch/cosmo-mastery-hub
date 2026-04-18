// Adaptive Reinforcement Loop — generates a micro-lesson + harder re-test question
// for a missed concept, using a different teaching approach than the original.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReqBody {
  term?: string;
  definition?: string;
  metaphor?: string;
  missedQuestion?: string;
  missedAnswerExplanation?: string;
  cycle?: number; // 1, 2, 3 — increases difficulty
  approachHint?: string; // "metaphor" | "application" | "simplified"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body: ReqBody = await req.json();
    const cycle = Math.max(1, Math.min(3, body.cycle ?? 1));
    const approach =
      body.approachHint ||
      (cycle === 1 ? "metaphor" : cycle === 2 ? "application" : "simplified");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway key missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const difficultyLabel =
      cycle === 1 ? "recognition" : cycle === 2 ? "application" : "scenario-based";

    const systemPrompt = `You are TJ Anderson, a calm and supportive learning coach.
A student just missed a quiz question. Your job:
1) Re-teach the SPECIFIC concept they missed using a "${approach}" approach (different from the original explanation).
2) Generate ONE NEW quiz question on the same concept at "${difficultyLabel}" difficulty.
3) The new question must NOT reuse the wording or distractors of the original. Make distractors realistic and conceptually close so the student can't memorize the pattern.
4) Keep the micro-lesson short (3–5 sentences), warm, and focused.
Return STRICT JSON only, no markdown:
{
  "microLesson": "string",
  "question": "string",
  "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
  "correctOption": "A" | "B" | "C" | "D",
  "explanation": "string"
}`;

    const userPrompt = `Term: ${body.term ?? "Unknown"}
Definition: ${body.definition ?? ""}
Metaphor (original): ${body.metaphor ?? ""}
Original missed question: ${body.missedQuestion ?? ""}
Original explanation: ${body.missedAnswerExplanation ?? ""}
Reinforcement cycle: ${cycle} of 3 (difficulty: ${difficultyLabel}, approach: ${approach})`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit — try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error", detail: txt }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      parsed = { microLesson: String(content), question: "", options: {}, correctOption: "A", explanation: "" };
    }

    return new Response(
      JSON.stringify({ ...parsed, cycle, approach, difficulty: difficultyLabel }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
