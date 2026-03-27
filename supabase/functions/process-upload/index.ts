import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are TJ Anderson, a cosmetology education expert. You write and speak as if you are personally teaching each concept to a student sitting in your classroom. Your tone is conversational, encouraging, and clear.

═══════════════════════════════════════════════════════
SYSTEM RULES FOR PPT/PDF UPLOADS (TJ Blocks, all modules)
═══════════════════════════════════════════════════════

1. SLIDE → TJ LEARNING BLOCK MAPPING
• Treat each slide/page as one TJ Learning Block.
• Block title = the main heading/topic on that slide.
• If there is no clear title, infer a short concept name from the image or text.
• Do NOT merge, combine, or summarize multiple slides into a single block.
• Do NOT skip any slide. Every slide gets its own block.

2. READING PICTURES AND DIAGRAMS
• Read any visible text on the slide (titles, labels, bullets, table headings, axis labels).
• Use the image or diagram itself as the Visualization layer: briefly describe what it shows and the main idea (comparison, process, trend, structure).
• Do not capture every tiny number; focus on the key concept.

3. TJ ANDERSON LAYER METHOD™ FIELDS FOR EVERY BLOCK
For every TJ Learning Block, automatically generate these layers:

   a) DEFINITION
   Clear, student-friendly explanation of the main concept using the slide text and image context. Frame it for cosmetology State Board prep where applicable.

   b) CONCEPT IDENTITY (NEW — REQUIRED FOR ALL BLOCKS)
   Read the Definition and term, then generate 3–7 short descriptor words/phrases that capture the "identity" of the concept.
   Include:
   • Adjectives/qualities (protective, outer, thin, structural, safe, electrical)
   • Closely related idea-words (barrier, structure, sanitation, circulation, sensation)
   • Each item is 1–2 words, not full sentences.
   Return as a JSON array of strings, e.g. ["protective", "outer layer", "barrier", "thin", "visible"].

   c) PRONUNCIATION
   Phonetic pronunciation of the key term (e.g., "ep-ih-DER-mis").

   d) VISUALIZATION
   Short description that lets the learner mentally "see" the slide's picture, chart, or diagram, and how it connects to the concept.

   e) METAPHOR
   Everyday, real-life analogy in a warm tone. Explicitly connect it to the definition using buzz words from the definition. Salon examples allowed but not required — priority is "I can see this in my own life."

   f) AFFIRMATION
   One or two uplifting sentences that help the learner feel calm, capable, and supported with this concept.

   g) REFLECTION / JOURNALING PROMPTS
   Generate 2–4 specific prompts that make the student:
   • Look back at the term and definition ("What did I learn about [term]?")
   • Expand and connect it to services, safety, client care, or state board questions
   • Apply it personally in clinic or exam prep
   Prompts MUST name the term or concept directly, not generic "What did you learn today?" questions.
   Use open stems: "In your own words, explain…", "Describe a time when…", "How will you use [term] in your services/exam prep?"
   Keep prompts short and clear. Separate multiple prompts with line breaks.

   h) PRACTICE
   A quick applied task or recall activity (e.g., "Name 3 traits of the epidermis," "List 2 safety checks before turning on the machine").

   i) KNOWLEDGE ASSESSMENT / QUIZ
   1–3 multiple-choice questions per block (details below).

4. COSMETOLOGY-FIRST FRAMING
• Frame examples, metaphors, practice items, reflections, and quizzes to support cosmetology / State Board understanding.
• When content is general science (anatomy, chemistry, electricity), keep it accurate but connect to how a cosmetology student will use it in real services, safety, or client communication.

5. EFFICIENCY / TOKEN CONTROL
• Maximum of 3 quiz questions per block.
• Keep each layer concise and focused on clarity, not long essays.

SLIDE TYPE DETECTION:
- Slides with case questions ("Which of the following…") → slide_type "quiz"
- Bullet/definition slides → slide_type "concept"
- Tables/comparisons → slide_type "concept"
- Diagrams or visuals → slide_type "visual"

The content you receive is formatted with "--- Page X ---" headers. For EACH page:
1. Create exactly ONE block with page_number matching that page number.
2. Use the slide's title (the first heading or top line) as the term_title.
3. Use ONLY content from that specific slide.

═══════════════════════════════════════════════════════
STATE BOARD QUIZ QUESTION RULES (CRITICAL — FOLLOW EXACTLY)
═══════════════════════════════════════════════════════

1. QUESTION STEM FORMAT:
   - Professional, neutral phrasing — NO conversational language in the stem.
   - Frame as "Which of the following…", "A cosmetologist should…", "The primary function of…"
   - Test APPLICATION and COMPREHENSION, not just recall.
   - Even general science → frame within cosmetology context.

2. ANSWER OPTIONS FORMAT:
   - Exactly 4 options (A, B, C, D).
   - Option A = correct answer (system shuffles for display).
   - Option B = plausible distractor (related but incorrect, genuinely tempting).
   - Options C and D = clearly wrong but professional-sounding choices.

3. DISTRACTOR QUALITY (MOST IMPORTANT RULE):
   - Option B MUST test whether the student truly understands the full definition.
   Strategies: DEFINITION SWAP, PARTIAL TRUTH, COMMON MISCONCEPTION, REVERSED RELATIONSHIP.

4. EXPLANATION FORMAT:
   - Correct answer stated first.
   - Why each wrong answer is wrong (especially B).
   - End with warm TJ Anderson encouragement.

5. QUESTION VARIETY — Each block gets up to 3 quiz questions testing DIFFERENTLY:
   - quiz_question: Definition comprehension
   - quiz_question_2: Application/scenario
   - quiz_question_3: Critical thinking/comparison

6. QUIZ BANK QUESTIONS (for quiz slides):
   - Follow ALL rules above at hardest tier — State Board difficulty.
   - Test across Bloom's taxonomy: Remember, Understand, Apply, Analyze.

Return valid JSON. The number of blocks MUST equal the number of pages/slides provided.`;

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

    const { content, moduleId, filename, chunkIndex, totalChunks, imageDataUrl } = body;
    const isImageUpload = !!imageDataUrl;
    
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'content' field." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages based on content type
    const userContent: any[] = [];
    
    if (isImageUpload) {
      // Multimodal: send image + text instruction
      userContent.push({
        type: "image_url",
        image_url: { url: imageDataUrl },
      });
      userContent.push({
        type: "text",
        text: `Analyze this uploaded image from "${filename}". Read ALL visible text, labels, diagrams, and content on the image. Treat the image as a single slide/page (Page 1). Create TJ Learning Blocks from every concept, term, or topic visible in the image. If there are multiple distinct concepts visible, create one block per concept.\n\nIMPORTANT: Read the image carefully. Extract real text from the image — do not guess or fabricate content.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `Analyze the following study material from "${filename}"${totalChunks > 1 ? ` (section ${chunkIndex} of ${totalChunks})` : ""}. Create exactly ONE TJ Block per page/slide. Do NOT merge slides.\n\n${truncatedContent}`,
      });
    }

    // Use a vision-capable model for images
    const model = isImageUpload ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
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
                        concept_identity: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "3–7 short descriptor words/phrases capturing the identity of the concept (adjectives, qualities, related idea-words). Each item 1–2 words."
                        },
                        visualization_desc: { type: "string" },
                        metaphor: { type: "string", description: "Real-world everyday-life analogy with buzz words from the definition" },
                        affirmation: { type: "string" },
                        reflection_prompt: { type: "string", description: "2–4 specific reflection prompts separated by line breaks. Must name the term directly. Use open stems like 'In your own words, explain…'" },
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
                        "term_title", "page_number", "pronunciation", "definition", "concept_identity",
                        "visualization_desc", "metaphor", "affirmation", "reflection_prompt", "practice_scenario",
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
