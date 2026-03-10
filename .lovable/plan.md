

# Homepage Redesign + Pre/Post Testing System

This is a large scope request. Here is a phased plan covering all the features you described.

---

## Phase 1: Professional Homepage Redesign

**Current state**: The homepage is a simple scrolling list of cards. No menu, no structure, no contract.

**New design**: A polished, magazine-style dashboard with clear sections separated by visual dividers.

### Layout (top to bottom):
1. **Professional Header Bar** — Logo, navigation menu (Home, Progress, Strategy, Settings), profile avatar, logout
2. **Hero Welcome Banner** — Personalized greeting, motivational quote, daily pop question prompt
3. **Student Commitment Contract** — A card the student fills out once (their name, goal date, what they commit to). Saved to a new `student_contracts` table. Once signed, shows as a beautiful framed card they can revisit.
4. **"What You'll Walk Away With" Section** — Clean grid/list of outcomes: "Confidence to pass your state boards", "Deep understanding of theory", "Test-taking strategies", "Inner confidence that radiates outward". Styled as a visual checklist.
5. **Daily Study Goal + Streak** (existing, cleaned up)
6. **Progress Dashboard** (existing, with pie chart added)
7. **Study Sections Grid** (existing, with better spacing)
8. **Copyright & Legal Footer** — "© 2026 TJ Anderson / CosmoPrep. All rights reserved. The TJ Anderson Layer Method™ is proprietary. Unauthorized reproduction prohibited."

---

## Phase 2: Daily Pop Question on Sign-In

**How it works**:
- After login, before reaching the homepage, show a single random question from their weakest areas (or random if no data yet)
- Modal or interstitial page: answer the question, see feedback, then continue to home
- Tracked in `study_activity` for daily goal credit

**New file**: `src/components/DailyPopQuestion.tsx`
**Modified**: `src/pages/Home.tsx` — shows the pop question modal on first load of the day

---

## Phase 3: Pre-Test (On First Signup)

**Purpose**: Gauge the student's baseline knowledge and learning style to personalize their experience.

### Database changes:
- New table `pretest_results` — stores user_id, section scores, learning_style, completed_at
- New table `pretest_answers` — stores individual question responses

### Flow:
1. After signup + email verification + first login, redirect to `/pretest` instead of `/welcome`
2. Pre-test has two parts:
   - **Part A: Knowledge Assessment** — 20-30 questions sampled across all available sections (pulls from existing `questions` table)
   - **Part B: Learning Style Discovery** — 5-7 multiple choice questions about how they learn (visual, hands-on, reading, listening)
3. Results page shows:
   - Pie chart of strengths/weaknesses by section
   - Their identified learning style
   - Personalized recommendations ("We recommend starting with Block 3 of Skin — that's where you can grow the most")
4. Save results, then navigate to Welcome page

### Learning style questions (examples):
- "When learning something new, I prefer to..." (see a picture / read about it / try it hands-on / hear someone explain it)
- "I remember things best when I..." (write them down / visualize them / say them out loud / practice them)

---

## Phase 4: Post-Test (Comprehensive Final)

**Purpose**: Simulate the state board exam experience as closely as possible.

### Design:
- New route `/post-test` accessible from homepage when student has completed enough content
- Pulls questions from ALL sections (not just one like Final Exam)
- Timed mode matching state board format
- Professional exam UI: clean, minimal, no hints, no encouragement during the test
- After completion: detailed feedback comparing pre-test to post-test scores

### Results page shows:
- Overall score with pass/fail indicator based on typical state board thresholds
- Section-by-section breakdown (bar chart comparing pre-test vs post-test)
- Growth areas highlighted
- Encouragement messaging: "You've grown X% since you started. That growth is real."
- Recommended review areas

---

## Phase 5: Copyright Protection

Add copyright notices throughout the app:
- **Footer component** on every page with: "© 2026 Tionna Joy Anderson. All Rights Reserved. CosmoPrep™ and the TJ Anderson Layer Method™ are trademarks. Content may not be reproduced without permission."
- **Terms of Use page** (`/terms`) with standard clauses: intellectual property, no redistribution, no screenshots for commercial use, DMCA notice
- **Signup checkbox**: "I agree to the Terms of Use" (required)

---

## Database Changes Summary

```text
New tables:
├── student_contracts (id, user_id, commitment_text, signed_at)
├── pretest_results (id, user_id, overall_score, total_questions, learning_style, completed_at)
├── pretest_answers (id, user_id, question_id, selected_option, is_correct)
└── posttest_results (id, user_id, overall_score, total_questions, section_scores JSONB, completed_at)

Modified tables:
└── profiles — add has_completed_pretest boolean default false
```

---

## New Files

```text
src/components/DailyPopQuestion.tsx    — Modal with daily question
src/components/StudentContract.tsx     — Commitment card component
src/components/AppFooter.tsx           — Copyright footer
src/pages/PretestPage.tsx              — Pre-test flow
src/pages/PretestResultsPage.tsx       — Pre-test results with recommendations
src/pages/PosttestPage.tsx             — Comprehensive post-test
src/pages/PosttestResultsPage.tsx      — Post-test results with pre/post comparison
src/pages/TermsPage.tsx                — Terms of use / copyright
```

---

## Implementation Order

1. Database migrations (contracts, pretest, posttest tables)
2. Copyright footer + Terms page (quick wins, protection first)
3. Homepage redesign (menu, contract, outcomes, spacing)
4. Daily pop question modal
5. Pre-test flow + learning style assessment
6. Post-test flow + pre/post comparison
7. Connect pre-test recommendations to homepage study order

---

## Visual Direction

- Rich, distinct colors per section (crayon-box palette continues)
- Generous white space between sections
- Pie charts for score breakdowns, bar charts for pre/post comparison
- Calm, professional typography — editorial magazine feel
- Nervous system messaging woven throughout (breathing prompts, affirming language)

