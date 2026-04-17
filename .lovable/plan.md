

User wants the DNA primer (Step 1) to be interactive: instead of static text, each learning style and each DNA component should be a clickable tab/card that expands to show its full definition.

Let me check the current LearningDNAPage Step 1 structure quickly.
<lov-tool-use id="toolu_vrtx_01UfmsbiQGkRyvtGcd9WWFkG" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/LearningDNAPage.tsx\", \"lines\": \"1-120\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01JJ1JoGr1JVz3hNkizL4Etq" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/LearningDNAPage.tsx\", \"lines\": \"1-200\"}">
</lov-tool-use>
I have enough context. The user wants the learning styles (Visual, Metaphorical, Reflective, Analytical, Informational, Applied) and the DNA segments (Layer Strength, Engagement, Retention, Confidence) to be clickable tabs that reveal definitions when clicked.

<lov-plan>

## Plan: Interactive Tabs for Learning Styles & DNA Segments

The user wants the **6 learning styles** and the **4 DNA segments** in the primer/intro area of the Learning DNA page to be clickable — each one reveals a clear, plain-language explanation when tapped. Right now they're either static labels or single-glance text.

### What I'll change

**File: `src/pages/LearningDNAPage.tsx`** — only one file touched.

#### 1. Learning Styles tab group (Step 1 of the intro)

Replace the static style chips with a `Tabs` component (using existing `@/components/ui/tabs`) containing 6 tabs:

| Tab | Definition (shown on click) |
|---|---|
| **Visual** | You learn best by seeing — diagrams, colors, charts, and imagery anchor concepts in your memory. |
| **Metaphorical** | You learn best through stories and comparisons — when a new idea is tied to something familiar, it sticks. |
| **Reflective** | You learn best by pausing to think — journaling, summarizing, and asking "what does this mean to me?" |
| **Analytical** | You learn best by breaking things apart — definitions, structure, logic, and step-by-step reasoning. |
| **Informational** | You learn best with detailed reading — facts, context, and the "why" behind every concept. |
| **Applied** | You learn best by doing — practice problems, real-world scenarios, and hands-on examples. |

Each tab shows: icon + label header, plain definition, "How TJ teaches you this way" sentence, and a "ReadAlong" listen button. The user's matched style gets a small "Your style" badge on its tab trigger.

#### 2. DNA Segments tab group (Step 1 of the intro, below styles)

Replace the static `LEGEND_ITEMS` grid with a 4-tab group:

| Tab | Definition (shown on click) |
|---|---|
| **L — Layer Strength** | The first letter. Shows which learning approach unlocks your brain fastest (e.g., V = Visual). TJ leads every lesson with this layer. |
| **E — Engagement** | The number 0–9. Measures how much content you can take in at once. Lower = shorter blocks. Higher = deeper dives. |
| **R — Retention** | The uppercase letter A–Z. Tracks how well concepts stick. A–H = building, I–Q = developing, R–Z = strong recall. |
| **C — Confidence** | The lowercase letter a–z. Tracks how sure you feel. Lower = more encouragement and smaller steps. Higher = harder challenges. |

Each tab shows: the segment letter visualized as a tile, the plain definition, "What TJ adjusts for you," and the user's current value highlighted (e.g., "Yours: 7/9").

#### 3. Visual treatment

- Tabs styled as **horizontally scrollable pill buttons** on mobile (595px viewport) since 6 tabs won't fit in a row otherwise.
- Active tab: filled background with the style's color.
- Inactive tabs: subtle outline.
- Content area: animated fade-in (`AnimatePresence`) when switching tabs.
- Default selected tab: the user's own style/value, so they see themselves first.

### Technical notes

- Use existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`.
- Add two small data arrays (`LEARNING_STYLES_INFO` and `DNA_SEGMENTS_INFO`) at top of file alongside existing constants.
- Wrap definitions in `ReadAlongText` so the audio-highlight feature applies here too.
- No DB changes, no new files, no other pages affected.

