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

    // Generate a REAL-LIFE PHOTOGRAPH (not an illustration) — strictly no text
    const prompt = `Create a single high-resolution, photorealistic, real-life photograph that visually represents the cosmetology concept "${term}".

Concept context (for your understanding only — DO NOT render this text in the image):
"${definition}"
${metaphor ? `Helpful metaphor: "${metaphor}"` : ""}

VISUAL STYLE — MUST FOLLOW:
1. PHOTOREALISTIC REAL-LIFE PHOTOGRAPHY ONLY. No illustrations, no cartoons, no diagrams, no drawings, no 3D renders that look stylized. It must look like a professional photograph taken with a high-end camera.
2. For anatomy or skin/hair structures (e.g., epidermis, dermis, papillary layer, reticular layer, keratin, hair follicle, melanin): use real macro/microscopy-style photography, dermatology clinical photos, or professional close-up skin & hair photography. Real human skin, real hair under magnification, etc.
3. For tools, products, equipment (combs, shears, brushes, chemicals, mannequins): use clean, professional product photography with natural lighting on a neutral surface.
4. For procedures or services (haircut, color application, sanitation): show real hands and real cosmetology environments — salon scenes, real practitioners, realistic lighting.
5. Subject should be clearly recognizable and centered. Shallow depth of field is fine. Natural soft lighting.
6. Diverse, inclusive representation when humans appear (especially women of color in cosmetology contexts).

CRITICAL — ABSOLUTELY NO TEXT:
- NO letters, words, labels, captions, numbers, watermarks, logos, brand names, signs, packaging text, arrows with labels, or annotations of any kind.
- DO NOT write "${term}" or any related word anywhere in the image.
- The image must be 100% visual content only — no typography whatsoever.

If text would normally appear (e.g., on a product bottle), render the surface as blank/unbranded. Repeat: ZERO text anywhere in the final image.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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
