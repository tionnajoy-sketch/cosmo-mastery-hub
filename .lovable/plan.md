
## Plan: TJ DNA Adaptive Guidance Center + Tone Modes + Bible Scripture-First

This is a large feature set. I'll implement it in phases within this session.

---

### Phase 1: TJ Tone Modes (Replace Paid Voice with Text Tone)

**New file: `src/lib/tjTone.ts`**
- Define 5 tone modes: Hype TJ, Gentle TJ, Calm TJ, Direct TJ, Encouraging TJ
- Each tone has a set of phrase templates, prefixes, and emotional modifiers
- Export a `applyTone(text, toneMode, context)` function that rewrites prompts/captions
- Store selected tone in `profiles.tone_preference`

**Modify: `src/components/SpeakButton.tsx`**
- Add a "muted" mode that shows the text in the selected TJ tone style instead of calling TTS
- Keep the voice infrastructure intact so it can be reactivated with a single flag

**New file: `src/hooks/useTJTone.ts`**
- Hook that reads `profile.tone_preference` and provides `getTonedText()` helper

---

### Phase 2: Expanded TJ DNA Profile Page

**Modify: `src/pages/LearningDNAPage.tsx`**
- Add 5 new interactive sections:
  - **My DNA Type** — visual display of the 4-character code
  - **How I Learn Best** — based on layer strength
  - **What Throws Me Off** — based on low retention/confidence signals
  - **TJ Recommends Next** — smart recommendation from learning metrics
  - **Best Study Order for Me** — shows the DNA-adapted step sequence
- Make each DNA code character tappable → shows popover explaining that dimension
- Keep the design clean, soft, blueprint-like

**Modify: `src/pages/Home.tsx`**
- Highlight the TJ DNA Code button on Welcome Back screen with a glowing/pulsing accent

---

### Phase 3: Bible Study "Scripture First" Flow

**Modify: `src/components/LearningOrbDialog.tsx`**
- For Bible/religious modules, reorder steps to: Scripture → Read Along → Plain Meaning → Deep Explanation → History/Context → Personal Application → Reflect With TJ
- Add a toggle: "Read Scripture First" vs "Show Explanation First" (default: Scripture First)
- Ensure `source_text` displays the actual verse text before any TJ framework explanation

**Modify: `src/components/LearningOrbStepContent.tsx`**
- Update scripture step labels to match: "Scripture", "Read Along", "Plain Meaning", etc.

---

### Phase 4: Auto-Voice Reactivation with Smart Playback

**Modify: `src/components/LearningOrbDialog.tsx`**
- Re-enable auto-speak on step entry but with guard against stacking
- When leaving a screen, cancel any active playback
- In Bible mode, auto-read scripture reference → text → then explanation

**Modify: `src/pages/WelcomePage.tsx`**
- Auto-read welcome content on entry

---

### Phase 5: Deeper Teaching Layers per Concept

**Modify: `src/components/LearningOrbStepContent.tsx`**
- For the "information" step, structure content as:
  - Simple explanation
  - Deeper lesson
  - Word origin/history
  - Why it matters
  - How it fits YOU (based on DNA)
- Use DNA profile to reorder these sub-sections

---

### Phase 6: Onboarding Flow Adjustment

**Modify: `src/pages/OnboardingPage.tsx`**
- Show the DNA result/orientation screen (step 4) before Welcome Back
- Returning users skip straight to Welcome Back
- New users must complete onboarding including DNA setup first

---

### Note on "Base44"
Base44 is an external no-code platform and cannot be directly integrated into this React/Vite codebase. Instead, I'll build the adaptive learner cards, DNA recommendations, and personalized blocks as native React components using the existing DNA system — achieving the same goal natively.

### Files to Create
1. `src/lib/tjTone.ts` — Tone mode definitions and text transformer
2. `src/hooks/useTJTone.ts` — Hook for accessing tone in components

### Files to Modify
1. `src/pages/LearningDNAPage.tsx` — Expanded interactive DNA profile
2. `src/pages/Home.tsx` — Highlighted DNA button
3. `src/components/LearningOrbDialog.tsx` — Bible Scripture-First + auto-voice
4. `src/components/LearningOrbStepContent.tsx` — Deeper teaching layers + Bible labels
5. `src/components/SpeakButton.tsx` — Tone-aware text mode
6. `src/hooks/useDNAAdaptation.ts` — Enhanced adaptation rules for tone
7. `src/pages/OnboardingPage.tsx` — Flow reorder
