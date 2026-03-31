

## Plan: TJ Reset Café™ Overhaul + My Learning DNA Hub

Two major systems: (A) transform TJ Cafe into a premium neuroscience-based reset environment, (B) build a new "My Learning DNA" page with evolution tracking.

---

### A. TJ Reset Café™ — Full Rebuild

**File: `src/components/TJCafe.tsx`** — Major rewrite (~450 lines)

1. **Rename + Positioning**
   - Title: "TJ Reset Café™"
   - Subtitle: "Take a moment to reset and lock in what you've learned"
   - Micro-education intro: "Your brain doesn't grow during repetition. It grows during rest and integration."
   - Brain State Indicator at top: "You are entering: Focus Reset Mode" / "Brain State: Integrating + Storing"

2. **Audio System Overhaul**
   - Two toggle switches (radio-style, only one active at a time): R&B Jazz / Sound Bath
   - Selecting one stops the other automatically
   - Audio starts only on user tap (iOS autoplay compliance)
   - Fallback: "Tap to start sound" button if autoplay blocked
   - R&B Jazz: generate multiple tracks via edge function, store in array, shuffle playback, prevent back-to-back repeats, continuous loop with `onended` → next track
   - Sound Bath: same volume slider, same player logic, binaural oscillators loop continuously
   - Single shared volume slider

3. **Progress Language Update**
   - Replace "1/3 activities completed" → "You're resetting your brain for retention (1 of 3 complete)"
   - Replace "Complete 2 more activities" → "Complete 2 more steps to lock in your progress"
   - Exit button: "Return to learning with clarity"

4. **Identity-Based Rotating Messages**
   - Array of motivational messages displayed in rotation
   - "Disciplined learners take intentional pauses...", "This is what separates passers from repeat testers...", etc.

5. **Body Awareness Prompts**
   - Rotating: "Relax your shoulders", "Unclench your jaw", "Slow your breath", "You don't have to rush this moment"

6. **Time-Based Guidance**
   - Track time since cafe opened
   - After 20s: "Slow your breathing… you don't have to rush."
   - After 40s: "Your body is calming. Stay here."

7. **Activity Structure (Required Flow)**
   - 3 of 5 activities must be completed: breathing, affirmation, stretch & move, reflection, hydration prompt
   - Each activity gets a completion checkbox

8. **Reward System (Micro Feedback)**
   - After each completed action: trigger coin award, show "+Retention ↑" / "+Confidence ↑" micro-signals
   - Display: "Your brain just stored that. Keep going."
   - Uses existing `useCoins` context to add coins

9. **Completion Moment**
   - Subtle glow animation on all-complete
   - Message: "Your brain just locked in what you learned."
   - Confetti burst (reuse existing `confetti.ts`)

10. **Access Rules** — No changes needed (already auto-triggers at 60min, manual from menu)

---

### B. My Learning DNA Hub

**New file: `src/pages/LearningDNAPage.tsx`**

1. **TJ Avatar DNA Explainer Section**
   - Hero section with TJ voice explanation (auto-play TTS on mount)
   - Synced captions: short impactful phrases ("You were never taught how your brain works", "Your DNA shows how YOU learn")
   - Play/Pause/Replay controls
   - CTA at end: "See My DNA" → scrolls to profile section

2. **User DNA Profile (Visible Data)**
   - Display dynamic percentages: Visual %, Reflective %, Kinesthetic %, Analytical %
   - Derived from DNA code + learning metrics

3. **Human Translation**
   - "You learn best when you SEE it, then THINK about it, then APPLY it."
   - DNA Identity Statement: "You are a Visual-Reflective learner..."

4. **DNA Evolution Tracking**
   - "Your Growth as a Learner" section
   - Retention increase %, Confidence increase %, Focus improvement
   - Pull from `user_learning_metrics` aggregate data

5. **DNA Timeline (Progression)**
   - Week 1 vs Current comparison
   - Visual progress bars showing growth

6. **Session Feedback**
   - "Your brain responded best to..." based on recent layer completions

7. **Micro Progress Signals**
   - "+Retention ↑", "+Focus ↑", "+Confidence ↑" badges

**File: `src/components/AppHeader.tsx`** — Add "My Learning DNA" menu item with Brain icon → `/learning-dna`

**File: `src/App.tsx`** — Add route `/learning-dna` → `LearningDNAPage`

**File: `src/pages/Home.tsx`** — Add "Understand My DNA" button on dashboard → navigates to `/learning-dna`

**File: `src/pages/OnboardingPage.tsx`** — After DNA quiz completion, auto-navigate to `/learning-dna` on first experience (add flag check)

---

### Technical Details

- **Jazz playlist**: Generate 3 tracks on first cafe visit via `elevenlabs-music` edge function, cache all in `localStorage` as base64. On subsequent visits, load from cache. Shuffle array, track last played index to prevent repeats.
- **Exclusive audio toggle**: When jazz starts, stop sound bath oscillators. When sound bath starts, pause jazz audio element.
- **Time-based messages**: Use `useEffect` with `setTimeout` at 20s and 40s after cafe opens.
- **Reward integration**: Import `useCoins` context in TJCafe, call `addCoins(2)` after each activity completion with "+Retention ↑" toast.
- **DNA percentages**: Calculate from `user_learning_metrics` table — aggregate `layers_completed` arrays across all terms to determine which layers the user engages with most.
- **DNA evolution**: Compare earliest vs latest `user_learning_metrics` entries for retention/confidence deltas.
- **Captions system**: Array of `{text, startMs, endMs}` objects, advance based on TTS audio `currentTime`.
- **Onboarding trigger**: Check `profile.has_completed_onboarding` — if just set to true (first time), redirect to `/learning-dna` instead of `/`.

### Files to Create
1. `src/pages/LearningDNAPage.tsx`

### Files to Modify
1. `src/components/TJCafe.tsx` — Full overhaul
2. `src/components/AppHeader.tsx` — Add "My Learning DNA" menu item
3. `src/App.tsx` — Add `/learning-dna` route
4. `src/pages/Home.tsx` — Add "Understand My DNA" button
5. `src/pages/OnboardingPage.tsx` — Redirect to DNA page on first completion

