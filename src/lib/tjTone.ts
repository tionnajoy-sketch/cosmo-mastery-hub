/**
 * TJ Tone System — text-based personality modes that shape how TJ "speaks" in writing.
 * When voice is reactivated, these tones can also drive voice parameter adjustments.
 */

export type TJToneMode = "hype" | "gentle" | "calm" | "direct" | "encouraging";

export interface ToneProfile {
  label: string;
  emoji: string;
  description: string;
  color: string;
  greetings: string[];
  transitionPhrases: string[];
  encouragements: string[];
  closings: string[];
}

export const TJ_TONES: Record<TJToneMode, ToneProfile> = {
  hype: {
    label: "Hype TJ",
    emoji: "🔥",
    description: "Energetic, bold, and motivating — like a personal hype coach.",
    color: "hsl(25 85% 50%)",
    greetings: [
      "LET'S GO! You showed up — that's already a win.",
      "You're HERE. That means you're serious. I love it.",
      "Another day, another level up. Let's get it!",
    ],
    transitionPhrases: [
      "Now check THIS out —",
      "Here's where it gets GOOD —",
      "Pay attention because this is FIRE —",
      "You ready? Because this part is going to blow your mind —",
    ],
    encouragements: [
      "You're CRUSHING this! Keep that energy!",
      "That's the kind of student who passes on the FIRST try!",
      "See?! You already knew more than you thought!",
    ],
    closings: [
      "You just leveled up. Period.",
      "That's what growth looks like. YOU did that.",
      "Come back tomorrow and watch yourself get even stronger.",
    ],
  },
  gentle: {
    label: "Gentle TJ",
    emoji: "🌸",
    description: "Soft, warm, and patient — like a caring mentor by your side.",
    color: "hsl(330 50% 55%)",
    greetings: [
      "Hey love… I'm glad you're here today.",
      "Welcome back. Take a breath — we're doing this together.",
      "No rush. Let's just take this one step at a time.",
    ],
    transitionPhrases: [
      "Now, let me gently walk you through this…",
      "Stay with me here, okay? This is the soft part…",
      "Don't worry about getting it perfect — just listen…",
    ],
    encouragements: [
      "You're doing so well, even if it doesn't feel like it yet.",
      "Every small step you take is building something real inside you.",
      "I see you trying, and that matters more than you know.",
    ],
    closings: [
      "You did beautifully today. Be proud of yourself.",
      "Rest well. You earned this moment of growth.",
      "I'm proud of you. See you next time, love.",
    ],
  },
  calm: {
    label: "Calm TJ",
    emoji: "🧘",
    description: "Steady, focused, and grounded — like a quiet study companion.",
    color: "hsl(200 45% 45%)",
    greetings: [
      "Welcome. Let's settle in and focus.",
      "Good to see you. Ready when you are.",
      "Take a moment. Center yourself. Now let's begin.",
    ],
    transitionPhrases: [
      "Now, moving on to the next piece…",
      "Let's look at this clearly…",
      "Here's what to notice…",
    ],
    encouragements: [
      "You're on track. Keep going.",
      "Steady progress. That's all that matters.",
      "Good. You're processing this well.",
    ],
    closings: [
      "Well done. You showed up and that's enough.",
      "Another session completed. Trust the process.",
      "Take what you learned and let it settle.",
    ],
  },
  direct: {
    label: "Direct TJ",
    emoji: "🎯",
    description: "Clear, no-fluff, straight to the point — for focused learners.",
    color: "hsl(0 0% 30%)",
    greetings: [
      "Let's get started.",
      "Here's what we're covering today.",
      "No time to waste — let's learn.",
    ],
    transitionPhrases: [
      "Key point:",
      "Here's what matters:",
      "Bottom line:",
      "Focus here:",
    ],
    encouragements: [
      "Correct. Move on.",
      "That's right. Keep going.",
      "Good recall. Next.",
    ],
    closings: [
      "Done. Review this again before your exam.",
      "Session complete. Practice what you learned.",
      "You covered the material. Now apply it.",
    ],
  },
  encouraging: {
    label: "Encouraging TJ",
    emoji: "💜",
    description: "Uplifting, affirming, and belief-building — for confidence growth.",
    color: "hsl(265 60% 50%)",
    greetings: [
      "I believe in you. Let's prove it together today.",
      "You're stronger than you think. Let me show you.",
      "Every time you show up, you get closer. I see it.",
    ],
    transitionPhrases: [
      "And here's something beautiful about this…",
      "I want you to really take this in…",
      "This next part? You were made for it…",
    ],
    encouragements: [
      "See? You understood that. You're building real knowledge.",
      "That answer shows growth. I'm proud of you.",
      "You're not just memorizing — you're learning. There's a difference.",
    ],
    closings: [
      "You just proved something to yourself today.",
      "Remember this feeling. You earned it.",
      "Come back tomorrow knowing you're capable of more than you realize.",
    ],
  },
};

/**
 * Get a random phrase from a tone category.
 */
export function getTonePhrase(
  tone: TJToneMode,
  category: "greetings" | "transitionPhrases" | "encouragements" | "closings"
): string {
  const profile = TJ_TONES[tone];
  const phrases = profile[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Apply tone to a generic instructional caption.
 */
export function applyToneToCaption(tone: TJToneMode, stepKey: string, originalCaption: string): string {
  const t = TJ_TONES[tone];
  const transition = t.transitionPhrases[Math.floor(Math.random() * t.transitionPhrases.length)];

  const toneMap: Partial<Record<string, Record<TJToneMode, string>>> = {
    visual: {
      hype: "LOOK at this! Your brain is going to light up —",
      gentle: "Just look at this image… let it settle in your mind…",
      calm: "Observe the visual. Notice the details.",
      direct: "Study the image. Note key features.",
      encouraging: "Your visual brain is your superpower — let's use it…",
    },
    definition: {
      hype: "Here's what this word REALLY means —",
      gentle: "Let me softly explain what this means…",
      calm: "Here is the definition. Read it carefully.",
      direct: "Definition:",
      encouraging: "Understanding starts here — and you're ready for it…",
    },
    scripture: {
      hype: "Check out what the Scripture says — this is POWERFUL!",
      gentle: "Let's read this passage together… take your time…",
      calm: "Read the scripture. Let the words speak.",
      direct: "Scripture reference:",
      encouraging: "This passage has something special for you…",
    },
    reflection: {
      hype: "Now dig DEEP — what does this mean to YOU?",
      gentle: "Take a breath… what comes to mind when you think about this?",
      calm: "Reflect on what you've learned. Write your thoughts.",
      direct: "Write your reflection now.",
      encouraging: "Your thoughts matter. Share what this means to you…",
    },
    quiz: {
      hype: "SHOW ME what you've got! You're READY for this!",
      gentle: "You've prepared for this. Trust yourself, okay?",
      calm: "Answer the question. Take your time.",
      direct: "Quiz time. Select your answer.",
      encouraging: "You know more than you think. Trust what you've built…",
    },
  };

  const stepTones = toneMap[stepKey];
  if (stepTones && stepTones[tone]) return stepTones[tone];
  return `${transition} ${originalCaption}`;
}

/**
 * Map a profile tone_preference string to a TJToneMode.
 */
export function mapProfileTone(preference: string | null | undefined): TJToneMode {
  const map: Record<string, TJToneMode> = {
    gentle: "gentle",
    hype: "hype",
    calm: "calm",
    direct: "direct",
    encouraging: "encouraging",
    supportive: "gentle",
    challenging: "direct",
    neutral: "calm",
  };
  return map[preference || ""] || "encouraging";
}
