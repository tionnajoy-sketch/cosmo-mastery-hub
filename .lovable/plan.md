

## Plan: Unify Module View with Colorful Game Grid

**Goal**: Replace the current whiteboard-style term list in `ModuleViewPage.tsx` with the same dark-themed, colorful tile grid used in `GameGridPage.tsx`.

---

### What Changes

**File: `src/pages/ModuleViewPage.tsx`** — Full visual overhaul

1. **Dark background** — Match the Game Grid's gradient (`hsl(240 15% 8%)` to `hsl(260 20% 12%)`)

2. **Stats strip at top** — Show streak, module block count, mastered count, and coins in the same glassmorphic stat cards

3. **Replace whiteboard term list with colorful tile grid** — Use the same `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` layout with:
   - `TILE_COLORS` array for gradient backgrounds per tile
   - Status-based coloring (gold for mastered, green for completed, default gradients for new/active)
   - Status badges (NEW / IN PROGRESS / MASTERED)
   - Progress bars showing layers completed
   - Hover scale animations
   - Trophy/CheckCircle icons

4. **Group by block number** — Keep the block-based grouping but use the same section divider style (gold text, horizontal gradient lines, collapsible toggle, progress bar per block)

5. **Block action buttons** — Keep Learn/Practice/Quiz buttons below each block group, styled to match the dark theme (outline buttons with accent colors)

6. **Quiz Bank card** — Restyle to match the dark theme

7. **Remove** the TJ background photo split layout and whiteboard container — replace entirely with the grid experience

### Technical Details

- Import `TILE_COLORS` pattern (or define matching array) and status badge logic from GameGridPage
- Track completed terms via `completedTerms` set to determine tile status (new vs completed vs mastered)
- Each tile click continues to open `LearningOrchestrator` as it does now
- Mobile header simplified to dark gradient with module title

