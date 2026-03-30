

## Plan: Pulse Animation on Cafe Countdown Under 5 Minutes

### What Changes

**File: `src/pages/Home.tsx`** — Lines 199-219

Add a gentle pulse animation to the cafe countdown button when `cafeMinutesLeft` is between 1-5 (or 0 for ready). Two changes:

1. **Animate prop**: When under 5 minutes, add a repeating scale pulse via framer-motion's `animate` prop:
   - `scale: [1, 1.02, 1]` with `repeat: Infinity`, `duration: 2`
   - When ready (0 min): slightly stronger pulse `scale: [1, 1.03, 1]` with `duration: 1.5`
   - When > 5 min: no pulse, static

2. **Coffee icon animation**: Add a subtle CSS animation class to the Coffee icon when under 5 min — a gentle opacity pulse using tailwind's `animate-pulse`

3. **Visual warmth**: When under 5 min, shift background from neutral gray to a warm amber tint (`hsl(42 40% 92%)`) to draw gentle attention

No new files needed. Single file edit, ~20 lines changed.

