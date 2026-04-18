

User wants every term across every section to have a real-life image. Currently term_images are sparse — only some have generated images. The existing `generate-term-image` edge function creates illustrated diagrams (textbook style). User specifically wants **real-life photos**, not illustrations.

Let me check counts and what's missing.

I have:
- `terms` table with all terms across sections
- `term_images` table linking term_id → image_url (in `term-images` public bucket)
- `generate-term-image` edge function using `google/gemini-3-pro-image-preview` with prompt for "realistic anatomical or scientific illustration"

Two things to fix:
1. Backfill images for every term that doesn't have one
2. Update prompt to produce **real-life photographs** not illustrations

## Plan

### 1. Update `generate-term-image` prompt
Rewrite the prompt to request **photorealistic, real-life photography** instead of textbook illustrations:
- "Photorealistic, real-life photograph"
- For anatomy terms (skin layers, muscles): use medical/microscopy photography style or real cosmetology-classroom photos
- For tools/products (combs, shears, chemicals): real product photography
- Keep the strict "no text, no labels, no words" rules
- Keep the existing model `google/gemini-3-pro-image-preview` (highest quality for realism)

### 2. Add a batch backfill edge function
New function `backfill-term-images` that:
- Queries all `terms` left-joined with `term_images`
- For each term missing an image, calls the same generation logic (sequential with small delay to respect rate limits)
- Logs progress and returns a summary
- Idempotent — skips terms that already have an image

### 3. Add an admin trigger button
In `VoiceCacheDashboard` (existing admin-style page) or a tiny new section, add a "Backfill Missing Term Images" button that calls the new function and shows progress. Single click → server runs through all missing terms in the background.

Alternative simpler path: run backfill once via a one-shot script and don't ship a UI button. **Recommended:** ship the button so the user can re-run it any time new terms are added.

### 4. Improve `GameGridPage` image handling
Currently term tiles only show images that already exist. After backfill that's fine — but also add a tiny lazy on-demand fetch: if a tile renders without an image, fire `generate-term-image` quietly so it appears next visit. (This guarantees no term ever stays imageless.)

### Files to change
- `supabase/functions/generate-term-image/index.ts` — rewrite prompt for real-life photography
- `supabase/functions/backfill-term-images/index.ts` — **new** batch function
- `src/pages/VoiceCacheDashboard.tsx` — add "Backfill Term Images" admin button + progress display
- `src/pages/GameGridPage.tsx` — quiet on-demand fallback generation for any tile rendered without an image

### Notes
- No DB schema changes needed — `term_images` table already exists with the right shape
- Bucket `term-images` is already public
- Per-term generation cost: one Gemini Pro Image call. If there are ~200 terms total, the backfill takes ~5–10 minutes server-side — fine as a one-time job.
- All existing functionality (quizzes, activities, learning flow, DNA) untouched.

