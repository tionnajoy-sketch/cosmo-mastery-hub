
Goal: make the lesson view behave like a true full-page learning screen: the teaching-mode menu stays accessible above the lesson text, long content scrolls naturally on phone/tablet/desktop, and narration begins automatically when a step opens.

What I found:
- `src/components/LearningOrbDialog.tsx` already has a scroll container, but the full-screen dialog layout still risks scroll trapping because the dialog root uses a grid wrapper and the flex column ancestors do not clearly opt into shrinking/scrolling behavior.
- The “How TJ teaches this” menu the user is referring to lives inside `TJLearningStudio`, but in the Information step it is rendered after the long `expandedInfo` block, so the menu can be pushed below the fold.
- `src/components/TJLearningStudio.tsx` still contains a hard stop on long generated content: `overflow-y-auto max-h-[50vh]`, which recreates the trapped-card feeling.
- Auto-read exists in `LearningOrbDialog`, but it only reads the short intro/opening text and step intros. It does not automatically read the main long-form content once that content is actually loaded/generated.

Implementation plan:

1. Rebuild the lesson shell for reliable scrolling
- File: `src/components/LearningOrbDialog.tsx`
- Change the full-screen dialog body from a fragile grid/flex combination to a strict full-height column with `min-h-0` / `min-w-0` on the right ancestors.
- Make the center lesson body the only scrolling region.
- Keep header/progress and step navigation pinned above the content area.
- Preserve iPhone momentum scrolling with `WebkitOverflowScrolling: "touch"`.

2. Move the teaching-mode menu above long-form lesson text
- File: `src/components/LearningOrbDialog.tsx`
- In the Information step, render the `TJLearningStudio` controls before the long explanation block, not after it.
- Add a small section label such as “Choose how TJ teaches this” so slideshow / explain again / audio script is visible immediately.

3. Remove trapped-card scrolling inside TJLearningStudio
- File: `src/components/TJLearningStudio.tsx`
- Remove `max-h-[50vh]` and inner `overflow-y-auto` from the generated-content card.
- Let slideshow, explanation, teach-flow, and audio-script content expand naturally within the page’s main scroll area.
- Keep the controls compact and readable on mobile/tablet.

4. Make long explanation content read like a full-page lesson
- File: `src/components/LearningOrbDialog.tsx`
- Keep the main explanation block in the scrollable body with generous spacing and no inner fixed-height wrapper.
- Verify “Why This Step Matters,” “Explain Again,” slideshow, and deeper explanation all flow in the same vertical reading surface.

5. Make narration start automatically for the visible content
- Files: `src/components/LearningOrbDialog.tsx`, `src/components/TJLearningStudio.tsx`
- Keep the existing auto-voice on open, but extend it so:
  - when expanded information finishes loading, TJ automatically starts reading that explanation;
  - when a TJLearningStudio mode generates content, the first visible teaching output can auto-read as well;
  - slideshow mode can auto-read the current slide’s speaker note/body.
- Ensure manual Speak buttons still work and do not conflict with auto-play.

6. Keep the page “fully open” on tablet/mobile
- Files: `src/components/LearningOrbDialog.tsx`, `src/components/ui/dialog.tsx`
- Audit the dialog wrapper classes so the full-screen lesson is not constrained by inherited modal sizing behavior.
- If needed, introduce a variant-friendly class adjustment so full-screen learning dialogs don’t inherit the default centered modal behavior.

Files to modify:
- `src/components/LearningOrbDialog.tsx`
- `src/components/TJLearningStudio.tsx`
- `src/components/ui/dialog.tsx` (only if the current base dialog wrapper is still constraining the full-screen lesson shell)

Expected result:
- Users can scroll up and down through long lessons smoothly.
- The teaching options menu appears above the text where users can reach it right away.
- Slideshow / explanation / teach-flow content no longer feels trapped inside a card.
- The lesson opens as a true full-page experience.
- TJ begins reading the visible lesson content automatically instead of only reading a short intro.
