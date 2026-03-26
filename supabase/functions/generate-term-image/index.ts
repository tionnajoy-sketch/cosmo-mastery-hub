import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { termId, term, definition, metaphor } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if image already exists
    const { data: existing } = await supabase
      .from("term_images")
      .select("image_url")
      .eq("term_id", termId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ image_url: existing.image_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate image using Lovable AI — realistic, labeled, educational
    const prompt = `Create a realistic, detailed educational diagram for a cosmetology student studying for their state board exam. The image should clearly illustrate the term "${term}".

Scientific definition: "${definition}"
Conceptual metaphor: "${metaphor}"

Requirements:
- Realistic anatomical or scientific illustration style (NOT cartoon, NOT watercolor)
- Include clear TEXT LABELS directly on the image pointing to key structures
- The main label should show the term name "${term}" in bold
- Add 2-3 additional labels pointing to relevant anatomical features mentioned in the definition
- Include a small caption area at the bottom of the image that reads: "${term} — ${metaphor}"
- Use a clean, light background with professional medical/educational illustration quality
- Color-coded sections where appropriate (like a textbook cross-section diagram)
- Make it visually clear how the metaphor relates to the actual structure
- This should help visual learners understand and remember the concept
- CRITICAL: All text labels and captions MUST be spelled correctly. Double-check every word against standard English dictionary spelling. No typos, no misspellings. Verify the spelling of "${term}" specifically.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      throw new Error("No image generated");
    }

    // Convert base64 to binary and upload to storage
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${termId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("term-images")
      .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: publicUrl } = supabase.storage.from("term-images").getPublicUrl(fileName);

    // Save reference
    await supabase.from("term_images").upsert({
      term_id: termId,
      image_url: publicUrl.publicUrl,
    });

    return new Response(JSON.stringify({ image_url: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
