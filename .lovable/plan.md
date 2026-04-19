

## Plan: Collapsible Block Sections inside Learning Layers

Goal: Reduce cognitive overload by wrapping the long-form content inside each layer in a consistent, DNA-aware collapsible block component. Nothing is removed — only reorganized.

### 1. New component: `LayerBlockSection`

Create `src/components/LayerBlockSection.tsx` — a reusable collapsible block built on existing `Collapsible` (`@/components/ui/collapsible`), styled to match the current step card look.

Props:
- `title` (string) — e.g. "Root Word", "Apply It"
- `icon` (emoji or lucide icon)
- `accentColor` (string — the current step color)
- `defaultOpen` (boolean — driven by DNA)
- `emphasized` (boolean — adds glow border for prioritized blocks)
- `children` — the content

Behavior: Tap header → expand/collapse with smooth chevron rotation and motion fade. Mirrors the visual language already used in the "information" step section cards.

### 2. New helper: `getBlockOpenState(dna, blockType)`

Add to `src/components/LayerBlockSection.tsx` (or `src/lib/layerBlockState.ts`).

Reads the existing DNA adaptation context (already available via `useDNAAdaptation()`) and returns `{ defaultOpen, emphasized }` for each block type:

| Block | Low engagement | High engagement | Low retention | Applied learner |
|---|---|---|---|---|
| Key Concept | always open | always open | open + emphasized | open |
| Root Word | closed | open | open + emphasized | closed |
| Apply It | closed | open | closed | open + emphasized |
| Think About It | closed | open | closed | closed |
| Go Deeper | closed | open | closed | closed |

Always-visible: Key Concept (rendered without a Collapsible wrapper).

### 3. Refactor target areas (no content deleted)

Apply `LayerBlockSection` wrapping in `src/components/LearningOrbDialog.tsx` and `src/components/LearningOrbStepContent.tsx` where the long-form content lives:

**`information` step (slideshow / Guided Engagement — biggest win)**
Currently renders 5 auto-generated `##` sections inline. Restructure into:
- **Key Concept** (always visible) → first 1–2 sentences of "Simple Explanation"
- **Root Word** (collapsible) → reuses `EtymologyBreakdown` content trimmed to roots only
- **Apply It** (collapsible) → "Why It Matters" + "How This Fits You" sections
- **Think About It** (collapsible) → 1-line reflection prompt derived from the metaphor
- **Go Deeper** (collapsible) → "The Lesson" + "History & Origin" + remaining `expandedInfo`
- TJ Learning Studio stays at the bottom unchanged

**`breakdown` step**
Wrap `EtymologyBreakdown` output:
- Key Concept: "What this word means" 1-liner
- Root Word: existing decoded parts (collapsible, default open if low retention)
- Go Deeper: pronunciation practice + brain note

**`reflection` & `application` steps**
Light-touch wrap:
- Key Concept: the prompt itself (visible)
- Think About It: textarea + speech-to-text (collapsible, auto-open)
- Go Deeper: metaphor recall card (collapsible)

**`definition` & `metaphor` steps**
Already short — leave as-is. (Per your "do not overwhelm with structure" spirit; collapsibles only where text is heavy.)

### 4. DNA wiring

In `LearningOrbDialog.tsx`, read once at top of `renderContent`:
```ts
const { context } = useDNAAdaptation(); // already imported
const blockState = (type) => getBlockOpenState(context, type);
```
Pass `defaultOpen` and `emphasized` from `blockState("apply")` etc. into each `LayerBlockSection`.

Equivalent wiring in `LearningOrbStepContent.tsx` (it doesn't currently use the hook — add the import).

### 5. Visuals

- Collapsed header: subtle tinted background (`${stepColor}08`), small icon, title, chevron right
- Expanded: chevron rotates down, content fades in (motion), 1px divider
- Emphasized variant: 2px border in `stepColor`, soft shadow `0 2px 8px ${stepColor}20`
- All preserve the existing step color theme — no new palette

### Files

**New**
- `src/components/LayerBlockSection.tsx`

**Modified**
- `src/components/LearningOrbDialog.tsx` — wrap `information`, `reflection`, `application` step content
- `src/components/LearningOrbStepContent.tsx` — wrap `breakdown`, `practice` step content; import `useDNAAdaptation`

### Notes
- Zero changes to step ordering, DNA logic, or edge functions
- All current copy, audio, brain notes, speech-to-text, and Learning Studio remain
- Mobile-friendly: collapsed sections drastically shorten initial scroll height
- Accessibility: Radix Collapsible already handles ARIA + keyboard

