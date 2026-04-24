## Fix: Correct Hidden Sections on Game Grid

### Problem
The wrong sections are currently hidden on the Game Grid. "Skin Structure and Growth" is hidden, but it should be visible. Instead, "General Anatomy and Physiology" and "Infection Control" should be hidden until they're built out.

### Solution
Update the `HIDDEN_SECTIONS` array in `src/pages/GameGridPage.tsx` to use the correct section IDs:

**Current (wrong):**
```typescript
const HIDDEN_SECTIONS = ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]; // Skin Structure and Growth
```

**New (correct):**
```typescript
const HIDDEN_SECTIONS = [
  "b2c3d4e5-f6a7-8901-bcde-fa2345678901", // General Anatomy and Physiology
  "c3d4e5f6-a7b8-9012-cdef-ab3456789012"  // Infection Control
];
```

### Files to Edit
- `src/pages/GameGridPage.tsx` (lines 309-311)

### Verification
After the change, the Game Grid should display:
- Skin Structure and Growth (visible)
- General Anatomy and Physiology (hidden)
- Infection Control (hidden)