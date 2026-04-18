

User wants several changes. Let me organize:

1. **Merge Learn + Practice Lab into one tab** — keep current Learn (GameGridPage) format, but each section card should have explicit Activities + Quiz tabs/buttons (already partially done in last edit). Remove Practice Lab as separate nav item, route `/practice-lab` → `/learn`.

2. **No image visualization** — user says pictures aren't showing. Need to check term cards / learning flow visualize step. Likely image generation isn't being triggered or shown in the GameGridPage term tiles.

3. **Leaderboard missing from menu** — check AppMenuSheet. It's not in the menu sections currently.

4. **Community board missing** — needs to be added back / built. Need to clarify whether this previously existed or needs new build.

5. **Pause TJ voice everywhere** — global voice OFF. Per memory `tech/ai-voice-system-behavior` voice already defaults OFF, but auto-narration triggers in many places. Need to disable auto-narration globally or set the persistent toggle to OFF for current user.

Let me verify a few things before planning.

Need to check:
- AppMenuSheet current items (already have it - no Leaderboard listed)
- Whether community board ever existed (search)
- How auto-narration is gated (useAutoNarrate hook + voice toggle)
- Where images render in Learn grid (GameGridPage)

I should ask 1-2 clarifying questions on community board scope since it's a meaningful new feature.

## Plan

### 1. Merge Learn + Practice Lab
- `/practice-lab` route → render `GameGridPage` (or redirect)
- Update `AppMenuSheet`: remove "Practice Lab" tile, keep "Learn" (rename label to "Learn & Practice")
- `GameGridPage` already has Activities/Quiz buttons per block (added last turn) — keep that format consistent and ensure each section group displays the three-button row clearly

### 2. Add term image visualization to Learn
- In `GameGridPage`, term tiles currently show text only. Add the term image (from `term-images` bucket / `terms.image_url`) as the tile background/thumbnail
- Fall back to gradient + initial when no image exists
- No new generation triggered here — display whatever's already stored

### 3. Restore Leaderboard in menu
- Add to `AppMenuSheet` "Resources" section: `{ label: "Leaderboard", icon: Trophy, onClick: go("/leaderboard"), color: "42 80% 50%" }`
- Route already exists (`LeaderboardPage`)

### 4. Community Board (new)
- Add new page `src/pages/CommunityBoardPage.tsx` at route `/community`
- Add menu tile in "Resources"
- New table `community_posts` (id, user_id, author_name, content, created_at) with RLS:
  - SELECT: authenticated users
  - INSERT: auth.uid() = user_id
  - UPDATE/DELETE: owner only
- Optional `community_replies` table same shape with `post_id`
- Simple UI: post composer + scrollable list, newest first
- Realtime subscription for live updates

### 5. Pause TJ voice globally
- Add `voice_enabled boolean default false` flag check; force-set to false for current behavior
- Modify `useAutoNarrate` hook to early-return when a global "pause" flag is set
- Add a single source of truth: `localStorage.tj_voice_paused = "true"` set on app load until user re-enables; or simpler — comment out / gate every `speak()` call behind the existing voice toggle and ensure default is OFF
- Per memory: voice already defaults OFF but auto-narration may still fire. Verify and ensure `useAutoNarrate` respects the toggle. If not, add a hard global gate.

### Clarifying questions before implementing community board

