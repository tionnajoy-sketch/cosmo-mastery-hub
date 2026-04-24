## Goal

Replace the current low-saturation "white card on cream" look with a consistent **editorial magazine** treatment that runs across every tab in the lesson dialog (Visualize → Define → Break It Down → Recognize → Metaphor → Information → Reflect → Apply → Assess) — colorful, branded per step, but visually consistent in rhythm.

## Visual direction

Think *Vogue* / *The Gentlewoman* / *Kinfolk*:

- **Issue header on every step** — small uppercase eyebrow ("Layer 06 — Information") + oversized Playfair display headline in the step's signature color
- **Colored "spread" background** — instead of plain cream, each step gets a soft tinted backdrop derived from its signature color (e.g. Visualize=blue wash, Information=pink wash, Apply=green wash). Same intensity across steps for consistency.
- **Color-blocked section cards** — replace gray-bordered white cards with full-color gradient header bars + cream body, matching the step's gradient. Numbered ("01 / 06") like magazine articles.
- **Drop cap on body paragraphs** — first letter of each section body in oversized Playfair, colored in step accent. Strong magazine signature.
- **Pull quotes** — Memory Cue, Mentor Check-In, Affirmation, Metaphor become large italic Playfair pull quotes with colored vertical rules, not boxed cards.
- **Consistent type rhythm** — eyebrows always 10px uppercase tracked, headings always Playfair, body always DM Sans — no exceptions.
- **Subtle paper texture** — very light grain overlay on the dialog background to feel printed, not digital.

## What changes

```text
Before                              After
────────────────────────────────    ────────────────────────────────
[ white card ]                      LAYER 06 · INFORMATION
[ small color icon + heading  ]      ─────────────────────────────
[ gray body text              ]     The Breakdown
[ ──── ]                            of the System
[ small icon + heading        ]
[ gray body text              ]     ┃ T he epidermis is not just
                                    ┃   skin. It is a structured
                                    ┃   system designed for
                                    ┃   continuous renewal…

                                    ╱╱  Protect. Present. Renew.
                                    ╱╱  — pull quote in step color
```

## Scope (files touched)

1. **`src/components/LearningOrbDialog.tsx`** — wrap all `renderContent()` cases in a shared `<EditorialSpread>` shell that supplies: tinted background wash, eyebrow ("Layer N · Step Name"), and oversized Playfair title. Replace the existing white card boxes inside Information, Recognize, Visualize, Scripture, Definition, Metaphor, Reflect, Apply, Assess with the new editorial card treatment.

2. **`src/components/LearningOrbStepContent.tsx`** — same editorial treatment applied to the Information step's lesson_narrative renderer (Key Point, Sections, Memory Cue, Mentor Check-In, Purpose) so the new Epidermis narrative gets the magazine look. Pull quotes for Memory Cue and Mentor Check-In, drop caps on Section bodies, numbered section labels.

3. **`src/index.css`** — add a small set of editorial utility classes:
   - `.editorial-eyebrow` (10px uppercase, tracked, semi-bold)
   - `.editorial-headline` (Playfair, 32-40px, tight leading)
   - `.editorial-body` (DM Sans, generous leading)
   - `.editorial-dropcap` (first-letter pseudo, Playfair, ~52px, colored)
   - `.editorial-pullquote` (Playfair italic, large, with left vertical rule)
   - `.editorial-paper` (very subtle grain overlay)
   - One CSS variable per step (`--editorial-wash`) so the wash color can be set inline per step without re-declaring gradients everywhere.

4. **Step config (top of `LearningOrbDialog.tsx`)** — extend each `STEPS` entry with one new field: `wash` (the soft tinted background for that step). Existing `color` and `gradient` stay; this only adds the soft wash so all 10 steps get a different signature backdrop while sharing the same layout.

## Things explicitly kept the same

- 9-step flow, step order, and DNA-driven reordering
- Tab navigator (`LayerBlockNavigator`), progress bar, TJ avatar caption, "Why This Step Matters" toggle
- Voice/speak buttons, quiz logic, reinforcement gating, coin awards, confetti
- All data sources — still 100% static (no AI calls re-introduced)
- Step signature colors (Visualize blue, Information pink, etc.) — only the surrounding treatment changes

## Out of scope

- The Game Grid, dashboard, and other pages — this is strictly the in-lesson reading experience the user is on right now.
- The `UploadedTermCard` (legacy tabbed view) — it isn't the path the user navigates through; we can apply the same look later if requested.
- Adding new content fields. We're styling existing content only.

## Risks / notes

- The Information step has two renderers (the rich `expandedInfo` block in `LearningOrbDialog.tsx` and the new `lesson_narrative` block in `LearningOrbStepContent.tsx`). Both will get the same editorial treatment so Epidermis (which uses the new path) and other terms (which still use the legacy path) feel identical.
- Drop caps are CSS pseudo-elements — they don't affect content or screen readers.
- No changes to fonts (Playfair Display + DM Sans are already loaded), so no perf hit.
