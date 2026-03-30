

## Plan: Upgrade TJ Cafe + Add My Journal to Menu

Three changes: (A) enhance the Cafe with ambient music, TJ voice-guided meditation/affirmation, and required completion prompts before dismissal; (B) add "My Journal" organized by topic to the navigation menu.

---

### A. TJ Anderson Cafe Overhaul

**File: `src/components/TJCafe.tsx`** — Major rewrite

1. **Ambient R&B Jazz / Sound Bath audio**
   - On open, auto-play a looping ambient jazz audio track using Web Audio API with an oscillator-based generative jazz/ambient soundscape (soft chords, gentle rhythm) since we cannot ship a static audio file through Lovable
   - Alternative: use the ElevenLabs Music API via a new edge function to generate a short jazz loop on first cafe open, cache the blob in state
   - Include a subtle volume slider or mute toggle for the background music

2. **TJ Voice guides meditation and affirmation**
   - Auto-speak the welcome message on cafe open using the existing TTS system (fetch from `elevenlabs-tts`)
   - When breathing exercise starts, TJ's voice narrates each phase ("Breathe in slowly… hold it… now release")
   - After breathing completes, TJ auto-speaks the affirmation
   - Add voice guidance for the stretch prompt as well

3. **Required completion prompts before leaving**
   - Track completion state for 3 required activities: `breathingDone`, `affirmationRead`, `reflectionWritten`
   - Add a short **reflection prompt** textarea: "What's one thing you're proud of from today's study session?" — user must type at least 10 characters
   - Disable the dismiss button until all 3 are completed
   - Show checkmarks next to each completed section
   - Remove the X close button (or only allow close after completion)
   - When manually opened from menu, make prompts optional (add `requiredMode` prop)

4. **Sound bath element**
   - Add a "Sound Bath" section with a binaural-style ambient tone generated via Web Audio API (two slightly detuned sine oscillators creating a calming beat frequency)
   - Toggle on/off, plays underneath the jazz

**New file: `supabase/functions/elevenlabs-music/index.ts`** — Edge function to generate jazz loop via ElevenLabs Music API (prompt: "soft R&B jazz lounge, warm piano, gentle saxophone, slow tempo, relaxing")

---

### B. My Journal — Organized by Topic in Menu

**File: `src/components/AppHeader.tsx`**
- Add "My Journal" menu item with `Lightbulb` or `BookOpen` icon, navigating to `/insights`

**File: `src/pages/InsightsPage.tsx`** — Restructure with topic grouping
- Rename page title to "My Journal"
- Group entries by `sectionName` (topic) using an accordion or collapsible sections
- Each section header shows the topic name and count of entries
- Within each topic, show entries sorted by date (newest first)
- Keep the search bar — it filters across all topics
- Add filter tabs: "All", "Reflections", "Journal Notes"
- Each entry card remains clickable to navigate back to the term

**File: `src/App.tsx`** — Route already exists at `/insights`, no change needed

---

### Technical Details

- **Music generation**: Create `supabase/functions/elevenlabs-music/index.ts` using the ElevenLabs Music API. Cache generated audio in localStorage as base64 to avoid re-generating each time
- **Voice sequencing in Cafe**: Chain TTS calls — welcome message plays first, then breathing narration on start, then affirmation after breathing completes
- **Breathing narration texts**: "Close your eyes… breathe in through your nose… 1, 2, 3, 4", "Now hold it right there… let the stillness fill you", "Slowly release through your mouth… let everything go"
- **Completion tracking**: Local state only (not persisted) — resets each time cafe opens
- **Sound bath**: Two `OscillatorNode`s at 174Hz and 178Hz (4Hz binaural beat in theta range for relaxation), low gain, smooth fade in/out
- **Journal grouping**: Use `reduce()` to group `InsightCard[]` by `sectionName`, render each group in an `Accordion` component

### Files to Create
1. `supabase/functions/elevenlabs-music/index.ts`

### Files to Modify
1. `src/components/TJCafe.tsx` — Full overhaul with music, voice-guided experience, required prompts
2. `src/pages/InsightsPage.tsx` — Rename to "My Journal", add topic grouping with accordions
3. `src/components/AppHeader.tsx` — Add "My Journal" menu item

