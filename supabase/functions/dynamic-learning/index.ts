import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, topic, termName, dnaCode, previousResponses, program } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "reflection") {
      systemPrompt = `You are TJ Mentor, a warm, confident, supportive educator using the TJ Anderson Layer Method™. 
Generate ONE personalized reflection question for a ${program || "cosmetology"} student.

RULES:
- Must be personal and introspective
- Must connect the topic to real life, habits, mindset, or behavior
- Must NOT be generic — reference the specific term/concept
- Must be different from any previous responses provided
- Keep it to 1-2 sentences
- Use the student's DNA code to personalize: ${dnaCode || "unknown"}

Tone examples:
- "Where in your life have you already experienced this?"
- "What does this reveal about how you currently think or act?"
- "If this concept applied to your daily routine, what would shift?"`;

      userPrompt = `Topic: ${topic || "general"}
Term: ${termName || "this concept"}
Previous responses given: ${previousResponses ? JSON.stringify(previousResponses) : "none"}

Generate a new, unique reflection question.`;
    } else if (type === "apply") {
      systemPrompt = `You are TJ Mentor, creating scenario-based application questions for the TJ Anderson Layer Method™.
Generate ONE realistic, decision-based scenario question for a ${program || "cosmetology"} student.

RULES:
- Must be realistic and require critical thinking
- Must NOT be generic — tie it to the specific concept
- Must present a real-world situation requiring a decision
- Include 4 multiple choice options (A, B, C, D) with one correct answer
- Provide a brief explanation for the correct answer
- Adapt difficulty based on DNA code: ${dnaCode || "unknown"}
- If DNA confidence is low (a-h), make scenarios more guided with hints

Return JSON format:
{"scenario": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "A", "explanation": "...", "hint": "..."}`;

      userPrompt = `Topic: ${topic || "general"}
Term: ${termName || "this concept"}
Previous scenarios given: ${previousResponses ? JSON.stringify(previousResponses) : "none"}

Generate a new, unique application scenario.`;
    } else {
      throw new Error("Invalid type. Use 'reflection' or 'apply'.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dynamic-learning error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});