

User says: pictures show on the Game Grid tiles, but inside the actual learning flow (Visualize step + slideshow) they don't appear. Let me investigate.

The Visualize step uses `TJVisualEngine`. Looking at the code from context:
- `TJVisualEngine` requires `termId` to auto-generate AND to display
- It calls `generate-term-image` edge function on mount if `!imageUrl && termId`
- BUT it does NOT pre-load an existing `term_images` row first — it relies on `existingImageUrl` prop

Let me check how `LearningOrbDialog` / `LearningOrbStepContent` pass props to TJVisualEngine.
