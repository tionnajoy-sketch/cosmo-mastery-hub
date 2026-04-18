import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateOne(supabase: any, LOVABLE_API_KEY: string, t: { id: string; term: string; definition: string; metaphor: string }) {
  const prompt = `Create a single high-resolution, photorealistic, real-life photograph that visually represents the cosmetology concept "${t.term}".

Concept context (for your understanding only — DO NOT render this text in the image):
"${t.definition}"
${t.metaphor ? `Helpful metaphor: "${t.metaphor}"` : ""}

VISUAL STYLE — MUST FOLLOW:
1. PHOTOREALISTIC REAL-LIFE PHOTOGRAPHY ONLY. No illustrations, no cartoons, no diagrams, no drawings, no 3D renders that look stylized.
2. For anatomy or skin/hair structures: use real macro/microscopy-style photography, dermatology clinical photos, or professional close-up skin & hair photography.
3. For tools, products, equipment: clean, professional product photography with natural lighting.
4. For procedures or services: real hands and real cosmetology environments — salon scenes, real practitioners.
5. Subject clearly recognizable and centered. Shallow depth of field fine. Natural soft lighting.
6. Diverse, inclusive representation when humans appear (especially women of color).

CRITICAL — ABSOLUTELY NO TEXT:
- NO letters, words, labels, captions, numbers, watermarks, logos, brand names, signs, packaging text, arrows with labels, or annotations of any kind.
- DO NOT write "${t.term}" or any related word anywhere in the image.
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
    throw new Error(`AI gateway ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const imageDataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageDataUrl) throw new Error("No image returned");

  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const fileName = `${t.id}.png`;

  const { error: uploadError } = await supabase.storage
    .from("term-images")
    .upload(fileName, binaryData, { contentType: "image/png", upsert: true });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: publicUrl } = supabase.storage.from("term-images").getPublicUrl(fileName);

  await supabase.from("term_images").upsert({ term_id: t.id, image_url: publicUrl.publicUrl });
  return publicUrl.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let limit = 50;
    let dryRun = false;
    try {
      const body = await req.json();
      if (typeof body?.limit === "number") limit = Math.min(Math.max(1, body.limit), 200);
      if (body?.dryRun) dryRun = true;
    } catch (_) { /* no body — use defaults */ }

    // Fetch all terms + already-imaged term_ids
    const [{ data: allTerms, error: termsErr }, { data: existing, error: imgErr }] = await Promise.all([
      supabase.from("terms").select("id, term, definition, metaphor").order("section_id").order("block_number").order("order"),
      supabase.from("term_images").select("term_id"),
    ]);
    if (termsErr) throw termsErr;
    if (imgErr) throw imgErr;

    const haveImage = new Set((existing ?? []).map((r: any) => r.term_id));
    const missing = (allTerms ?? []).filter((t: any) => !haveImage.has(t.id));

    if (dryRun) {
      return new Response(JSON.stringify({
        total_terms: allTerms?.length ?? 0,
        already_have_image: haveImage.size,
        missing: missing.length,
        sample: missing.slice(0, 10).map((t: any) => t.term),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const slice = missing.slice(0, limit);
    const results: { term: string; ok: boolean; error?: string }[] = [];
    let success = 0;

    for (const t of slice) {
      try {
        await generateOne(supabase, LOVABLE_API_KEY, t);
        results.push({ term: t.term, ok: true });
        success++;
        console.log(`✅ Generated image for: ${t.term}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ term: t.term, ok: false, error: msg });
        console.error(`❌ Failed for ${t.term}:`, msg);
      }
      // brief delay to respect rate limits
      await sleep(1500);
    }

    return new Response(JSON.stringify({
      total_terms: allTerms?.length ?? 0,
      already_had_image: haveImage.size,
      missing_before: missing.length,
      processed: slice.length,
      success,
      failed: slice.length - success,
      remaining: Math.max(0, missing.length - slice.length),
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Backfill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
