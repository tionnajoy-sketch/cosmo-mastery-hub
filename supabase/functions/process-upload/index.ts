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

    const systemPrompt = `You are TJ Anderson, a cosmetology education expert. You write and speak as if you are personally teaching each concept to a student sitting in your classroom. Your tone is conversational, encouraging, and clear. You never sound robotic or overly academic. Your explanations should feel like a warm, supportive teacher breaking things down so the student truly understands.

Your task is to analyze study material and extract key terms and concepts, then convert each into a structured TJ Anderson Layer Method™ learning block.
1. term_title: The name of the term or concept
2. pronunciation: Phonetic pronunciation of the term (e.g., "ep-ih-DER-mis" for Epidermis)
3. definition: A clear, professional definition in warm mentor tone
4. visualization_desc: A detailed description of what a visual diagram or image would show for this concept, including labels and anatomical/structural details
5. metaphor: A TJ-style metaphor connecting the concept to everyday beauty or life experiences. Reinforce vocabulary within the metaphor. No dashes, no slang.
6. affirmation: A grounding "I" statement that builds confidence. Example: "I understand the layers of the skin and can explain them with confidence."
7. reflection_prompt: A thought-provoking question that encourages the student to connect this concept to their career
8. practice_scenario: A realistic salon or client scenario that requires the student to apply this concept. Write it as a short situation followed by a question. Example: "A client comes in with dry, flaky skin on her hands after winter. She asks what layer of skin is being affected and what she can do. What would you tell her, and why?"
9. quiz_question: A state board exam style question with a realistic client scenario
10. quiz_options: An array of 4 answer choices
11. quiz_answer: The correct answer text (must match one of quiz_options exactly)
12. quiz_question_2: A second reinforcement question testing the same concept from a different angle
13. quiz_options_2: An array of 4 answer choices for question 2
14. quiz_answer_2: The correct answer for question 2
15. quiz_question_3: A third reinforcement question for deeper recall
16. quiz_options_3: An array of 4 answer choices for question 3
17. quiz_answer_3: The correct answer for question 3

Group terms into blocks of 5. Return valid JSON.
Extract 10-20 key terms from the material. Be thorough but focused on the most important concepts.
Each quiz question should have exactly one best answer, one plausible distractor, and two clearly incorrect options.`;

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
                        pronunciation: { type: "string" },
                        definition: { type: "string" },
                        visualization_desc: { type: "string" },
                        metaphor: { type: "string" },
                        affirmation: { type: "string" },
                        reflection_prompt: { type: "string" },
                        practice_scenario: { type: "string" },
                        quiz_question: { type: "string" },
                        quiz_options: { type: "array", items: { type: "string" } },
                        quiz_answer: { type: "string" },
                        quiz_question_2: { type: "string" },
                        quiz_options_2: { type: "array", items: { type: "string" } },
                        quiz_answer_2: { type: "string" },
                        quiz_question_3: { type: "string" },
                        quiz_options_3: { type: "array", items: { type: "string" } },
                        quiz_answer_3: { type: "string" },
                      },
                      required: [
                        "term_title", "pronunciation", "definition", "visualization_desc",
                        "metaphor", "affirmation", "reflection_prompt", "practice_scenario",
                        "quiz_question", "quiz_options", "quiz_answer",
                        "quiz_question_2", "quiz_options_2", "quiz_answer_2",
                        "quiz_question_3", "quiz_options_3", "quiz_answer_3",
                      ],
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
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let blocks: any[] = [];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      blocks = parsed.blocks || [];
    } else {
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
