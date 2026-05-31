## Goal
Make the Skin Structure & Growth cluster the gold-standard reference for the TJ Anderson Layer Method™ v2.0 — fully authored, visually connected, and wired into the app. This template will be reused for Proverbs, leadership, neuroscience, business, and EI clusters later.

## 1. Schema additions
Add two columns to `tj_lessons`:
- `why_it_matters TEXT` — new layer slotted between Purpose and Definition.
- `accent_color TEXT` — per-lesson signature hue (powers cluster map nodes and lesson glow).

Backfill the existing Melanin row with `why_it_matters` and `accent_color`.

## 2. Static content — 10 lessons (Skin Structure & Growth)
Insert/update one row per term, each containing the full canonical sequence:

`Main Term → Purpose → Why It Matters → Definition → Word Origin → Related Concepts → Visualize → Apply → Breakdown → Recognize → Metaphor → Information → Awareness → Reflect → Assess (open response) → TJ Insight™`

Terms (cluster: "Skin Structure & Growth", with signature colors):
1. Cells — amber
2. Tissue — rose
3. Epidermis — sky blue
4. Dermis — coral
5. Subcutaneous — indigo
6. Melanocyte — violet
7. Melanin — bronze *(already seeded, just backfill new fields)*
8. Keratin — gold
9. Collagen — teal
10. Elastin — emerald

Each `related_concepts` array uses real slugs from the cluster so the Knowledge Web links resolve.

## 3. Lesson page — add the new "Why It Matters" layer
Update `src/pages/TJLessonPage.tsx`:
- Insert `Why It Matters` between Purpose and Definition.
- Use the lesson's `accent_color` (fallback to per-layer color) for the card glow, progress bar fill, and CTA button so each lesson has its own signature feel.
- Knowledge Web pills become clickable — navigate to `/lesson/{slug-of-related}`.

## 4. New cluster landing page — `/cluster/skin-structure-and-growth`
File: `src/pages/TJClusterPage.tsx`. Renders:
- Hero with cluster name, short intent, and persistent copyright.
- **Knowledge Web visualization**: SVG canvas with one node per lesson (positioned in a radial layout, colored by `accent_color`), edges drawn from each lesson's `related_concepts` back to its targets. Hover highlights connected nodes; click opens that lesson.
- Below the web: a clean card grid of all 10 lessons (title, one-line purpose, accent color band, "Begin lesson" link).

Route added in `src/App.tsx`: `/cluster/:slug → TJClusterPage`.

## 5. Wire entry points
- Add a "TJ Layer Method™ v2.0" tile/section to `src/pages/Home.tsx` pointing to `/cluster/skin-structure-and-growth`.
- Add a top-level "Layer Method™ Lessons" link in `src/components/AppMenuSheet.tsx`.
- Leave the existing `/learn` flow untouched.

## 6. Design system
- Cream / off-white card surfaces, generous whitespace.
- Each layer keeps its semantic color (Purpose=amber, Definition=blue, Word Origin=violet, Visualize=sky, Apply=green, Breakdown=orange, Recognize=pink, Metaphor=gold, Information=slate-blue, Awareness=red, Reflect=purple, Assess=mint, Why It Matters=rose).
- Lesson signature `accent_color` overlays via soft glow and CTA tint so two lessons never feel identical.
- All colors expressed as `hsl(...)` constants; semantic tokens used for surfaces.

## Files touched
- Migration: add `why_it_matters`, `accent_color` to `tj_lessons`
- Data: insert/update 10 lessons in `tj_lessons`
- `src/pages/TJLessonPage.tsx` — add Why It Matters layer, accent color, clickable Knowledge Web pills
- `src/pages/TJClusterPage.tsx` — new cluster landing + SVG Knowledge Web
- `src/App.tsx` — register `/cluster/:slug`
- `src/pages/Home.tsx` — v2.0 entry tile
- `src/components/AppMenuSheet.tsx` — menu link

## Not in this pass
- Replacing the existing `/learn` term flow
- Other clusters (Proverbs, leadership, etc.) — this cluster becomes the template they will copy
- Reflection Journal aggregation page (already planned separately)

## How to verify
1. `/cluster/skin-structure-and-growth` renders the 10-node Knowledge Web; hover/click works.
2. Open any node → full lesson card flow includes the new Why It Matters card with the lesson's accent color.
3. Knowledge Web pill inside a lesson jumps to the related lesson.
4. Home dashboard and menu both expose the new v2.0 entry.
