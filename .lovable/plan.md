

# Redesign Upload Page → "Create Study Blocks"

## Overview
Rebuild `UploadPage.tsx` with the full structured layout requested, including an Instructor Mode modal dialog, "How This Works" steps, an example section, and updated navigation label.

## Changes

### 1. Update Navigation Label
In `AppHeader.tsx`, rename "Upload to TJ Blocks" to "Create Study Blocks".

### 2. Rebuild UploadPage.tsx
Replace the current page with the full structured layout:

**Header section:**
- Title: "Turn Your Notes Into TJ Anderson Study Blocks"
- Description paragraph explaining the feature

**Mode selection cards:**
- Student Mode card (selectable, purple theme, Sparkles icon, description text)
- Instructor Mode card (selectable, gold theme, Lock icon, "License Required" badge, description text)
- Clicking Instructor Mode opens a Dialog modal instead of just selecting it

**Instructor Mode modal (Dialog):**
- Explains the feature for licensed educators
- Two buttons: "Learn About Instructor Licensing" and "Contact for School Licensing" (mailto link)

**Upload area:**
- "Upload Your Study Material" label
- Drag-and-drop zone with file type info
- Keep existing file handling logic

**"Convert to TJ Blocks" button + progress indicator** (existing logic preserved)

**"How This Works" section:**
- 4 numbered steps with icons
- Each step has title + description

**"What Each TJ Block Includes" section:**
- 6 items: Definition, Visual explanation, TJ-style Metaphor, Affirmation, Reflection prompt, Recall quiz question

**Example section:**
- Gray card showing the skin structure example text

### 3. No database changes needed
Role-based instructor access is already handled client-side with a toast/modal gate. The existing `uploaded_modules` and `uploaded_module_blocks` tables support everything needed.

## Files Modified
- `src/components/AppHeader.tsx` — rename menu item
- `src/pages/UploadPage.tsx` — full redesign

