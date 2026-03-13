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

Your task is to analyze study material and classify each section or slide into one of these categories:

CLASSIFICATION RULES:
1. **concept** — Terminology slides with bullet-point explanations, definitions, or descriptive content. Convert these into full TJ Anderson Layer Method™ study blocks.
2. **visual** — Slides containing charts, diagrams, comparison tables, category breakdowns, or visual learning aids. Convert these into TJ Blocks with an enhanced visualization_desc that preserves the chart/diagram structure in text form, plus generate a practice question about the visual.
3. **quiz** — Slides containing exam-style questions, multiple choice review questions, or test prep questions. Extract these into structured quiz bank format. Do NOT convert quiz slides into TJ Blocks.
4. **handwritten_note** — Any annotations, handwritten notes, or informal comments detected on slides (e.g., "could be asymptomatic", "remember this!", instructor margin notes). Attach these as instructor_notes to the nearest related concept block.

For each CONCEPT or VISUAL block, generate:
1. term_title: The name of the term or concept
2. pronunciation: Phonetic pronunciation (e.g., "ep-ih-DER-mis")
3. definition: A clear, professional definition in warm mentor tone
4. visualization_desc: A detailed description of what a visual diagram or image would show. For visual slides, preserve the chart/diagram structure in rich detail.
5. metaphor: A TJ-style metaphor connecting the concept to everyday beauty or life experiences. Reinforce vocabulary within the metaphor. No dashes, no slang.
6. affirmation: A grounding "I" statement that builds confidence.
7. reflection_prompt: A thought-provoking question connecting the concept to their career
8. practice_scenario: A realistic salon or client scenario requiring the student to apply this concept
9. quiz_question: A state board exam style question with a realistic client scenario
10. quiz_options: An array of 4 answer choices
11. quiz_answer: The correct answer text (must match one of quiz_options exactly)
12. quiz_question_2: A second reinforcement question from a different angle
13. quiz_options_2: An array of 4 answer choices for question 2
14. quiz_answer_2: The correct answer for question 2
15. quiz_question_3: A third reinforcement question for deeper recall
16. quiz_options_3: An array of 4 answer choices for question 3
17. quiz_answer_3: The correct answer for question 3
18. slide_type: "concept" or "visual"
19. instructor_notes: Any detected handwritten annotations or margin notes related to this concept. Leave empty string if none.
20. image_description: A detailed description of a diagram that should be generated for this concept, including labels, anatomical details, and structural relationships.

For each QUIZ slide, extract into quiz_bank_questions:
- question_text: The question as written
- option_a, option_b, option_c, option_d: The four answer choices
- correct_option: The letter of the correct answer (A, B, C, or D)
- explanation: A warm, supportive explanation of why the correct answer is right
- source_slide: The approximate slide number if detectable

Group concept/visual terms into blocks of 5. Return valid JSON.
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
          { role: "user", content: `Please analyze the following study material from "${filename}" and convert it into TJ Anderson Layer Method learning blocks. Classify each section as concept, visual, quiz, or handwritten_note:\n\n${content}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_tj_blocks",
              description: "Create structured TJ Anderson Layer Method learning blocks and extract quiz bank questions from study material",
              parameters: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    description: "Concept and visual blocks converted into TJ learning blocks",
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
                        slide_type: { type: "string", enum: ["concept", "visual"] },
                        instructor_notes: { type: "string" },
                        image_description: { type: "string" },
                      },
                      required: [
                        "term_title", "pronunciation", "definition", "visualization_desc",
                        "metaphor", "affirmation", "reflection_prompt", "practice_scenario",
                        "quiz_question", "quiz_options", "quiz_answer",
                        "quiz_question_2", "quiz_options_2", "quiz_answer_2",
                        "quiz_question_3", "quiz_options_3", "quiz_answer_3",
                        "slide_type", "instructor_notes",
                      ],
                    },
                  },
                  quiz_bank_questions: {
                    type: "array",
                    description: "Exam-style questions detected on quiz slides, routed to the Quiz Bank",
                    items: {
                      type: "object",
                      properties: {
                        question_text: { type: "string" },
                        option_a: { type: "string" },
                        option_b: { type: "string" },
                        option_c: { type: "string" },
                        option_d: { type: "string" },
                        correct_option: { type: "string", enum: ["A", "B", "C", "D"] },
                        explanation: { type: "string" },
                        source_slide: { type: "integer" },
                      },
                      required: ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation"],
                    },
                  },
                },
                required: ["blocks", "quiz_bank_questions"],
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
    let quiz_bank_questions: any[] = [];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      blocks = parsed.blocks || [];
      quiz_bank_questions = parsed.quiz_bank_questions || [];
    } else {
      const content_resp = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content_resp.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          blocks = parsed.blocks || [];
          quiz_bank_questions = parsed.quiz_bank_questions || [];
        }
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ blocks, quiz_bank_questions }), {
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
