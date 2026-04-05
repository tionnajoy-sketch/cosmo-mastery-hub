import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_VOICE_ID = "b3Sj49ffEoyFHYHBRE2z";
const DEFAULT_SETTINGS = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0.35,
  use_speaker_boost: true,
  speed: 0.95,
};

function createBrowserFallbackResponse(reason: string) {
  return new Response(
    JSON.stringify({ fallback: "browser", reason, error: reason }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-TTS-Fallback": "browser",
      },
    }
  );
}

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, voiceId, voiceSettings, usageType } = body;

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    if (!text || text.length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmedText = text.slice(0, 5000);
    const activeVoiceId = voiceId || DEFAULT_VOICE_ID;
    const activeSettings = voiceSettings || DEFAULT_SETTINGS;
    const activeUsageType = usageType || "dynamic";

    // Hash includes text + voiceId + settings for unique cache key
    const cacheKey = `${trimmedText}|${activeVoiceId}|${JSON.stringify(activeSettings)}`;
    const textHash = await hashText(cacheKey);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("tts_cache")
      .select("storage_path, id")
      .eq("text_hash", textHash)
      .maybeSingle();

    if (cached?.storage_path) {
      const { data: fileData, error: dlError } = await supabaseAdmin.storage
        .from("tts-cache")
        .download(cached.storage_path);

      if (fileData && !dlError) {
        console.log("TTS cache HIT:", trimmedText.slice(0, 60));
        // Increment cache hits (fire-and-forget)
        supabaseAdmin
          .from("tts_cache")
          .update({
            cache_hits: (cached as any).cache_hits ? (cached as any).cache_hits + 1 : 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq("id", cached.id)
          .then(() => {});

        return new Response(fileData, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
        });
      }
      console.warn("Cache file missing, regenerating:", cached.storage_path);
    }

    // Cache miss — call ElevenLabs
    console.log("TTS cache MISS:", trimmedText.slice(0, 60));

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${activeVoiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: activeSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      if (response.status === 429) {
        return createBrowserFallbackResponse("Voice rate limited. Please wait a moment.");
      }
      if (errorText.includes("quota_exceeded") || errorText.includes("insufficient_credits")) {
        return createBrowserFallbackResponse("Voice credits exhausted");
      }
      return createBrowserFallbackResponse(`Voice temporarily unavailable (${response.status})`);
    }

    const audioBytes = await response.arrayBuffer();
    const audioUint8 = new Uint8Array(audioBytes);

    // Store in cache
    const storagePath = `${textHash}.mp3`;
    const cachePromise = (async () => {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from("tts-cache")
          .upload(storagePath, audioUint8, {
            contentType: "audio/mpeg",
            upsert: true,
          });
        if (uploadError) {
          console.error("Cache upload error:", uploadError.message);
          return;
        }
        await supabaseAdmin.from("tts_cache").upsert(
          {
            text_hash: textHash,
            text_preview: trimmedText.slice(0, 100),
            original_text: trimmedText,
            storage_path: storagePath,
            voice_id: activeVoiceId,
            voice_settings: activeSettings,
            usage_type: activeUsageType,
            cache_hits: 0,
            is_always_cache: ["greeting", "onboarding", "affirmation", "lesson"].includes(activeUsageType),
            last_accessed_at: new Date().toISOString(),
          },
          { onConflict: "text_hash" }
        );
        console.log("TTS cached:", trimmedText.slice(0, 60));
      } catch (e) {
        console.error("Cache save error:", e);
      }
    })();

    await Promise.race([cachePromise, new Promise((r) => setTimeout(r, 3000))]);

    return new Response(audioUint8, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return createBrowserFallbackResponse(e instanceof Error ? e.message : "Unknown error");
  }
});
