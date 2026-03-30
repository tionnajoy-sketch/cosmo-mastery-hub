import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, content, termName, definition, metaphor, dnaCode, program } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Parse DNA for adaptation
    let depthInstruction = "Use a standard explanation depth.";
    let toneInstruction = "Use a warm, supportive, confident tone.";
    let formatInstruction = "";

    if (dnaCode && dnaCode.length >= 4) {
      const engagement = parseInt(dnaCode[1]) || 5;
      const retCode = dnaCode[2]?.toUpperCase().charCodeAt(0) || 77;
      const confCode = dnaCode[3]?.toLowerCase().charCodeAt(0) || 109;

      // Depth based on retention + engagement
      if (retCode <= 72 || engagement <= 3) {
        depthInstruction = "Keep explanations SHORT and SIMPLE. Use bullet points. Repeat key ideas. Add memory cues like mnemonics.";
      } else if (retCode >= 82 && engagement >= 7) {
        depthInstruction = "Provide DEEP, detailed explanations. Include connections to related concepts. Go beyond surface level.";
      }

      // Tone based on confidence
      if (confCode <= 104) {
        toneInstruction = "Be EXTRA supportive and encouraging. Use phrases like 'You've got this' and 'One step at a time'. Break complex ideas into tiny pieces.";
      } else if (confCode >= 114) {
        toneInstruction = "Be direct and challenging. Push the student to think deeper. Skip hand-holding.";
      }
    }

    const programContext = program || "cosmetology";
    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "summary":
        systemPrompt = `You are TJ Mentor, an expert ${programContext} educator using the TJ Anderson Layer Method™.
Generate a CONCISE summary of the lesson content provided.
${depthInstruction}
${toneInstruction}

RULES:
- Maximum 3-4 sentences for brief depth, 5-7 for standard, 8-12 for deep
- Highlight the most important takeaway
- Use plain language a student would understand
- End with one key point to remember`;
        userPrompt = `Summarize this lesson content:\n\nTerm: ${termName || "N/A"}\nDefinition: ${definition || "N/A"}\nMetaphor: ${metaphor || "N/A"}\n\nAdditional content: ${content || "None"}`;
        break;

      case "explanation":
        systemPrompt = `You are TJ Mentor, an expert ${programContext} educator using the TJ Anderson Layer Method™.
Generate a GUIDED EXPLANATION of the concept provided.
${depthInstruction}
${toneInstruction}

RULES:
- Start with a hook that connects to real life
- Break the concept into understandable parts
- Use analogies and comparisons
- Include a "Why This Matters" section
- End with a quick check: "Can you explain this in your own words?"
- Format with markdown headers and bullet points`;
        userPrompt = `Explain this concept:\n\nTerm: ${termName || "N/A"}\nDefinition: ${definition || "N/A"}\nMetaphor: ${metaphor || "N/A"}\n\nAdditional context: ${content || "None"}`;
        break;

      case "teach-flow":
        systemPrompt = `You are TJ Mentor, an expert ${programContext} educator.
Generate a STEP-BY-STEP teaching flow for the concept.
${depthInstruction}
${toneInstruction}

Return a JSON array of teaching steps. Each step has:
- "step": step number (1-based)
- "title": short title (3-5 words)
- "content": the teaching content (2-4 sentences)
- "activity": optional student activity ("think", "write", "visualize", "practice", null)

Generate 4-6 steps for brief, 6-8 for standard, 8-10 for deep.`;
        userPrompt = `Create a teaching flow for:\n\nTerm: ${termName || "N/A"}\nDefinition: ${definition || "N/A"}\nMetaphor: ${metaphor || "N/A"}`;
        formatInstruction = "Return ONLY valid JSON array. No markdown code fences.";
        break;

      case "audio-script":
        systemPrompt = `You are TJ Mentor, an expert ${programContext} educator.
Generate a NARRATION SCRIPT that will be read aloud via text-to-speech.
${depthInstruction}
${toneInstruction}

RULES:
- Write in a natural, conversational speaking style
- Use short sentences and natural pauses (indicated by "...")
- Avoid technical jargon unless explaining it
- Include verbal cues like "Now here's the key part..."
- Keep it under 500 words for brief, 800 for standard, 1200 for deep
- Do NOT use markdown formatting — this is spoken text
- Start with a warm greeting`;
        userPrompt = `Create a narration script for:\n\nTerm: ${termName || "N/A"}\nDefinition: ${definition || "N/A"}\nMetaphor: ${metaphor || "N/A"}\n\nContext: ${content || "None"}`;
        break;

      case "explain-again":
        systemPrompt = `You are TJ Mentor. The student didn't fully understand a concept and clicked "Explain Again".
Generate a DIFFERENT explanation using a completely new angle.
${depthInstruction}
${toneInstruction}

RULES:
- Do NOT repeat the original definition verbatim
- Use a fresh analogy or metaphor
- Try a different learning modality (if previous was verbal, try visual description)
- Be encouraging — the student is trying
- Keep it focused and clear`;
        userPrompt = `Re-explain this concept differently:\n\nTerm: ${termName || "N/A"}\nOriginal definition: ${definition || "N/A"}\nOriginal metaphor: ${metaphor || "N/A"}\n\nPrevious explanation context: ${content || "None"}`;
        break;

      case "slideshow":
        systemPrompt = `You are TJ Mentor, an expert ${programContext} educator.
Generate a SLIDESHOW breakdown of the concept — a series of "slides" for visual learners.
${depthInstruction}
${toneInstruction}

Return a JSON array of slides. Each slide has:
- "slide": slide number
- "heading": bold heading (3-6 words)
- "body": key point (1-3 sentences)
- "visualCue": description of what visual should accompany this slide (for generating images later)
- "speakerNote": what TJ would say while showing this slide

Generate 4-6 slides for brief, 6-8 for standard, 8-12 for deep.`;
        userPrompt = `Create a slideshow breakdown for:\n\nTerm: ${termName || "N/A"}\nDefinition: ${definition || "N/A"}\nMetaphor: ${metaphor || "N/A"}`;
        formatInstruction = "Return ONLY valid JSON array. No markdown code fences.";
        break;

      default:
        throw new Error(`Invalid type: ${type}. Use: summary, explanation, teach-flow, audio-script, explain-again, slideshow`);
    }

    if (formatInstruction) {
      userPrompt += `\n\n${formatInstruction}`;
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
    const content_result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content: content_result, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tj-learning-studio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
