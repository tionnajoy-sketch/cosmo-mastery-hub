// Admin utility: clears cached deep_dive_content on terms so the next
// learner view regenerates with the latest TJ Deep Dive logic.
//
// Body options:
//   { mode: "all" }   -> clears every term's deep_dive_content
//   { mode: "stale" } -> clears only rows whose voice_version != current
//   { term_id: "uuid" } -> clears one term
//
// Returns { cleared: number }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Keep this in sync with generate-deep-dive-content's VOICE_VERSION.
const CURRENT_VOICE_VERSION = "tj-deep-dive-v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Service env missing" }, 500);
    }

    // Validate caller is an admin via their JWT.
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin role required" }, 403);

    const body = await req.json().catch(() => ({}));
    const mode: string = body?.mode || "all";
    const termId: string | undefined = body?.term_id;

    let query = admin.from("terms").update({ deep_dive_content: null });

    if (termId) {
      query = query.eq("id", termId);
    } else if (mode === "stale") {
      // Clear rows where voice_version is missing OR != current
      query = query
        .not("deep_dive_content", "is", null)
        .or(
          `deep_dive_content->>voice_version.is.null,deep_dive_content->>voice_version.neq.${CURRENT_VOICE_VERSION}`,
        );
    } else {
      // mode: "all" — clear every cached deep dive
      query = query.not("deep_dive_content", "is", null);
    }

    const { error, count } = await query.select("id", { count: "exact", head: true });
    if (error) {
      console.error("reset-deep-dive-cache update failed", error);
      return json({ error: error.message }, 500);
    }

    return json({ cleared: count ?? 0, mode, voice_version: CURRENT_VOICE_VERSION });
  } catch (e) {
    console.error("reset-deep-dive-cache error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
