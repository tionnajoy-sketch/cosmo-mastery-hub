import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AI image generation is disabled (static-content mode).
// This function now only returns an existing cached image if one is already stored.
// It always responds with 200 so the UI never sees a runtime error.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { termId } = await req.json().catch(() => ({}));
    if (!termId) {
      return new Response(JSON.stringify({ image_url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ image_url: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from("term_images")
      .select("image_url")
      .eq("term_id", termId)
      .maybeSingle();

    return new Response(
      JSON.stringify({ image_url: existing?.image_url ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    // Never throw to the client — static mode should be silent
    console.warn("generate-term-image (static mode) error:", e);
    return new Response(JSON.stringify({ image_url: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
