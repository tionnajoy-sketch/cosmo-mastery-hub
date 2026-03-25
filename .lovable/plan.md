

# Redesign: Central Term Box with Surrounding Layer Nodes

## What You Asked For

1. **Break It Down** should show the actual word root/etymology (e.g., "Epi = upon, Dermis = skin"), not just split on capital letters
2. **New layout**: A large central box displaying the full term and definition prominently (never cut off), with the 9 learning layer nodes arranged around the box perimeter, connected by arrows showing the sequence

## Current State

The LearningOrb is a vertical stack of accordion-style cards. The "Break It Down" step just splits the term on capital letters, which is not meaningful etymology. The term header is a simple `h2` above the card list.

## Plan

### 1. Update "Break It Down" Content (Etymology/Root Words)

- Replace the naive `split(/(?=[A-Z])/)` logic with a proper etymology display
- Use the block's existing data fields (pronunciation, definition) to present root word analysis
- Show a structured breakdown: **Root** → meaning, **Prefix** → meaning, **Suffix** → meaning
- Add guided text: "This word comes from..." with the origin and meaning of each part
- For terms where roots aren't stored in the database, generate an AI-based breakdown using the term title and definition as context (display a "decode" button that calls the AI mentor edge function)

### 2. Redesign Layout: Central Box + Surrounding Nodes

Replace the vertical card stack with:

```text
         ┌──────────────────────────┐
    [1]──┤                          ├──[2]
         │                          │
    [9]  │     EPIDERMIS            │  [3]
     │   │                          │   │
    [8]  │  "The outermost layer    │  [4]
         │   of the skin..."        │
    [7]──┤                          ├──[5]
         └──────────┬───────────────┘
                    [6]
```

**Central box:**
- Large, prominent card with the term title in bold display font (full width, never truncated)
- Definition text below the term
- Pronunciation if available
- Sound toggle in corner

**Surrounding nodes:**
- 9 circular nodes positioned around the box perimeter using CSS absolute positioning
- Each node shows its step number, icon, and color
- Arrows/connectors drawn between nodes (CSS borders or SVG lines) showing the 1→2→3... sequence
- Locked nodes appear grayed with a lock icon
- Completed nodes show a checkmark
- Active/expanded node glows

**Node tap behavior:**
- Tapping a node opens a full-width panel below the central box (or as an overlay)
- The panel slides in with staged content reveal (same as current)
- "Continue" button closes and advances to the next node
- Progress bar remains at top

### 3. Responsive Considerations

- On mobile (<640px): nodes arranged in two columns flanking the central box, or in a horizontal scrollable row above/below
- Central box takes full width with generous padding so term is never cut off
- Node circles sized at ~44px for tap targets

### 4. Files Changed

- **`src/components/LearningOrb.tsx`** — Full layout rewrite: central box + positioned nodes replacing the vertical card stack; updated "breakdown" content renderer with etymology display

### 5. Technical Approach

- Use CSS Grid or absolute positioning within a relative container for node placement
- Nodes arranged: 3 on top edge, 1 on each side (×2 per side = 4), 2 on bottom — adjusted based on how many active steps exist
- SVG overlay or CSS `::after` pseudo-elements for arrow connectors between nodes
- Expanded content rendered in a separate panel below the grid, outside the node positioning container
- All existing step content renderers, sound effects, progress tracking, and completion logic preserved

