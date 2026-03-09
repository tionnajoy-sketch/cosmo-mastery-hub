// 96-Crayon inspired color palettes — each page gets its own vibrant, unique theme
// Every palette has: bg gradient, heading, body text, accent, card bg, button, and highlight colors

export const pageColors = {
  // LOGIN: Deep Berry + Magenta Burst
  login: {
    gradient: "linear-gradient(135deg, hsl(295 55% 22%), hsl(330 60% 40%), hsl(350 50% 50%))",
    heading: "hsl(295 40% 90%)",
    subtext: "hsl(295 20% 75%)",
    card: "hsl(295 25% 96%)",
    cardHeading: "hsl(295 50% 25%)",
    button: "hsl(330 55% 42%)",
    link: "hsl(330 55% 38%)",
  },
  // SIGNUP: Same family as login for cohesion
  signup: {
    gradient: "linear-gradient(135deg, hsl(295 55% 22%), hsl(330 60% 40%), hsl(350 50% 50%))",
    heading: "hsl(295 40% 90%)",
    subtext: "hsl(295 20% 75%)",
    card: "hsl(295 25% 96%)",
    cardHeading: "hsl(295 50% 25%)",
    button: "hsl(330 55% 42%)",
    link: "hsl(330 55% 38%)",
  },
  // HOME: Warm Sunset Peach + Tangerine
  home: {
    gradient: "linear-gradient(180deg, hsl(18 75% 88%), hsl(32 65% 90%), hsl(48 55% 93%))",
    heading: "hsl(18 55% 22%)",
    subtext: "hsl(18 25% 42%)",
    accent: "hsl(18 65% 52%)",
    card: "hsl(0 0% 100%)",
    cardHeading: "hsl(18 50% 24%)",
    cardText: "hsl(18 18% 42%)",
    progressTrack: "hsl(18 40% 88%)",
    icon: "hsl(32 70% 52%)",
  },
  // SECTION: Coral Rose + Blush
  section: {
    gradient: "linear-gradient(180deg, hsl(5 70% 88%), hsl(355 55% 91%), hsl(340 45% 94%))",
    heading: "hsl(5 55% 28%)",
    subtext: "hsl(5 22% 42%)",
    accent: "hsl(5 60% 52%)",
    card: "hsl(0 0% 100%)",
    cardHeading: "hsl(5 50% 28%)",
    cardText: "hsl(5 15% 48%)",
    tipBg: "hsl(42 60% 95%)",
    tipText: "hsl(42 35% 30%)",
    button: "hsl(5 58% 52%)",
    buttonOutline: "hsl(5 55% 52%)",
    progress: "hsl(5 35% 38%)",
  },
  // STUDY: Golden Honey + Sage
  study: {
    gradient: "linear-gradient(180deg, hsl(42 55% 88%), hsl(65 30% 90%), hsl(130 20% 93%))",
    heading: "hsl(42 55% 24%)",
    subtext: "hsl(42 22% 44%)",
    accent: "hsl(42 58% 48%)",
    card: "hsl(0 0% 100%)",
    tipBg: "hsl(42 60% 95%)",
    tipText: "hsl(42 35% 30%)",
    tabActive: "hsl(42 58% 48%)",
    tabInactive: "hsl(42 30% 91%)",
    tabActiveText: "hsl(0 0% 100%)",
    tabInactiveText: "hsl(42 30% 38%)",
    termHeading: "hsl(42 50% 26%)",
    bodyText: "hsl(42 18% 30%)",
    bookmark: "hsl(42 58% 48%)",
    bookmarkBg: "hsl(42 60% 92%)",
    buttonPrimary: "hsl(42 58% 48%)",
    buttonSecondary: "hsl(130 40% 38%)",
  },
  // ACTIVITY: Electric Violet + Lavender
  activity: {
    gradient: "linear-gradient(180deg, hsl(262 45% 88%), hsl(275 35% 91%), hsl(290 25% 94%))",
    heading: "hsl(262 40% 24%)",
    subtext: "hsl(262 18% 48%)",
    accent: "hsl(262 45% 50%)",
    card: "hsl(0 0% 100%)",
    cardBorder: "hsl(262 25% 84%)",
    iconBg: "hsl(262 35% 90%)",
    iconColor: "hsl(262 45% 48%)",
    button: "hsl(262 40% 48%)",
    termBorder: "hsl(262 18% 84%)",
    selectedBg: "hsl(262 40% 88%)",
    selectedBorder: "hsl(262 45% 56%)",
    matchedBg: "hsl(145 40% 92%)",
    matchedBorder: "hsl(145 40% 70%)",
    wrongBg: "hsl(0 50% 95%)",
    wrongBorder: "hsl(0 50% 60%)",
    successBg: "hsl(145 40% 94%)",
    successColor: "hsl(145 60% 35%)",
    successHeading: "hsl(145 40% 25%)",
  },
  // QUIZ: Deep Teal + Midnight
  quiz: {
    gradient: "linear-gradient(180deg, hsl(185 50% 18%), hsl(190 40% 24%), hsl(195 35% 30%))",
    heading: "hsl(42 60% 85%)",
    subtext: "hsl(185 22% 68%)",
    accent: "hsl(42 58% 52%)",
    card: "hsl(185 22% 95%)",
    cardText: "hsl(185 32% 16%)",
    optionBg: "hsl(0 0% 100%)",
    optionBorder: "hsl(185 18% 80%)",
    optionLabel: "hsl(185 32% 30%)",
    optionText: "hsl(185 22% 20%)",
    correctBg: "hsl(145 50% 92%)",
    correctBorder: "hsl(145 50% 50%)",
    wrongBg: "hsl(0 50% 95%)",
    wrongBorder: "hsl(0 50% 60%)",
    feedbackCorrectBg: "hsl(145 40% 94%)",
    feedbackWrongBg: "hsl(0 30% 96%)",
    feedbackCorrectIcon: "hsl(145 60% 35%)",
    feedbackWrongIcon: "hsl(0 60% 45%)",
    nextButton: "hsl(42 55% 50%)",
    // Mode selection
    practiceBg: "hsl(185 22% 95%)",
    practiceBorder: "hsl(185 32% 70%)",
    practiceIcon: "hsl(185 42% 35%)",
    practiceHeading: "hsl(185 32% 20%)",
    practiceText: "hsl(185 16% 35%)",
    confidenceBg: "hsl(42 42% 96%)",
    confidenceBorder: "hsl(42 42% 70%)",
    confidenceIcon: "hsl(42 58% 48%)",
    confidenceHeading: "hsl(42 32% 22%)",
    confidenceText: "hsl(42 16% 35%)",
    backButton: "hsl(185 22% 70%)",
  },
  // RESULTS: Sunset Gradient — Coral to Amber
  results: {
    gradient: "linear-gradient(135deg, hsl(350 48% 52%), hsl(15 60% 55%), hsl(35 65% 58%))",
    heading: "hsl(0 0% 100%)",
    subtext: "hsl(0 0% 85%)",
    card: "hsl(0 0% 100%)",
    scoreColor: "hsl(350 48% 45%)",
    scoreSubtext: "hsl(350 18% 50%)",
    bodyText: "hsl(350 16% 30%)",
    wrongText: "hsl(0 50% 50%)",
    popQuizBorder: "hsl(25 60% 65%)",
    popQuizBg: "hsl(25 50% 96%)",
    popQuizIcon: "hsl(25 60% 50%)",
    popQuizHeading: "hsl(25 42% 30%)",
    popQuizText: "hsl(25 22% 40%)",
    popQuizButton: "hsl(25 60% 50%)",
    reviewButton: "hsl(350 48% 50%)",
  },
  // POP QUIZ: Royal Purple + Deep Plum
  popQuiz: {
    gradient: "linear-gradient(180deg, hsl(270 42% 22%), hsl(275 35% 30%), hsl(280 28% 38%))",
    heading: "hsl(270 42% 85%)",
    subtext: "hsl(270 22% 65%)",
    card: "hsl(270 18% 95%)",
    cardText: "hsl(270 22% 16%)",
    optionBg: "hsl(0 0% 100%)",
    optionBorder: "hsl(270 18% 80%)",
    optionLabel: "hsl(270 32% 30%)",
    optionText: "hsl(270 22% 20%)",
    correctBg: "hsl(145 50% 92%)",
    correctBorder: "hsl(145 50% 50%)",
    wrongBg: "hsl(0 50% 95%)",
    wrongBorder: "hsl(0 50% 60%)",
    feedbackCorrectBg: "hsl(145 40% 94%)",
    feedbackWrongBg: "hsl(0 30% 96%)",
    feedbackText: "hsl(270 16% 25%)",
    nextButton: "hsl(270 38% 50%)",
    backButton: "hsl(270 22% 70%)",
    resultGradient: "linear-gradient(135deg, hsl(270 35% 45%), hsl(270 28% 55%))",
    resultScore: "hsl(270 38% 45%)",
    resultSubtext: "hsl(270 18% 50%)",
    resultBody: "hsl(270 16% 30%)",
    // No pop quiz needed
    emptyBg: "linear-gradient(180deg, hsl(145 32% 92%), hsl(145 22% 96%))",
    emptyIcon: "hsl(145 60% 35%)",
    emptyHeading: "hsl(145 42% 25%)",
    emptyText: "hsl(145 22% 40%)",
    emptyButton: "hsl(145 42% 40%)",
  },
} as const satisfies Record<string, Record<string, string>>;

// Section card accent colors for Home page — each section gets a unique crayon color
export const sectionAccentColors = [
  { bg: "hsl(350 55% 55%)", light: "hsl(350 55% 92%)", text: "hsl(350 45% 30%)" }, // Brick Red
  { bg: "hsl(25 70% 55%)", light: "hsl(25 70% 92%)", text: "hsl(25 50% 28%)" },  // Burnt Orange
  { bg: "hsl(48 75% 50%)", light: "hsl(48 75% 92%)", text: "hsl(48 55% 25%)" },  // Maize Yellow
  { bg: "hsl(140 45% 42%)", light: "hsl(140 40% 92%)", text: "hsl(140 35% 22%)" }, // Pine Green
  { bg: "hsl(200 65% 48%)", light: "hsl(200 60% 92%)", text: "hsl(200 50% 22%)" }, // Cerulean Blue
  { bg: "hsl(270 50% 52%)", light: "hsl(270 45% 92%)", text: "hsl(270 40% 24%)" }, // Royal Purple
  { bg: "hsl(325 55% 52%)", light: "hsl(325 50% 92%)", text: "hsl(325 45% 25%)" }, // Wild Orchid
  { bg: "hsl(175 50% 40%)", light: "hsl(175 45% 92%)", text: "hsl(175 40% 22%)" }, // Teal
  { bg: "hsl(10 70% 58%)", light: "hsl(10 65% 92%)", text: "hsl(10 50% 28%)" },  // Red Orange
  { bg: "hsl(215 55% 45%)", light: "hsl(215 50% 92%)", text: "hsl(215 40% 22%)" }, // Navy Blue
  { bg: "hsl(55 65% 48%)", light: "hsl(55 60% 92%)", text: "hsl(55 45% 25%)" },  // Goldenrod
  { bg: "hsl(290 45% 50%)", light: "hsl(290 40% 92%)", text: "hsl(290 35% 24%)" }, // Plum
];

// Block accent colors for Section page
export const blockAccentColors = [
  { stripe: "hsl(350 55% 55%)", bg: "hsl(350 50% 96%)" },
  { stripe: "hsl(25 70% 55%)", bg: "hsl(25 65% 96%)" },
  { stripe: "hsl(140 45% 42%)", bg: "hsl(140 38% 96%)" },
  { stripe: "hsl(200 65% 48%)", bg: "hsl(200 58% 96%)" },
  { stripe: "hsl(270 50% 52%)", bg: "hsl(270 42% 96%)" },
  { stripe: "hsl(48 75% 50%)", bg: "hsl(48 68% 96%)" },
  { stripe: "hsl(325 55% 52%)", bg: "hsl(325 48% 96%)" },
  { stripe: "hsl(175 50% 40%)", bg: "hsl(175 42% 96%)" },
];
