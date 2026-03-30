

## Plan: Voice Everywhere + Neutral Ask TJ + TJ Anderson Cafe Break

### Problem Summary
1. **Voice (TTS) is missing** from Quiz pages, Activity pages, Final Exam, Practice Lab, and Module Quiz/Activity pages — only the Learning Orb flow and Foreword have SpeakButton
2. **Ask TJ** has a heavily branded purple/dark theme that feels opinionated rather than neutral and open
3. **No study break system** exists — students can study indefinitely with no wellness intervention

---

### What We Build

#### A. Voice on Every Teaching Surface

Add `SpeakButton` and auto-voice narration to these pages:

**Quiz pages** (`QuizPage.tsx`, `ModuleQuizPage.tsx`):
- SpeakButton on each question text (reads the question aloud)
- SpeakButton on the explanation after answering
- Auto-speak the calming pre-quiz message when quiz starts
- Voice reads correct/incorrect feedback

**Activity pages** (`ActivityPage.tsx`, `ModuleActivityPage.tsx`):
- SpeakButton on each term definition during activities
- Auto-speak the calming message on page load
- Voice reads instructions for each activity type

**Final Exam** (`FinalExamPage.tsx`, `ComprehensiveFinalExamPage.tsx`):
- SpeakButton on each question
- SpeakButton on explanations
- Auto-speak opening calming message

**Practice Lab** (`PracticeLabPage.tsx`):
- Voice welcome/intro when entering

**Results pages** (`ResultsPage.tsx`, `ModuleResultsPage.tsx`, `PosttestResultsPage.tsx`):
- SpeakButton on score summary and feedback messages

#### B. Ask TJ — Neutral & Open Concept

Redesign `AskTJFullScreen.tsx`:
- Replace dark purple/branded theme with a **neutral, warm palette** (cream, soft gray, warm white)
- Open, airy layout — light background with soft shadows
- Remove the office photo background overlay
- Use clean, minimal card-style message bubbles (soft white for TJ, light gray for user)
- Keep the TJ avatar but with a neutral border (no purple glow)
- Floating trigger button becomes neutral toned (warm gray/charcoal)
- Feels like a calm, open conversation space — not a branded product

#### C. TJ Anderson Cafe (Study Break System)

**New component**: `src/components/TJCafe.tsx`

**Trigger logic** (in `useStudyTracker.ts` or new `useStudyBreak.ts` hook):
- Track cumulative study time per session using `performance.now()` or timestamps
- After 60 minutes of active study, trigger the Cafe popup
- Reset timer after break is dismissed

**Cafe experience**:
- Full-screen overlay with vibrant colors: **Red** (`hsl(0 75% 50%)`), **Blue** (`hsl(215 80% 45%)`), **Gold** (`hsl(45 90% 55%)`), **Emerald Green** (`hsl(155 70% 40%)`)
- Warm, inviting cafe aesthetic — think cozy jazz lounge
- Background jazz music via ElevenLabs Music API or a static royalty-free jazz loop stored in assets
- TJ's voice auto-plays a wellness/encouragement message:
  - "Hey love, you've been studying for over an hour. I'm so proud of you. Take a moment — breathe, stretch, grab some water. Your brain needs rest to lock in what you've learned."
- Content sections:
  - **Breathing exercise** — guided 4-7-8 breathing animation
  - **Affirmation** — rotating motivational message
  - **Stretch prompt** — simple body movement suggestion
  - **Water reminder** — hydration nudge
- Dismiss button: "I'm Refreshed — Let's Keep Going"
- Cafe re-triggers every 60 minutes of additional study

---

### Files to Create
1. `src/components/TJCafe.tsx` — Full cafe break component
2. `src/hooks/useStudyBreak.ts` — Session time tracker with 60-min trigger

### Files to Modify
1. `src/pages/QuizPage.tsx` — Add SpeakButton to questions, explanations, calming messages
2. `src/pages/ModuleQuizPage.tsx` — Same voice additions
3. `src/pages/FinalExamPage.tsx` — Same voice additions
4. `src/pages/ActivityPage.tsx` — Add SpeakButton to terms, instructions, calming messages
5. `src/pages/ModuleActivityPage.tsx` — Same voice additions
6. `src/pages/PracticeLabPage.tsx` — Voice welcome
7. `src/pages/ResultsPage.tsx` — Voice on score feedback
8. `src/components/AskTJFullScreen.tsx` — Neutral redesign (cream/gray palette, remove purple branding, open layout)
9. `src/App.tsx` — Mount TJCafe component globally

### Technical Notes
- SpeakButton already uses the TJ-Mentor ElevenLabs voice — just import and attach to text content
- Jazz music: use a static audio file in public/ (royalty-free jazz loop) to avoid API costs on every break
- Study break timer persists in sessionStorage so page refreshes don't reset it
- Cafe overlay uses z-index above everything except Ask TJ

