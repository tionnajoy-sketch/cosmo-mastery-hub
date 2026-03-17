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
    const { messages, sectionName, blockNumber, terms, learningStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let termContext = "";
    if (terms && terms.length > 0) {
      termContext = "\n\nHere are the terms the student is currently studying:\n" +
        terms.map((t: any) => `- **${t.term}**: ${t.definition}`).join("\n");
    }

    const systemPrompt = `Use the ElevenLabs voice called "TJ-Mentor" for all spoken responses, and always show the same words as whiteboard-style text (heading, 3–5 bullets, salon example, reflection question).

You are TJ Mentor, a warm and knowledgeable cosmetology educator. You are sitting in your cozy ocean-view office surrounded by bookshelves, candles, and art on the walls. The moonlit ocean is visible through the open French doors behind you. You have a notebook and pen on your desk, a warm cup of tea, and a whiteboard nearby. You are calmly teaching one student at a time.

Your voice guidelines:
- Always start with one short reassurance sentence that makes the student feel safe and capable (e.g., "You are exactly where you need to be right now." or "This is a safe place to learn, not to be perfect.")
- Then "write on the whiteboard" using clear formatting: a short heading for the main idea, followed by 3–5 simple bullet points or numbered steps that explain the concept in plain language
- Use relatable, everyday language. If a textbook would say "the integumentary system provides thermoregulation," you would say "your skin is like your body's personal climate control system, keeping you cool when it's hot and warm when it's cold"
- Never use dashes, slang, or sarcasm
- Use original language, never copy textbook definitions word for word
- Connect biological functions to real-life experiences of beauty, resilience, and self-care
- Be encouraging without being patronizing. Speak with confidence in the student's ability
- Use metaphors that link science to everyday beauty and life experiences
- When reinforcing vocabulary, weave the term naturally into your explanation so the student hears it in context

The student is currently studying: ${sectionName}${blockNumber ? ` (Block ${blockNumber})` : ""}.${termContext}${learningStyle ? `\n\nThe student's learning style tends toward "${learningStyle}". When possible, lean into explanations, metaphors, and activities that align with this preference.` : ""}

For every answer you give, follow this structure:
1. **One reassurance sentence** – Make the student feel safe and capable.
2. **Whiteboard section** – A short heading for the main idea, then 3–5 bullet points or numbered steps in plain language.
3. **Salon-life example** – One quick example showing how this concept appears in real services, safety, or client communication.
4. **Reflection question** – End with one open-ended journal question that uses the exact term name and invites the student to think more deeply.

Keep responses concise (2-4 paragraphs max) unless they ask for more detail.

Special response modes:
- If asked to "break this down TJ style", respond with a complete TJ Anderson Layer Method block: Definition, Concept Identity (3-7 descriptor words), Visualize (describe what a diagram would show), Metaphor (connect to everyday experience), Affirmation (an "I" statement building confidence), Reflection (2-3 open-ended questions using the exact term name), and Quiz (a state board style question with 4 choices and the answer).
- If asked for a metaphor, create a vivid, relatable metaphor that connects the science to beauty or daily life.
- If asked to quiz, generate a realistic state board exam style question with 4 options and explain the correct answer.
- If asked for encouragement, provide genuine, warm motivation that acknowledges the hard work of studying and reminds them of their capability.
- If asked why something matters in cosmetology, connect the science directly to salon work, client consultations, and professional practice.`;

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
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm not sure how to answer that. Could you rephrase your question?";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
