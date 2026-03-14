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
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("Failed to parse request body:", parseErr);
      return new Response(JSON.stringify({ error: "Invalid request body. Could not parse JSON." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, moduleId, filename, chunkIndex, totalChunks } = body;
    
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'content' field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const maxContentLength = 15000;
    const truncatedContent = content.length > maxContentLength 
      ? content.slice(0, maxContentLength) + "\n\n[Content truncated for processing]"
      : content;

    const systemPrompt = `You are TJ Anderson, a cosmetology education expert. You write and speak as if you are personally teaching each concept to a student sitting in your classroom. Your tone is conversational, encouraging, and clear.

CRITICAL RULE — ONE SLIDE = ONE TJ BLOCK:
Each page/slide in the document MUST produce exactly ONE TJ Block. Do NOT merge, combine, or summarize multiple slides into a single block. Do NOT skip any slide. Every slide gets its own block.

PRIMARY CONCEPT PER SLIDE:
- For each slide, pick one main concept as the Block title.
- Other terms on the slide become supporting bullets under Definition/Visualization, or Practice/Quiz questions.
- If a concept name already appeared in a previous chunk, still create a block — deduplication happens client-side.

SLIDE TYPE DETECTION:
- Slides with case questions ("Which of the following…") → slide_type "quiz", emphasis on Practice/Knowledge Assessment.
- Bullet/definition slides → slide_type "concept", emphasis on Definition, Visualization, Metaphor.
- Tables/comparisons → slide_type "concept", Practice asks to match types to descriptions.
- Diagrams or visuals → slide_type "visual", prioritize visualization_desc.

The content you receive is formatted with "--- Page X ---" headers. For EACH page:
1. Create exactly ONE block with page_number matching that page number.
2. Use the slide's title (the first heading or top line) as the term_title. Keep the original title exactly.
3. Use ONLY content from that specific slide — never mix in content from other slides.

For each block, populate ALL TJ Anderson Layer Method™ fields:
- term_title: The slide title exactly as it appears on the slide
- pronunciation: Phonetic pronunciation of the key term (e.g., "ep-ih-DER-mis")
- definition: A clear, warm, exam-style explanation based on the slide's content. Frame it for cosmetology State Board prep where applicable.
- visualization_desc: A detailed description of what a visual diagram would show for this slide's content
- metaphor: A real-world, everyday-life analogy (money, time, relationships, social media, family) that a cosmetology student can relate to. Explicitly connect it to the definition using buzz words from the definition. Salon examples are allowed but not required — priority is "I can see this in my own life."
- affirmation: A short, grounding "I" statement that builds confidence
- reflection_prompt: A thought-provoking question connecting the concept to their career
- practice_scenario: A realistic salon or client scenario requiring the student to apply this concept
- page_number: The exact page/slide number from the document
- instructor_notes: Add "Source: Slide {page_number} of {total}" at the start, followed by any additional teaching notes

PRACTICE ACTIVITIES:
- If the slide already contains a question, case study, or review item, use that as the basis for quiz_question.
- If the slide is purely informational, generate State Board-style recall questions from its content.
- Every block MUST have at least quiz_question with quiz_options and quiz_answer.
- All quiz questions must be 4-option cosmetology State Board-style multiple choice with proper Board phrasing and difficulty.
- Each question: one best answer, one plausible distractor, two clearly incorrect options.

QUIZ SLIDES:
- If a slide contains ONLY exam-style questions (no teaching content), still create a TJ Block for it AND extract the questions into quiz_bank_questions with the page_number.

Return valid JSON. The number of blocks MUST equal the number of pages/slides provided.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze the following study material from "${filename}"${totalChunks > 1 ? ` (section ${chunkIndex} of ${totalChunks})` : ""}. Create exactly ONE TJ Block per page/slide. Do NOT merge slides.\n\n${truncatedContent}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_tj_blocks",
              description: "Create exactly one TJ Anderson Layer Method learning block per slide/page. The number of blocks must match the number of pages provided.",
              parameters: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    description: "One block per slide/page. Array length MUST equal number of pages in the input.",
                    items: {
                      type: "object",
                      properties: {
                        term_title: { type: "string", description: "The slide title exactly as it appears on the slide" },
                        page_number: { type: "integer", description: "The page/slide number from the document" },
                        pronunciation: { type: "string" },
                        definition: { type: "string" },
                        visualization_desc: { type: "string" },
                        metaphor: { type: "string", description: "Real-world everyday-life analogy with buzz words from the definition" },
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
                        slide_type: { type: "string", enum: ["concept", "visual", "quiz"] },
                        instructor_notes: { type: "string", description: "Must start with 'Source: Slide X of Y'" },
                        image_description: { type: "string" },
                      },
                      required: [
                        "term_title", "page_number", "pronunciation", "definition", "visualization_desc",
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
                    description: "Exam-style questions detected on quiz slides, routed to the Quiz Bank. All must be 4-option State Board style.",
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
    clearTimeout(timeout);

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI gateway error:", status, t);
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
      throw new Error(`AI gateway error: ${status}`);
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse AI response JSON, length:", rawText.length, "preview:", rawText.slice(0, 200));
      let blocks: any[] = [];
      let quiz_bank_questions: any[] = [];
      try {
        const blocksMatch = rawText.match(/"blocks"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
        if (blocksMatch) {
          blocks = JSON.parse(blocksMatch[1]);
        }
      } catch { /* ignore */ }
      return new Response(JSON.stringify({ blocks, quiz_bank_questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let blocks: any[] = [];
    let quiz_bank_questions: any[] = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = typeof toolCall.function.arguments === "string" 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        blocks = parsed.blocks || [];
        quiz_bank_questions = parsed.quiz_bank_questions || [];
      } catch (jsonErr) {
        console.error("Failed to parse tool call arguments, length:", 
          typeof toolCall.function.arguments === "string" ? toolCall.function.arguments.length : 0);
        const raw = typeof toolCall.function.arguments === "string" ? toolCall.function.arguments : "";
        try {
          const blocksMatch = raw.match(/"blocks"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
          if (blocksMatch) {
            blocks = JSON.parse(blocksMatch[1]);
          }
        } catch {
          console.error("Could not salvage partial JSON from tool call");
        }
      }
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
