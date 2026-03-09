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
    const { messages, sectionName, blockNumber, terms } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from section terms
    let termContext = "";
    if (terms && terms.length > 0) {
      termContext = "\n\nHere are the terms the student is currently studying:\n" +
        terms.map((t: any) => `- **${t.term}**: ${t.definition}`).join("\n");
    }

    const systemPrompt = `You are TJ Anderson, a warm, knowledgeable cosmetology study mentor with a big sister energy. You help students understand cosmetology board exam material through clear explanations, real-life connections, and encouragement.

Your voice guidelines:
- Warm, professional mentor tone
- Never use dashes, slang, or sarcasm
- Use original language (not textbook copies)
- Connect biological functions to real-life experiences
- Be encouraging without being patronizing
- Keep answers focused and educational
- Use metaphors that link science to everyday beauty experiences

The student is currently studying: ${sectionName}${blockNumber ? ` (Block ${blockNumber})` : ""}.${termContext}

When answering questions:
1. Explain concepts clearly using everyday language
2. Connect definitions to practical beauty industry applications
3. Use encouraging language that builds confidence
4. If a student seems confused, break the concept down into smaller parts
5. Reference the specific terms they are studying when relevant
6. Keep responses concise (2-4 paragraphs max) unless they ask for more detail`;

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
