

## Plan: Background Document Processing + Resume Incomplete Uploads

### Problem
The upload/processing pipeline runs entirely inside `UploadPage.tsx` as a client-side async function. When the user navigates away, React unmounts the component and kills all in-flight API calls. The module gets stuck in "processing" status with no blocks saved, and there's no way to resume.

---

### What Changes

#### 1. Background Processing Context (New File)

**Create `src/contexts/BackgroundUploadContext.tsx`**

A React context mounted at the App level (never unmounts) that:

- Holds the active processing state (progress, message, moduleId)
- Runs the entire `convertToBlocks` pipeline in a ref-stable callback that survives route changes
- Exposes: `startProcessing(file, options)`, `progress`, `progressMessage`, `isProcessing`, `activeModuleId`
- Shows a persistent floating toast/banner at the bottom of the screen when processing is active (visible on any page)
- On completion, shows a toast with a link to the finished module

The actual processing logic (structure analysis → chunking → API calls → saving blocks) moves here from UploadPage.

#### 2. Simplify UploadPage

**Modify `src/pages/UploadPage.tsx`**

- Remove the `convertToBlocks` function body — instead call `startProcessing()` from the background context
- Keep the file selection UI, page range picker, and mode selector
- When processing is active, show a card saying "Your document is being processed. You can navigate away — we'll notify you when it's done." with a progress bar reading from the context
- When not processing, show the normal upload UI

#### 3. Persistent Processing Indicator

**Create `src/components/BackgroundUploadBanner.tsx`**

A small fixed-position banner at the bottom of the screen (visible on all pages) that shows:
- Module name being processed
- Progress bar + current phase message
- Appears only when background processing is active
- On completion: "✓ [Module Name] is ready!" with a "View Module" link
- Auto-dismisses after 8 seconds on completion

#### 4. Resume/Retry Stuck Modules

**Modify `src/pages/MyModulesPage.tsx`**

- For modules with `status = 'processing'` or `processing_phase != 'ready'`, show a "Retry" button instead of "View"
- Retry deletes existing partial blocks for that module, resets status to 'uploading', and navigates to UploadPage with a query param `?retry=MODULE_ID`
- UploadPage detects the retry param and shows a message: "This module didn't finish processing. Please re-upload the file to try again."

#### 5. Mount Context in App

**Modify `src/App.tsx`**

- Wrap with `BackgroundUploadProvider`
- Render `BackgroundUploadBanner` inside the provider (always visible)

---

### Technical Details

- Processing logic uses refs (not state) for the loop variables so React re-renders on other pages don't interfere with the async pipeline
- Progress updates use `setState` on the context so the banner re-renders across pages
- The context stores `moduleId` so if the user returns to UploadPage mid-processing, it can show the current progress
- No edge function architecture change needed — the same sequential chunk-processing pattern works, just hosted in a persistent context instead of a page component
- For the Bible-sized document that failed: the user will need to re-upload since the partial module has no blocks saved (the blocks are only saved after ALL chunks complete). The retry flow handles this gracefully.

### Files to Create
1. `src/contexts/BackgroundUploadContext.tsx`
2. `src/components/BackgroundUploadBanner.tsx`

### Files to Modify
1. `src/pages/UploadPage.tsx` — delegate processing to context
2. `src/pages/MyModulesPage.tsx` — retry button for stuck modules
3. `src/App.tsx` — mount provider + banner

