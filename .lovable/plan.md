
Goal: make the DNA area truly interactive, ensure deep-teaching content is built into lessons instead of feeling optional/missing, and make narration start cleanly when students enter major screens.

What I found
- The DNA page already has tappable code tiles, but the experience is still light: it shows one short explanation at a time and does not fully translate the whole code into an interactive learner blueprint.
- The deep-teaching structure exists only inside the Information step behind a “Teach Me Deeper” button in `src/components/LearningOrbDialog.tsx`, so students can easily miss it.
- The lesson prompt asks for the right sections, but the UI renders them as one markdown block instead of distinct expandable teaching cards.
- Auto-voice is not global. It exists in isolated places (`WelcomePage`, `LearningOrbDialog`, DNA explainer), and the lesson dialog intentionally skips speaking on the first step (`currentStep > 0`), which makes the first visible screen feel silent.
- The sound toggle currently controls “sounds” in general, but narration is not managed as a shared cross-page system, so page-to-page speaking feels inconsistent.

Implementation plan

1. Upgrade the DNA hub into a true learner profile center
- Enhance `src/pages/LearningDNAPage.tsx` so the code is shown as:
  - full-code summary,
  - interactive tiles for Layer / Engagement / Retention / Confidence,
  - a simple-language “Human Translation” sentence,
  - stronger “How I Learn Best / What Throws Me Off / TJ Recommends Next / Best Study Order” cards.
- Expand each DNA character tap into a richer card with:
  - what this part means,
  - what TJ changes because of it,
  - what the learner may notice in lessons.
- Add a compact numeric/letter legend so users understand why a number or letter maps to “building / developing / strong.”

2. Make deep teaching visible and structured in every lesson
- Refactor the Information step in `src/components/LearningOrbDialog.tsx` so the learner clearly sees the six teaching sections:
  - Simple Explanation
  - The Lesson
  - History & Origin
  - Why It Matters
  - How This Fits You
- Keep the menu-first behavior, but once a learner chooses the deeper lesson, render the response as separate styled sections/cards instead of one long markdown blob.
- Personalize “How This Fits You” more explicitly using DNA and selected TJ tone so it feels learner-specific.

3. Improve the deep-teaching prompt and fallback behavior
- Tighten the AI prompt in `LearningOrbDialog.tsx` so each requested section is always returned with usable content.
- Add graceful fallback text when one section is sparse or missing, especially for History & Origin and learner-fit explanations.
- Use existing tone logic from `useTJTone` so the written teaching voice matches the chosen TJ style even before live voice is restored.

4. Make auto-narration consistent across major pages
- Create a shared narration pattern in `src/lib/browserTTS.ts` (or a small shared helper/hook) to:
  - stop any current narration before new narration starts,
  - support route/screen-level playback,
  - avoid stacking.
- Apply that pattern to:
  - `src/pages/Home.tsx`
  - `src/pages/LearningDNAPage.tsx`
  - `src/pages/WelcomePage.tsx`
  - `src/components/LearningOrbDialog.tsx`
- Ensure the first visible content on entry is narrated, including the first lesson step.

5. Fix the lesson auto-voice behavior
- Update `LearningOrbDialog.tsx` so narration starts on the first visible step instead of skipping step 0.
- Keep the current stop-on-navigation behavior, but make step speech based on visible content and adapted tone.
- For Bible/scripture content, narrate in the right order:
  - reference,
  - scripture text,
  - then the plain explanation.

6. Clarify voice toggle behavior
- Keep the existing header toggle, but treat it as narration control for page guidance as well.
- Ensure manual `SpeakButton` playback and auto-page narration use the same underlying stop/start rules so they do not conflict.
- Preserve browser fallback behavior while paid voice remains limited.

Files to update
- `src/pages/LearningDNAPage.tsx`
- `src/components/LearningOrbDialog.tsx`
- `src/lib/browserTTS.ts`
- `src/pages/Home.tsx`
- `src/pages/WelcomePage.tsx`
- `src/components/SpeakButton.tsx`

Technical notes
- The DNA interactivity is partially there already; this is mainly a UX/data-translation expansion, not a rebuild.
- The deep-teaching content is not absent in logic; it is too hidden and too loosely rendered. The fix is both prompt structure and UI structure.
- The auto-voice issue is architectural: narration is page-local right now, not coordinated app-wide.
- I would preserve the current menu-first Information step behavior and layer the richer teaching experience on top of it rather than reverting to auto-dumping text immediately.
