

## Plan: Add Scripture Tab to Term Card

### What Changes

Add a new "Scripture" tab to `UploadedTermCard` that only appears when the block has `source_text` or `page_reference`. This separates the full passage reading from the definition tab, giving students a dedicated space to study the source material.

### File: `src/components/UploadedTermCard.tsx`

**1. Extend TabType** (line 51)
- Add `"scripture"` to the `TabType` union

**2. Add tab icon** (lines 75-86)
- Add `scripture: <BookOpen />` to `uploadedTabIcons`

**3. Add tab entry** (lines 91-102)
- Insert a conditional entry after "definition": `...(hasScripture ? [{ key: "scripture", label: "Scripture" }] : [])`
- `hasScripture` = `!!(block.source_text || block.page_reference)`

**4. Add render case** in `renderContent()` (after the definition case, ~line 217)
- New `case "scripture"` that displays:
  - The `page_reference` as a header with BookOpen icon
  - The `source_text` in a spacious, readable blockquote format (larger text, more padding than the inline version in definition)
  - A SpeakButton to read the passage aloud
  - A BrainNote: "Reading the original passage helps you connect the concept to its source context."

**5. Remove scripture from definition tab** (lines 203-214)
- Remove the `page_reference` badge and `source_text` blockquote from the definition case since they now have their own tab
- Keep the `page_reference` as a small subtitle only (one line, muted)

### Files to Modify
1. `src/components/UploadedTermCard.tsx` — add Scripture tab type, icon, conditional tab entry, render case, simplify definition tab

