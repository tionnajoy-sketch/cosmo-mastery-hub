## What's already done
- Database tables `tj_lessons` and `tj_lesson_reflections` exist with RLS and grants.
- Melanin lesson has been seeded with full content (purpose, definition, word origin, all 7 layers, awareness, reflect prompt, open-response assess, TJ Insight, related concepts).

## What this build adds

### 1. New route — `/lesson/:slug`
Add to `src/App.tsx`, wrapped in `ProtectedRoute`. Does not touch existing `/learn` flow.

### 2. New page — `src/pages/TJLessonPage.tsx`
A single, premium, Apple/Notion/Headspace-feeling card flow that reads from `tj_lessons`:

- **Sticky header**: cluster label, lesson title, step counter, animated progress bar with each layer's unique color.
- **Card stack** (only layers with content render; advance one at a time with framer-motion crossfade):
  1. Purpose
  2. Definition
  3. Word Origin
  4. Knowledge Web™ — related concepts as pill nodes
  5. Visualize
  6. Apply
  7. Break It Down
  8. Recognize
  9. Metaphor
  10. Information
  11. Awareness
  12. Reflect — prompt + textarea → saves to `tj_lesson_reflections`
  13. Show What You Know — open-response only (no multiple choice), with note that MCQ lives in Quiz/Exam blocks
- Each card: layer icon in tinted chip, color band, layer-tinted shadow glow, large readable body type.
- **Final action**: "Reveal TJ Insight™" button → dark gradient card with the insight quote, "Back to lessons" / "Review lesson" actions.
- **Footer**: persistent `© Tionna Anderson · TJ Anderson Layer Method™` line.

### 3. Design tokens
Uses existing semantic tokens (`background`, `card`, `foreword`, `muted`, `border`). Per-layer accent colors set inline as HSL constants (matches existing 9-layer color memory).

### 4. Open-response only on term lessons
The Assess card uses a textarea — keeps the "no MCQ in lesson flow" rule from the earlier task. Multiple choice stays in Quiz, Comprehension, and Final Exam routes (unchanged).

### 5. Reflection journal write
`Save to my journal` inserts into `tj_lesson_reflections` (user_id, lesson_slug, reflection). RLS already enforces per-user.

## Files touched
- `src/pages/TJLessonPage.tsx` — new
- `src/App.tsx` — add `<Route path="/lesson/:slug" …>`

## Not in this pass (per earlier scope)
- Authoring content for the other 9 Skin Structure terms
- Replacing the existing `/learn` flow
- Knowledge Web graph visualization (uses pill chips for now; graph view comes in a follow-up)

## How to verify
Navigate to `/lesson/melanin` after login. Step through all 13 cards, save a reflection, reveal the TJ Insight.
