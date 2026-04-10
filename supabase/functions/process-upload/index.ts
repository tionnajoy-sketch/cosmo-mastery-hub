import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(subject: string, documentType: string, contentType?: string): string {
  const subjectLabel = subject || "the subject";
  const contextFrame = subject === "cosmetology"
    ? "Frame examples, metaphors, practice items, reflections, and quizzes to support cosmetology / State Board understanding. When content is general science (anatomy, chemistry, electricity), keep it accurate but connect to how a cosmetology student will use it in real services, safety, or client communication."
    : `Frame examples, metaphors, practice items, reflections, and quizzes within the context of ${subjectLabel}. Connect concepts to real-world applications the learner will encounter in their field.`;

  // Content-type specific instructions
  let segmentationRules = "";

  if (contentType === "dictionary") {
    segmentationRules = `
═══════════════════════════════════════════════════════
DICTIONARY / WORD LIST MODE
═══════════════════════════════════════════════════════
The content has been pre-segmented into INDIVIDUAL word entries.
• Each entry below is ONE word/term. Create exactly ONE TJ block per entry.
• Do NOT merge entries. Do NOT skip entries. Do NOT combine related words.
• The "title" field = the word/term. Use it as term_title EXACTLY.
• The "body" field = the raw text (may include a definition). Expand upon it.
• Generate all TJ layers for each single word independently.
• The number of blocks you return MUST equal the number of units provided.
• Even if two words are related (e.g. "artery" and "vein"), keep them as SEPARATE blocks.
`;
  } else if (contentType === "math") {
    segmentationRules = `
═══════════════════════════════════════════════════════
MATH / STRUCTURED LESSON MODE
═══════════════════════════════════════════════════════
The content has been pre-segmented into hierarchical learning units:
• lesson_overview — overall lesson introduction
• vocabulary — key terms for the lesson
• explanation — concept explanation
• worked_example — fully solved step-by-step example
• guided_practice — partially worked problem for the student to complete
• independent_practice — student solves alone (tagged easy/medium/challenge)
• answer_key — solutions

CRITICAL RULES FOR MATH BLOCKS:
1. For worked_example units: Include COMPLETE step-by-step solutions. Show every step.
2. For guided_practice: Show setup and first steps. Leave 1-2 steps for the student.
3. For independent_practice: Present the problem only. Store the solution in instructor_notes.
4. Generate quiz questions that test the SAME skill at varying difficulty.
5. For each practice block, set the difficulty_level field to the tagged difficulty.
6. Include "why this works" reasoning in the explanation field.
`;
  }

  return `You are TJ Anderson, an expert educator. You write and speak as if you are personally teaching each concept to a student sitting in your classroom. Your tone is conversational, encouraging, and clear.

Subject Area: ${subjectLabel}
Document Type: ${documentType || "study material"}
${segmentationRules}
═══════════════════════════════════════════════════════
SYSTEM RULES FOR PROCESSING STUDY MATERIAL (TJ Blocks)
═══════════════════════════════════════════════════════

1. CONTENT → TJ LEARNING BLOCK MAPPING
• Each pre-segmented unit becomes ONE TJ Learning Block.
• Block title = the unit title or main heading.
• Do NOT merge, combine, or summarize multiple units into a single block.
• Do NOT skip any unit. Every unit gets its own block.

2. READING CONTENT
• Read any visible text (titles, labels, bullets, table headings).
• Use diagrams or images as the Visualization layer.
• Focus on the key concept per unit.

3. TJ ANDERSON LAYER METHOD™: CORE CROSS AGENT™ FIELDS FOR EVERY BLOCK
For every TJ Learning Block, automatically generate these layers:

   a) DEFINITION — Clear, student-friendly explanation of the main concept.
   
   b) SOURCE TEXT — The original passage or key text from this page/slide.
   
   c) EXPLANATION — A plain-language "what this passage says" summary that makes the content accessible.
   
   d) CONCEPT IDENTITY — 3–7 short descriptor words/phrases capturing the concept's identity. Return as JSON array.
   
   e) KEY CONCEPTS — Array of important terms/ideas found in this content.
   
   f) THEMES — Thematic tags for this content (e.g., "safety", "anatomy", "client care").
   
   g) PRONUNCIATION — Phonetic pronunciation of the key term.
   
   h) VISUALIZATION — Description to help the learner mentally "see" the concept.
   
   i) METAPHOR — Everyday analogy with buzz words from the definition.
   
   j) AFFIRMATION — Uplifting sentences for confidence.
   
   k) REFLECTION / JOURNALING PROMPTS — 2–4 prompts naming the term directly.
   
   l) MEMORY ANCHORS — Mnemonics, acronyms, or recall aids to help remember this concept.
   
   m) APPLICATION STEPS — Practical steps to apply this concept in real scenarios.
   
   n) PRACTICE — Quick applied task or recall activity.
   
   o) KNOWLEDGE ASSESSMENT / QUIZ — 1–3 multiple-choice questions per block.
   
   p) DIFFICULTY LEVEL — "beginner", "intermediate", or "advanced".
   
   q) SEARCH TAGS — Keywords for retrieval and search.
   
   r) PAGE REFERENCE — Source reference like "Chapter 3, pp. 45-47" or "Slide 5".

4. ${contextFrame}

5. EFFICIENCY / TOKEN CONTROL
• Maximum of 3 quiz questions per block.
• Keep each layer concise and focused.

SLIDE TYPE DETECTION:
- Quiz/case question slides → slide_type "quiz"
- Bullet/definition slides → slide_type "concept"
- Tables/comparisons → slide_type "concept"
- Diagrams or visuals → slide_type "visual"
- Math worked examples → slide_type "concept"
- Practice problems → slide_type "quiz"

═══════════════════════════════════════════════════════
QUIZ QUESTION RULES
═══════════════════════════════════════════════════════

1. Professional, neutral phrasing.
2. Exactly 4 options (A, B, C, D). Option A = correct.
3. Option B = plausible distractor. Options C, D = clearly wrong but professional.
4. Explanation: correct answer first, why wrong answers are wrong, encouraging close.
5. Up to 3 questions testing: definition, application, critical thinking.

Return valid JSON. The number of blocks MUST equal the number of units provided.`;
}

function buildImageSystemPrompt(subject: string): string {
  return `You are TJ Anderson, an expert educator. You analyze images of vocabulary sheets, study guides, and handwritten notes.

Subject Area: ${subject || "general"}

CRITICAL INSTRUCTION: This image contains MULTIPLE vocabulary terms/words with definitions. You MUST create ONE separate TJ Learning Block for EACH individual term found. If there are 16 terms, you must return 16 blocks.

DO NOT summarize the image into one block. Read EVERY line, EVERY definition, EVERY handwritten answer.

For EACH term found, generate all TJ Anderson Layer Method™: Core Cross Agent™ fields including:
- source_text, explanation, key_concepts, themes, memory_anchors, application_steps
- difficulty_level, search_tags, page_reference, section_title
- Plus all standard fields (definition, concept_identity, pronunciation, visualization, metaphor, etc.)

Return valid JSON.`;
}

/**
 * Format pre-segmented units into a structured prompt the AI can parse clearly.
 */
function formatSegmentedContent(units: any[]): string {
  return units.map((u: any, i: number) => {
    const header = `═══ UNIT ${i + 1} ═══`;
    const meta = [
      `Title: ${u.title}`,
      `Type: ${u.unitType}`,
      u.difficulty ? `Difficulty: ${u.difficulty}` : null,
      u.parentIndex !== null && u.parentIndex !== undefined ? `Parent: Unit ${u.parentIndex + 1}` : null,
    ].filter(Boolean).join(" | ");
    return `${header}\n${meta}\n\n${u.body}`;
  }).join("\n\n");
}

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
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      content, moduleId, filename, chunkIndex, totalChunks,
      imageDataUrl, subject, documentType, chapterNumber, sectionTitle, pageRange,
      // New segmented-mode fields
      contentType, segmentedUnits,
    } = body;
    const isImageUpload = !!imageDataUrl;
    const isSegmented = !!segmentedUnits && Array.isArray(segmentedUnits) && segmentedUnits.length > 0;

    if (isImageUpload && imageDataUrl) {
      const dataUrlLength = typeof imageDataUrl === "string" ? imageDataUrl.length : 0;
      if (dataUrlLength > 10_000_000) {
        return new Response(JSON.stringify({ error: "Image too large. Use a smaller image (under 5MB)." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), isImageUpload ? 180000 : 120000);

    const userContent: any[] = [];

    if (isImageUpload) {
      userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
      userContent.push({
        type: "text",
        text: `Analyze this uploaded image from "${filename}". Create ONE TJ Learning Block for EACH individual term or vocabulary word found. Include all layer method fields including source_text, explanation, key_concepts, themes, memory_anchors, application_steps, difficulty_level, search_tags.`,
      });
    } else if (isSegmented) {
      // ═══ SEGMENTED MODE: units are already split by client ═══
      const formattedUnits = formatSegmentedContent(segmentedUnits);
      const unitCount = segmentedUnits.length;
      userContent.push({
        type: "text",
        text: `The following content from "${filename}" has been pre-segmented into ${unitCount} individual learning units. Create EXACTLY ONE TJ Block per unit. Do NOT merge units. Do NOT skip any unit.\n\nContent type: ${contentType || "general"}\n\n${formattedUnits}`,
      });
    } else {
      const contextNote = sectionTitle ? ` (${sectionTitle}, ${pageRange || ""})` : "";
      userContent.push({
        type: "text",
        text: `Analyze the following study material from "${filename}"${contextNote}${totalChunks > 1 ? ` (section ${chunkIndex} of ${totalChunks})` : ""}. Create exactly ONE TJ Block per page/slide. Do NOT merge slides.\n\n${truncatedContent}`,
      });
    }

    const model = isImageUpload ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    const activeSystemPrompt = isImageUpload
      ? buildImageSystemPrompt(subject || "")
      : buildSystemPrompt(subject || "", documentType || "", isSegmented ? contentType : undefined);

    const requestBody = JSON.stringify({
        model,
        messages: [
          { role: "system", content: activeSystemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_tj_blocks",
              description: "Create TJ Anderson Layer Method™: Core Cross Agent™ learning blocks with full structural metadata.",
              parameters: {
                type: "object",
                properties: {
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        term_title: { type: "string" },
                        page_number: { type: "integer" },
                        pronunciation: { type: "string" },
                        definition: { type: "string" },
                        concept_identity: { type: "array", items: { type: "string" } },
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
                        slide_type: { type: "string", enum: ["concept", "visual", "quiz"] },
                        instructor_notes: { type: "string" },
                        source_text: { type: "string", description: "Original passage text from the source" },
                        explanation: { type: "string", description: "Plain-language explanation of what the passage says" },
                        key_concepts: { type: "array", items: { type: "string" }, description: "Important terms/ideas" },
                        themes: { type: "array", items: { type: "string" }, description: "Thematic tags" },
                        memory_anchors: { type: "array", items: { type: "string" }, description: "Mnemonics and recall aids" },
                        application_steps: { type: "array", items: { type: "string" }, description: "Practical application steps" },
                        difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                        search_tags: { type: "array", items: { type: "string" }, description: "Search keywords" },
                        page_reference: { type: "string", description: "Source reference like Chapter 3, pp. 45-47" },
                        section_title: { type: "string", description: "Which section this came from" },
                      },
                      required: [
                        "term_title", "page_number", "definition", "concept_identity",
                        "visualization_desc", "metaphor", "affirmation", "reflection_prompt",
                        "quiz_question", "quiz_options", "quiz_answer",
                        "slide_type",
                      ],
                    },
                  },
                  quiz_bank_questions: {
                    type: "array",
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
      });

    // Retry loop for transient 503 errors
    const MAX_RETRIES = 3;
    let response: Response | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retry attempt ${attempt + 1} after ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
      }

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      if (response.status !== 503) break;
      console.error(`AI gateway returned 503 on attempt ${attempt + 1}`);
    }
    clearTimeout(timeout);

    if (!response || !response.ok) {
      const status = response?.status || 500;
      const t = response ? await response.text() : "No response";
      console.error("AI gateway error:", status, t);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits need to be topped up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 503) {
        return new Response(JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a moment.", fallback: true }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse AI response JSON");
      let blocks: any[] = [];
      const quiz_bank_questions: any[] = [];
      try {
        const blocksMatch = rawText.match(/"blocks"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
        if (blocksMatch) blocks = JSON.parse(blocksMatch[1]);
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
        console.error("Failed to parse tool call arguments");
        const raw = typeof toolCall.function.arguments === "string" ? toolCall.function.arguments : "";
        try {
          const blocksMatch = raw.match(/"blocks"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
          if (blocksMatch) blocks = JSON.parse(blocksMatch[1]);
        } catch {
          console.error("Could not salvage partial JSON");
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

    // Attach chapter/section metadata passed from client
    if (chapterNumber || sectionTitle || pageRange) {
      blocks = blocks.map((b: any) => ({
        ...b,
        section_title: b.section_title || sectionTitle || "",
        page_reference: b.page_reference || pageRange || "",
      }));
    }

    return new Response(JSON.stringify({ blocks, quiz_bank_questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Process upload error:", e);
    const isAbortError = e instanceof Error && e.name === "AbortError";
    return new Response(JSON.stringify({
      error: isAbortError
        ? "Processing timed out while generating blocks for this upload batch."
        : e instanceof Error
          ? e.message
          : "Unknown error"
    }), {
      status: isAbortError ? 504 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
