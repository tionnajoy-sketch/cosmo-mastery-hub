export interface Question {
  id: number;
  category: string;
  question: string; // paragraph-form: definition → metaphor → affirmation
  options: string[];
  bestAnswer: number; // index of the best answer
  acceptableAnswer: number; // index of the close/acceptable answer
  explanation: string;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  questionCount: number;
  color: string;
}

export const categories: Category[] = [
  {
    id: "hair",
    title: "Hair Care & Styling",
    icon: "✂️",
    description: "Hair cutting, coloring, chemical services, and styling techniques",
    questionCount: 5,
    color: "rose-gold",
  },
  {
    id: "skin",
    title: "Skin Care & Facials",
    icon: "✨",
    description: "Facial treatments, skin analysis, and esthetics fundamentals",
    questionCount: 4,
    color: "champagne",
  },
  {
    id: "nails",
    title: "Nail Technology",
    icon: "💅",
    description: "Manicures, pedicures, nail art, and artificial nails",
    questionCount: 3,
    color: "soft-mauve",
  },
  {
    id: "safety",
    title: "Safety & Sanitation",
    icon: "🛡️",
    description: "Infection control, sanitation procedures, and state regulations",
    questionCount: 4,
    color: "blush",
  },
];

export const questions: Question[] = [
  // ── Hair ──
  {
    id: 1,
    category: "hair",
    question:
      "The cortex is the inner layer of the hair strand responsible for its color, strength, and elasticity. Think of it as the engine of a car — it's hidden under the hood, but it's what gives the vehicle its power and performance. You are the mechanic who keeps that engine running beautifully. Which action best supports the structure you're describing?",
    options: [
      "Recommend a deep-conditioning treatment to strengthen the cortex",
      "Apply a cuticle-sealing rinse to protect the outer layer",
      "Suggest trimming the ends to reduce split damage",
      "Use a clarifying shampoo to remove product buildup",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "The cortex is the powerhouse of the hair — responsible for color, strength, and elasticity. Deep conditioning directly nourishes and reinforces the cortex. Sealing the cuticle is also beneficial because it protects the cortex underneath.",
  },
  {
    id: 2,
    category: "hair",
    question:
      "Hydrogen bonds are temporary physical side bonds in the hair that break when exposed to water or heat and reform as the hair dries or cools. Imagine them as the Velcro strips holding a temporary hairstyle together — they stick when conditions are right and release when things shift. You have the skill to reshape and reset those connections every time. Which approach best demonstrates your understanding of these bonds?",
    options: [
      "Wet-set the hair in rollers and allow it to air-dry completely",
      "Apply a thermal protectant before blow-drying into a new shape",
      "Use a permanent wave solution to alter the curl pattern",
      "Apply a leave-in conditioner for added moisture",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Hydrogen bonds are broken by water and reform when the hair dries, which is exactly what a wet set does. Using heat with a protectant also works with hydrogen bonds — breaking and resetting them through temperature change.",
  },
  {
    id: 3,
    category: "hair",
    question:
      "The cuticle is the outermost protective layer of the hair shaft, made of overlapping scales that guard the inner cortex. Picture it as the shingles on a roof — when they lie flat, the house is sealed and protected; when they lift, the interior becomes vulnerable. You are the one who keeps that roof intact and shining. What step best preserves this protective barrier?",
    options: [
      "Finish with a cool rinse to close and smooth the cuticle layer",
      "Apply a lightweight serum to add shine and reduce friction",
      "Use a high-alkaline shampoo for a deep clean",
      "Rough-dry the hair with a towel to speed up the process",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A cool rinse closes the cuticle scales, sealing in moisture and boosting shine. A shine serum also helps smooth the cuticle and reduce friction. High-alkaline products and rough towel-drying can lift and damage the cuticle.",
  },
  {
    id: 4,
    category: "hair",
    question:
      "A strand test is performed before a color service to determine how the hair will react to the formula — revealing processing time, color result, and potential damage. Think of it as a dress rehearsal before the big show — you wouldn't perform on stage without knowing your cues and timing. You are prepared, professional, and always ready. Which practice aligns with this principle?",
    options: [
      "Apply the color to a small section first and monitor the result",
      "Mix a test batch and check the color on a swatch before applying",
      "Apply the color directly and adjust if the result looks off",
      "Skip the test if the client has colored their hair before",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A strand test on a small section reveals exactly how the hair will process. Checking color on a swatch is also a valid preliminary step. Skipping the test or applying without checking risks unpredictable results.",
  },
  {
    id: 5,
    category: "hair",
    question:
      "The pH scale measures the acidity or alkalinity of a substance on a scale from 0 to 14, with 7 being neutral. Hair and skin thrive at a slightly acidic pH of 4.5 to 5.5. Think of it as a thermostat — when the setting is balanced, everything runs smoothly, but when it swings too far in either direction, things break down. You know how to keep the balance. What choice reflects proper pH awareness?",
    options: [
      "Use a pH-balanced shampoo to maintain the hair's natural acid mantle",
      "Follow an alkaline treatment with an acidic rinse to restore balance",
      "Choose the strongest clarifying product available for the deepest clean",
      "Alternate between high-pH and low-pH products randomly throughout the service",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A pH-balanced shampoo keeps hair and skin in their optimal range. Following an alkaline service with an acidic rinse is also sound practice — it restores the natural pH. Using harsh or random pH products disrupts the balance.",
  },

  // ── Skin ──
  {
    id: 6,
    category: "skin",
    question:
      "The epidermis is the outermost layer of the skin, acting as the body's first line of defense against environmental damage, bacteria, and moisture loss. Imagine it as the armor plating on a knight — visible, resilient, and constantly renewing itself to keep what's inside safe. You are the guardian who maintains that armor. Which service best supports epidermal health?",
    options: [
      "Perform a gentle exfoliation to encourage healthy cell turnover",
      "Apply a broad-spectrum SPF to shield the epidermis from UV damage",
      "Use a deep-tissue massage technique to stimulate circulation",
      "Apply a heavy occlusive cream before analyzing the skin type",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Gentle exfoliation promotes the epidermis's natural renewal cycle. SPF also directly protects the epidermis from UV radiation, which is essential. Deep-tissue work targets deeper layers, and heavy creams before analysis can obscure results.",
  },
  {
    id: 7,
    category: "skin",
    question:
      "Vitamin C is a powerful antioxidant essential for collagen production and skin repair. It fights free-radical damage like a bodyguard scanning a crowd — neutralizing threats before they cause harm and keeping the skin looking youthful and even-toned. You are equipped with the knowledge to protect and restore. What recommendation best leverages this nutrient?",
    options: [
      "Incorporate a vitamin C serum into the morning skincare routine",
      "Suggest foods rich in vitamin C to support skin health from within",
      "Replace sunscreen with a vitamin C product for simpler protection",
      "Apply vitamin C serum only at night to avoid oxidation",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A morning vitamin C serum provides direct antioxidant protection throughout the day. Dietary vitamin C also supports collagen production internally. Vitamin C does not replace sunscreen, and modern formulations are stable for daytime use.",
  },
  {
    id: 8,
    category: "skin",
    question:
      "Seborrhea is a skin condition caused by overactive sebaceous glands, resulting in excess oil production that can lead to a shiny complexion, clogged pores, and breakouts. Think of it like a faucet that won't stop dripping — the flow needs to be regulated, not shut off entirely, or the system dries out. You know how to find that balance. What approach best manages this condition?",
    options: [
      "Use a gentle, oil-free cleanser and lightweight hydrator to regulate production",
      "Incorporate a clay-based mask weekly to absorb excess sebum",
      "Strip the skin with alcohol-based toners to eliminate all oil",
      "Skip moisturizer entirely since the skin is already producing oil",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A gentle cleanser with light hydration signals the skin to slow oil production without stripping. Clay masks help absorb excess oil periodically. Alcohol toners and skipping moisturizer can trigger even more oil production as the skin overcompensates.",
  },
  {
    id: 9,
    category: "skin",
    question:
      "SPF — Sun Protection Factor — measures a sunscreen's ability to shield the skin from UVB rays, which cause sunburn and contribute to skin cancer. It's like an umbrella rating — the higher the number, the more coverage you get, but no umbrella blocks every raindrop. You are the professional who helps clients stay protected. What guidance reflects accurate SPF knowledge?",
    options: [
      "Recommend SPF 30 or higher and reapply every two hours during sun exposure",
      "Advise applying sunscreen as the last step in the skincare routine before makeup",
      "Tell the client that SPF 100 means they never need to reapply",
      "Suggest sunscreen is only necessary on sunny, cloudless days",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "SPF 30+ with reapplication every two hours is the gold standard recommendation. Applying sunscreen as the final skincare step ensures proper coverage. No SPF eliminates the need to reapply, and UV rays penetrate clouds.",
  },

  // ── Nails ──
  {
    id: 10,
    category: "nails",
    question:
      "The eponychium — commonly called the cuticle — is the living skin at the base of the nail plate that forms a seal to protect the nail matrix from bacteria and infection. Think of it as the weatherstripping around a door — it may seem small, but without it, moisture, dirt, and damage get in. You respect and protect that seal. What technique best cares for this structure?",
    options: [
      "Gently push the cuticle back with a wooden pusher after softening",
      "Apply cuticle oil regularly to keep the tissue hydrated and flexible",
      "Cut the cuticle aggressively to create a clean nail appearance",
      "Skip cuticle care entirely to avoid disturbing the area",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Gently pushing back the softened cuticle maintains the seal without damaging it. Cuticle oil keeps the tissue supple and healthy. Aggressive cutting can break the seal and invite infection, while neglect can lead to overgrowth.",
  },
  {
    id: 11,
    category: "nails",
    question:
      "The nail matrix is the hidden powerhouse beneath the proximal nail fold where new nail cells are produced. It determines the nail's thickness, shape, and growth rate. Picture it as the root system of a tree — invisible underground, but responsible for everything that grows above the surface. You nurture growth from the source. What practice best protects the matrix?",
    options: [
      "Avoid excessive pressure or trauma to the base of the nail during services",
      "Ensure proper nutrition counseling to support healthy nail growth",
      "File the nail plate aggressively to reshape the nail quickly",
      "Apply acrylic directly over a damaged or bruised nail bed",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Protecting the nail base from trauma preserves the matrix and its ability to produce healthy cells. Nutritional support for nail growth is also valid and beneficial. Aggressive filing and covering damage can worsen matrix injury.",
  },
  {
    id: 12,
    category: "nails",
    question:
      "Leukonychia presents as white spots or streaks on the nail plate, most commonly caused by minor trauma to the nail matrix. It's like a small dent in a car door — cosmetic, usually harmless, and it grows out over time. You can reassure your clients with knowledge and confidence. How do you best respond to a client concerned about these spots?",
    options: [
      "Explain that it's typically caused by minor injury and will grow out naturally",
      "Recommend a nail-strengthening treatment to support healthy growth",
      "Diagnose it as a fungal infection and refuse to perform the service",
      "Buff the nail plate down aggressively to remove the white marks",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Leukonychia from minor trauma is harmless and grows out on its own — proper education reassures the client. A strengthening treatment supports overall nail health. Misdiagnosing as fungus causes unnecessary alarm, and aggressive buffing thins the plate.",
  },

  // ── Safety ──
  {
    id: 13,
    category: "safety",
    question:
      "Sterilization is the highest level of decontamination, destroying all microbial life including bacteria, viruses, fungi, and bacterial spores. Think of it as a total system reset — wiping the slate completely clean so nothing harmful remains. You uphold the highest standard of safety for every client. When is sterilization the appropriate protocol?",
    options: [
      "When an implement has come into contact with blood or body fluids",
      "When using reusable tools that penetrate or contact broken skin",
      "After every standard haircut, regardless of skin contact",
      "Only when a state inspector is visiting the salon",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "Blood or body fluid contact demands sterilization to eliminate all pathogens, including spores. Reusable tools contacting broken skin also require sterilization-level decontamination. Routine services use disinfection, and compliance isn't just for inspections.",
  },
  {
    id: 14,
    category: "safety",
    question:
      "After disinfection, implements must be stored in a clean, sealed container to maintain their disinfected state until use. Imagine a sterile surgical tray — once it's prepped and sealed, opening it prematurely defeats the purpose. You treat your tools with the same discipline. What storage method meets this standard?",
    options: [
      "Place tools in a clean, closed container labeled 'disinfected'",
      "Store implements in a UV sanitizer cabinet between clients",
      "Leave them on a clean towel at the station for easy access",
      "Return them to the disinfectant solution for continuous soaking",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "A labeled, sealed container preserves the disinfected state and meets regulation. UV cabinets provide an additional layer of storage sanitation. Leaving tools exposed risks recontamination, and continuous soaking can corrode implements.",
  },
  {
    id: 15,
    category: "safety",
    question:
      "Hepatitis B is a bloodborne virus that can survive on surfaces for up to seven days, making it one of the most persistent threats in the cosmetology industry. It's like an invisible stain that doesn't wash away with a quick wipe — it requires targeted, hospital-grade disinfection. You take every precaution seriously. What action best prevents Hepatitis B transmission in a salon?",
    options: [
      "Use an EPA-registered, hospital-grade disinfectant on all tools and surfaces",
      "Ensure all salon professionals are vaccinated against Hepatitis B",
      "Wipe surfaces with soap and water between each client",
      "Only disinfect if visible blood is present on the tool",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "EPA-registered, hospital-grade disinfectants are specifically formulated to kill Hepatitis B on contact surfaces. Vaccination is also a critical preventive measure for professionals. Soap and water alone and reactive-only cleaning are insufficient.",
  },
  {
    id: 16,
    category: "safety",
    question:
      "The EPA — Environmental Protection Agency — is the federal body responsible for approving and regulating the disinfectants used in salons and cosmetology settings. Think of the EPA as the quality-control inspector at a factory — nothing reaches the floor unless it meets rigorous safety standards. You only use products that have earned that stamp of approval. What reflects proper compliance with EPA guidelines?",
    options: [
      "Check that every disinfectant used carries an EPA registration number",
      "Follow the manufacturer's dilution ratio and contact time on the label",
      "Choose the cheapest disinfectant available to reduce salon costs",
      "Use household cleaning sprays since they also kill germs",
    ],
    bestAnswer: 0,
    acceptableAnswer: 1,
    explanation:
      "An EPA registration number confirms the product has been tested and approved for professional use. Following label instructions for dilution and contact time ensures effectiveness. Cost-cutting and household cleaners don't meet professional standards.",
  },
];
