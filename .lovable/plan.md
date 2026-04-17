

User wants 4 changes:
1. **Word-by-word highlighting during audio playback** — sync TTS with visible text highlighting
2. **Collapsible DNA Code sections** — each section on LearningDNAPage as its own accordion
3. **Guided DNA navigation** — step-by-step guidance through sections so students don't skip
4. **Convert hamburger menu → button grid** — accessible from every screen

Let me check key files quickly to confirm scope.

Investigating: SpeakButton (TTS source), LearningDNAPage structure, AppHeader menu.

Already have:
- `SpeakButton.tsx` uses `fetchTTSWithFallback` returning `HTMLAudioElement` 
- Browser TTS uses `SpeechSynthesisUtterance` which supports `boundary` event for word timing
- ElevenLabs audio doesn't have word boundaries — need fallback estimation (split text by words, time-distribute by audio duration)
- `LearningDNAPage` has 6+ sections rendered as `SectionCard` components in a single scroll
- `AppHeader` uses `DropdownMenu` with list items

## Plan

### 1. Word-by-word audio highlighting
Create a new `HighlightedSpeech` component (and `useSpeechHighlight` hook) that:
- Wraps text in word-spans with index keys
- For browser TTS: use `utterance.onboundary` event (`charIndex`) to compute current word
- For ElevenLabs audio: estimate word timing by `audio.duration / wordCount` and update on `audio.ontimeupdate`
- Active word gets highlighted style (yellow/primary background, slight scale)
- Add new exported helper in `browserTTS.ts` to surface word-boundary callbacks
- Update `SpeakButton` to optionally accept `targetRef` or `onWordChange` callback OR introduce a sibling component `<ReadAlongText text={...} />` with built-in play button

**Approach**: Add a new component `src/components/ReadAlongText.tsx` — drop-in replacement for paragraphs that need read-along. Wraps text + play button + word highlighting. Keep `SpeakButton` unchanged for icon-only uses.

Apply on:
- LearningDNAPage section bodies
- WelcomePage foreword/about/method text
- LearningOrbDialog definition/information cards
- TermListItem definition

### 2. Collapsible DNA sections
Refactor `LearningDNAPage`:
- Wrap each `SectionCard` in `Accordion` from `@/components/ui/accordion`
- Default: only first section open
- Each section header shows: icon, title, completion checkmark, chevron
- Persist open state per section in localStorage

### 3. Guided DNA navigation
Add a "step indicator" + "Next Section" button at the bottom of each opened DNA section:
- Track which sections user has viewed (localStorage `dna_sections_viewed`)
- "Continue to: [Next Section Name]" button auto-scrolls + opens next accordion
- Top progress bar: "Section 2 of 6 — keep going"
- First-time visitor: only first section enabled, others locked with "Read previous section first" tooltip until viewed
- Add a "Start Tour" CTA at top to walk through all sections sequentially

### 4. Menu as button grid + global access
Refactor `AppHeader` dropdown:
- Replace `DropdownMenu` with `Sheet` (slide-in from right)
- Inside sheet: 2-column grid of large tap-target buttons with icon + label (matching the reference screenshot's tile style — gradient backgrounds, rounded corners, icon centered, label below)
- Keep grouped sections: Core (Dashboard, Learn, Practice, Progress, Final Exam), Resources (Foreword, Ask TJ, TJ Cafe, Journal, DNA), Premium (Create With TJ, My Modules), Account (Sign Out)
- `AppHeader` already renders on most pages — confirm it's on every screen; if any page lacks it, add it
- Menu button stays in top-right always; sheet has explicit close button

### Files to create
- `src/components/ReadAlongText.tsx` — text + play button with word-by-word highlight
- `src/hooks/useWordHighlight.ts` — handles boundary events + time-based fallback
- `src/components/AppMenuSheet.tsx` — button-grid navigation sheet

### Files to modify
- `src/lib/browserTTS.ts` — expose `onBoundary` callback through `fetchTTSWithFallback` options; attach to browser TTS shim
- `src/components/SpeakButton.tsx` — optional `onWordChange` prop forwarding
- `src/components/AppHeader.tsx` — replace dropdown with sheet trigger
- `src/pages/LearningDNAPage.tsx` — accordion structure + guided navigation + progress + lock state
- `src/pages/WelcomePage.tsx` — use `ReadAlongText` for foreword/about/method
- `src/components/LearningOrbDialog.tsx` — use `ReadAlongText` for definition + information cards
- `src/components/TermListItem.tsx` — use `ReadAlongText` for definition
- Verify `AppHeader` is present on: SectionPage, StudyPage, ActivityPage, QuizPage, all exam pages — add if missing

### Technical notes
- Word highlighting uses `<span data-word-idx={i}>` wrappers; active span gets `bg-primary/20 rounded px-0.5 transition-colors`
- For browser TTS: `utterance.addEventListener('boundary', e => onWord(e.charIndex))` then map char→word index
- For ElevenLabs (no boundary events): on `play` capture `audio.duration`, then `setInterval` (or `requestAnimationFrame`) computes `currentWord = floor(audio.currentTime / audio.duration * wordCount)` — accurate enough for read-along
- Pause/stop/seek all reset highlight
- Accordion uses existing `@/components/ui/accordion` (Radix); state stored in `useState<string[]>` synced to localStorage
- Sheet uses existing `@/components/ui/sheet`; grid uses Tailwind `grid grid-cols-2 gap-3`

