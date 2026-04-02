

## Plan: TTS Audio Caching System — Keep Your Voice, Cut Costs by 90%+

### The Problem
Every time TJ speaks, even if it's the exact same text it already read before, it makes a new API call to ElevenLabs and burns credits. Educational apps repeat the same content constantly — definitions, instructions, explanations, welcome messages.

### The Solution
Build a **server-side audio cache** using the database's file storage. Before calling ElevenLabs, hash the text and check if we already have the audio stored. If yes, serve the cached file instantly (zero credits used, faster playback). If no, call ElevenLabs once, store the result, then serve it.

This means every unique piece of text only costs credits **once, ever**. The second student (or the same student revisiting) gets it for free.

---

### How It Works

```text
User taps "Listen"
       │
       ▼
  Hash the text ──► Check storage for cached audio
       │                    │
       │              Found? ──► YES ──► Stream cached MP3 (0 credits)
       │                    │
       │              NO ───► Call ElevenLabs ──► Save MP3 to storage ──► Stream to user
```

### What Gets Built

**1. Database table: `tts_cache`**
- `id` (uuid), `text_hash` (text, unique index), `text_preview` (first 100 chars for debugging), `storage_path` (text), `created_at` (timestamp)
- RLS: service role only (edge function access)

**2. Storage bucket: `tts-cache`**
- Private bucket, accessed only by the edge function

**3. Updated edge function: `elevenlabs-tts/index.ts`**
- Before calling ElevenLabs: SHA-256 hash the text, query `tts_cache` for a match
- Cache hit: fetch audio from storage bucket, stream it back
- Cache miss: call ElevenLabs, upload the MP3 to storage, insert a `tts_cache` row, stream the audio back
- The client-side code in all 7 files stays completely unchanged — same endpoint, same request format

**4. No client-side changes needed**
- All 7 components (`SpeakButton`, `AIMentorChat`, `AskTJFullScreen`, `LearningOrbDialog`, `TJCafe`, `WelcomePage`, `LearningDNAPage`) already call the same edge function — they'll automatically benefit from caching

### Credit Savings Estimate
- Welcome page narration, term definitions, common explanations: cached after first play
- Returning students hear all previously-generated audio at zero cost
- Only truly new, never-before-spoken text costs credits
- Expected reduction: **80-95% fewer API calls** over time

### Files to Create
- Database migration (new `tts_cache` table + storage bucket)

### Files to Modify
- `supabase/functions/elevenlabs-tts/index.ts` — add cache-check-before-call logic

