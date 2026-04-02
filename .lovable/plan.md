

## Plan: Update Sign-Up Program Dropdown + Fix Learning Content Scrolling

Two changes: (A) redesign the Program dropdown on Signup with expanded "Coming Soon" list, (B) fix scroll trapping in the learning dialog.

---

### A. Sign-Up Program Dropdown

**File: `src/pages/Signup.tsx`** — Lines 164-175

Replace the current 4-item Program `<Select>` with a redesigned dropdown:

1. **Label**: Change from "Program" to "Choose Your Learning Path"
2. **Active item**: "Cosmetology State Board Prep" (value: `Cosmetology`) — selectable
3. **Coming Soon separator**: Use `<SelectSeparator>` + a `<SelectLabel>` reading "Coming Soon"
4. **Coming Soon items** (all `disabled`):
   - Real Estate Exam Prep
   - Medical Terminology
   - Esthetics State Board Prep
   - Barbering State Board Prep
   - Nail Technology State Board Prep
   - CNA / Nurse Aide Exam Prep
   - Insurance License Prep
   - ACT / SAT Prep
   - Bible Study
   - Educator / Paraprofessional Prep
5. **Toast on disabled tap**: Add `onPointerDown` capture on disabled items to show toast: "This learning path is coming soon and will be powered by the TJ Anderson Layer Method™."

Since `<SelectItem disabled>` swallows clicks, wrap each coming-soon option in a clickable div that intercepts the tap before Radix disables it, triggering the toast.

---

### B. Fix Learning Content Scroll Trapping

**File: `src/components/LearningOrbDialog.tsx`** — Lines 948 and 864

The content area (`flex-1 overflow-y-auto`) is correct, but the parent `DialogContent` uses fixed positioning with `h-screen`. Two fixes:

1. **Add `-webkit-overflow-scrolling: touch`** to the scrollable content div (line 948) for iOS momentum scrolling
2. **Ensure "Why This Step Matters" expanded content and "Explain Again" re-explanations** don't get trapped — the `AnimatePresence` sections inside the scroll area already flow naturally, but the `overflow-hidden` on the motion.p (line 921) clips content. Change to `overflow-visible` on the animated neuro note
3. **Remove any `max-h` or `h-` constraints** on inner content cards within `LearningOrbStepContent.tsx` that might limit scrolling — check for fixed-height containers

**File: `src/components/LearningOrbStepContent.tsx`** — Audit for fixed-height wrappers

- Remove or convert any `max-h-[...]` or `h-[...]` on content containers to `min-h` or remove entirely
- Ensure all step content flows naturally within the parent scrollable area

---

### Files to Modify
1. `src/pages/Signup.tsx` — Redesign Program dropdown
2. `src/components/LearningOrbDialog.tsx` — iOS scroll fix, remove overflow-hidden on expandable sections
3. `src/components/LearningOrbStepContent.tsx` — Remove fixed-height constraints on content areas

