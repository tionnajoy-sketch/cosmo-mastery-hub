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
    const { content, filename } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Send condensed text (first lines of each page + full first 3000 chars)
    const condensed = content.slice(0, 12000);

    const systemPrompt = `You are an expert document structure analyzer. Given the text of a document, detect its structure and metadata.

Your job:
1. Detect the document title
2. Detect the document type: one of "textbook", "workbook", "lecture_notes", "bible", "study_guide", "slides", "notes", "other"
3. Detect the subject area (e.g., "cosmetology", "nursing", "anatomy", "bible_study", "history", "chemistry", etc.)
4. Identify chapter/section boundaries with their titles and page ranges
5. Identify key themes across the document
6. Write a brief overview summary

Look for patterns like:
- "Chapter X", "CHAPTER X", "Unit X", "Module X", "Lesson X"
- Numbered sections (1.1, 1.2, Section 1, etc.)
- ALL-CAPS headings
- "--- Page X ---" markers in the text
- Book/verse references for religious texts
- Significant topic shifts

If the document has no clear chapter structure (e.g., a single worksheet or short notes), return a single chapter covering all pages.

Return your analysis using the provided function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze the structure of this document titled "${filename}":\n\n${condensed}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_document_structure",
              description: "Report the detected document structure",
              parameters: {
                type: "object",
                properties: {
                  document_title: { type: "string", description: "Detected document title" },
                  document_type: {
                    type: "string",
                    enum: ["textbook", "workbook", "lecture_notes", "bible", "study_guide", "slides", "notes", "other"],
                  },
                  subject: { type: "string", description: "Detected subject area" },
                  chapters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        number: { type: "integer" },
                        title: { type: "string" },
                        page_start: { type: "integer" },
                        page_end: { type: "integer" },
                        subsections: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" },
                              page_start: { type: "integer" },
                              page_end: { type: "integer" },
                            },
                            required: ["title", "page_start", "page_end"],
                          },
                        },
                      },
                      required: ["number", "title", "page_start", "page_end"],
                    },
                  },
                  key_themes: {
                    type: "array",
                    items: { type: "string" },
                  },
                  overview_summary: { type: "string" },
                },
                required: ["document_title", "document_type", "subject", "chapters", "key_themes", "overview_summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_document_structure" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
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

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return minimal structure
    return new Response(
      JSON.stringify({
        document_title: filename?.replace(/\.[^/.]+$/, "") || "Untitled",
        document_type: "other",
        subject: "general",
        chapters: [{ number: 1, title: "Full Document", page_start: 1, page_end: 999 }],
        key_themes: [],
        overview_summary: "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Analyze structure error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
