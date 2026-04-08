

## Plan: Rename to "TJ Anderson Layer Method™: Core Cross Agent™"

### What Changes

Update every reference to the TJ Anderson Layer Method across the entire app so the full name reads **TJ Anderson Layer Method™: Core Cross Agent™** — with both names trademarked.

Short references (headers, badges, subtitles) will use contextually appropriate forms:
- Full: "TJ Anderson Layer Method™: Core Cross Agent™"
- Medium: "TJ Layer Method™: Core Cross Agent™"
- Short/tagline contexts: keep "TJ Anderson Layer Method™" where adding the subtitle would break layout

### Files to Modify (~19 files with references)

1. **`index.html`** — Update `<title>` and `<meta>` tags
2. **`src/components/AppFooter.tsx`** — Update copyright notice
3. **`src/pages/Login.tsx`** — "Powered by" subtitle
4. **`src/pages/WelcomePage.tsx`** — Header subtitle, method layers section title, voice script
5. **`src/pages/StrategyPage.tsx`** — Section heading
6. **`src/pages/UploadPage.tsx`** — Description text and instructor mode dialog
7. **`src/pages/LearningDNAPage.tsx`** — DNA explanation references
8. **`src/pages/PretestResultsPage.tsx`** — Learning style tips
9. **`src/pages/OnboardingPage.tsx`** — Onboarding text
10. **`src/pages/TermsPage.tsx`** — Legal/trademark section (add Core Cross Agent™ to trademark notice)
11. **`src/components/AIMentorChat.tsx`** — Quick-prompt text
12. **`src/components/LearningOrbDialog.tsx`** — AI prompt references
13. **`src/components/LearningOrchestrator.tsx`** — Any method references
14. **`src/components/cosmo-grid/LayerReveal.tsx`** — Overlay label
15. **`src/components/StudentContract.tsx`** — Contract text
16. **`src/components/AppHeader.tsx`** — If method name appears
17. **`src/pages/Signup.tsx`** — If method name appears
18. **`src/pages/Home.tsx`** — Dashboard references
19. **`supabase/functions/process-upload/index.ts`** — AI prompt references

### Trademark & Legal Updates

In `TermsPage.tsx` section 4 (Trademark Notice), update to:
> "CosmoPrep," "TJ Anderson Layer Method," and "Core Cross Agent" are trademarks of Tionna Joy Anderson.

In `AppFooter.tsx`:
> The TJ Anderson Layer Method™: Core Cross Agent™ is a proprietary learning framework created by Tionna Anderson.

### Approach
- Global find-and-replace of "TJ Anderson Layer Method™" → "TJ Anderson Layer Method™: Core Cross Agent™" as the default
- In tight UI spots (buttons, badges, small labels), use the shorter form or just "Core Cross Agent™" where appropriate
- Ensure ™ appears after both "Layer Method" and "Core Cross Agent" in all instances

