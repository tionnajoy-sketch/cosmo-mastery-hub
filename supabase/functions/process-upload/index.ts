import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, moduleId, filename } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are TJ Anderson, a cosmetology education expert. Your task is to analyze study material and extract key terms and concepts, then convert each into a structured TJ Anderson Layer Method™ learning block.

For each key term or concept you identify, generate:
1. term_title: The name of the term or concept
2. definition: A clear, professional definition in warm mentor tone
3. visualization_desc: A description of what a visual diagram or image would show for this concept
4. metaphor: A TJ-style metaphor connecting the concept to everyday beauty or life experiences. Reinforce vocabulary within the metaphor. No dashes, no slang.
5. affirmation: A grounding "I" statement that builds confidence. Example: "I understand the layers of the skin and can explain them with confidence."
6. reflection_prompt: A thought-provoking question that encourages the student to connect this concept to their career
7. quiz_question: A state board exam style question with a realistic client scenario
8. quiz_options: An array of 4 answer choices (A, B, C, D)
9. quiz_answer: The correct answer text (must match one of the quiz_options exactly)

Group terms into blocks of 5. Return valid JSON with this structure:
{
  "blocks": [
    {
      "term_title": "...",
      "definition": "...",
      "visualization_desc": "...",
      "metaphor": "...",
      "affirmation": "...",
      "reflection_prompt": "...",
      "quiz_question": "...",
      "quiz_options": ["A", "B", "C", "D"],
      "quiz_answer": "A"
    }
  ]
}

Extract 10-20 key terms from the material. Be thorough but focused on the most important concepts.`;

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
          { role: "user", content: `Please analyze the following study material from "${filename}" and convert it into TJ Anderson Layer Method learning blocks:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_tj_blocks",
              description: "Create structured TJ Anderson Layer Method learning blocks from study material",
              parameters: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        term_title: { type: "string" },
                        definition: { type: "string" },
                        visualization_desc: { type: "string" },
                        metaphor: { type: "string" },
                        affirmation: { type: "string" },
                        reflection_prompt: { type: "string" },
                        quiz_question: { type: "string" },
                        quiz_options: { type: "array", items: { type: "string" } },
                        quiz_answer: { type: "string" },
                      },
                      required: ["term_title", "definition", "metaphor", "affirmation", "reflection_prompt", "quiz_question", "quiz_options", "quiz_answer"],
                    },
                  },
                },
                required: ["blocks"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_tj_blocks" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits need to be topped up." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let blocks: any[] = [];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      blocks = parsed.blocks || [];
    } else {
      // Fallback: try to parse content directly
      const content_resp = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content_resp.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          blocks = parsed.blocks || [];
        }
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ blocks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Process upload error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
