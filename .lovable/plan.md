

## Plan: Add Scripture References to Genesis Study Blocks

### What Changes

The database already stores `page_reference` (e.g., "Genesis 5:16-25") and `source_text` on each block. These fields just need to be surfaced in the UI.

### 1. Extend `UploadedBlock` interface
**File: `src/components/UploadedTermCard.tsx`** — Add optional fields to the interface:
- `page_reference?: string`
- `source_text?: string`
- `section_title?: string`

### 2. Show scripture reference in the Definition tab
**File: `src/components/UploadedTermCard.tsx`** — In the `"definition"` case of `renderContent()`:
- Add a styled scripture reference badge above the definition showing `block.page_reference` (e.g., "Genesis 6:11-17")
- If `source_text` exists, show it in a styled blockquote below the definition so students can read the actual passage

### 3. Show scripture reference in the block header
**File: `src/components/UploadedTermCard.tsx`** — In the card header area where `block.term_title` is displayed:
- Add a small subtitle line showing `block.page_reference` in muted text beneath the title

### 4. Pass the fields through from ModuleViewPage
**File: `src/pages/ModuleViewPage.tsx`** — The `select("*")` query already fetches all columns including `page_reference`, `source_text`, and `section_title`. The spread `...b` in the mapping already passes them through. No changes needed here.

### Files to Modify
1. `src/components/UploadedTermCard.tsx` — Add fields to interface + display scripture reference in definition tab and header

