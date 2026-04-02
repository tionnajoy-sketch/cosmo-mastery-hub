import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { text } = await req.json();
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

    // Trim to 5000 chars max for TTS
    const trimmedText = text.slice(0, 5000);

    // Create supabase admin client for cache operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Hash the text to check cache
    const textHash = await hashText(trimmedText);

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("tts_cache")
      .select("storage_path")
      .eq("text_hash", textHash)
      .maybeSingle();

    if (cached?.storage_path) {
      // Cache hit — fetch from storage and stream back
      const { data: fileData, error: dlError } = await supabaseAdmin.storage
        .from("tts-cache")
        .download(cached.storage_path);

      if (fileData && !dlError) {
        console.log("TTS cache hit:", trimmedText.slice(0, 60));
        return new Response(fileData, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
          },
        });
      }
      // If download failed, fall through to generate fresh
      console.warn("Cache file missing, regenerating:", cached.storage_path);
    }

    // Cache miss — call ElevenLabs
    const voiceId = "b3Sj49ffEoyFHYHBRE2z";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Voice rate limited. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errorText.includes("quota_exceeded") || errorText.includes("insufficient_credits")) {
        return new Response(JSON.stringify({ error: "Voice credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`ElevenLabs API error [${response.status}]: ${errorText}`);
    }

    // Read the full audio into memory so we can both cache and return it
    const audioBytes = await response.arrayBuffer();
    const audioUint8 = new Uint8Array(audioBytes);

    // Store in cache (fire-and-forget, don't block the response)
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
            storage_path: storagePath,
          },
          { onConflict: "text_hash" }
        );
        console.log("TTS cached:", trimmedText.slice(0, 60));
      } catch (e) {
        console.error("Cache save error:", e);
      }
    })();

    // Wait briefly for cache to save, but don't block too long
    await Promise.race([cachePromise, new Promise((r) => setTimeout(r, 3000))]);

    return new Response(audioUint8, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
