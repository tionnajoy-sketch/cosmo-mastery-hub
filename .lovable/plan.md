

User is on `/section/.../study/1` (SectionPage with block cards). They observe the SectionPage block view duplicates what GameGridPage already does. They're asking architecturally:
- Option A: Remove SectionPage entirely; everything lives on Game Grid
- Option B: Keep blocks only inside Activities/Quiz contexts (not as standalone navigation)
- Option C: Break Grid up into blocks (restructure Game Grid)

Best to ask which direction they want since it's architectural. Let me check current routing quickly.

Routes I recall:
- `/learn` & `/practice-lab` → GameGridPage (sections + collapsible term tiles + per-block Activities/Quiz buttons)
- `/section/:id/study/:block` → SectionPage / StudyPage (block-level study view)
- `/section/:id/activity/:block` → ActivityPage
- `/section/:id/quiz/:block` → QuizPage

The "Back to Study" button inside ActivityPage routes to `/section/:id/study/:block` → SectionPage which shows blocks again — redundant with the Game Grid the user came from.

I'll ask a focused question rather than guess.

## Plan

**Recommended approach (Option B — cleanest):**

1. **Eliminate the redundant SectionPage block hub.** The Game Grid is now the single discovery layer for terms + per-block Activities/Quiz buttons.

2. **Fix "Back to Study" in ActivityPage and QuizPage:** route back to `/learn` (Game Grid) with the section auto-expanded and scrolled into view, instead of `/section/:id/study/:block`.

3. **Repurpose `/section/:id/study/:block` route:** redirect to `/learn?section=<id>` so any old links still work.

4. **Keep block awareness only where it matters:**
   - Game Grid section expansion already shows per-block Activity/Quiz buttons
   - ActivityPage and QuizPage still receive `:block` param and operate on that block's terms
   - Remove the standalone block cards UI in SectionPage

5. **Game Grid enhancement:** within each expanded section, group term tiles by block number with a tiny "Block N" subheading above each cluster, so block structure is still visible without a separate page.

**Files to change:**
- `src/App.tsx` — redirect `/section/:id/study/:block` → `/learn?section=:id`
- `src/pages/ActivityPage.tsx` — change "Back to Study" target to `/learn?section=:id`
- `src/pages/QuizPage.tsx` — same fix
- `src/pages/GameGridPage.tsx` — read `?section=` query param, auto-expand + scroll; group tiles by block within each section with subheadings
- `src/pages/SectionPage.tsx` — keep file but unmount from router (or convert to a thin redirect component)

**Confirm before building:** which option you want.

