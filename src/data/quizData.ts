export interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
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
    questionCount: 15,
    color: "rose-gold",
  },
  {
    id: "skin",
    title: "Skin Care & Facials",
    icon: "✨",
    description: "Facial treatments, skin analysis, and esthetics fundamentals",
    questionCount: 12,
    color: "champagne",
  },
  {
    id: "nails",
    title: "Nail Technology",
    icon: "💅",
    description: "Manicures, pedicures, nail art, and artificial nails",
    questionCount: 10,
    color: "soft-mauve",
  },
  {
    id: "safety",
    title: "Safety & Sanitation",
    icon: "🛡️",
    description: "Infection control, sanitation procedures, and state regulations",
    questionCount: 15,
    color: "blush",
  },
];

export const questions: Question[] = [
  // Hair
  {
    id: 1,
    category: "hair",
    question: "What is the cortex of the hair responsible for?",
    options: ["Protection", "Color and strength", "Growth", "Shine"],
    correctAnswer: 1,
    explanation: "The cortex gives hair its color, strength, and elasticity. It makes up the majority of the hair strand.",
  },
  {
    id: 2,
    category: "hair",
    question: "Which type of bond is temporarily broken by water or heat?",
    options: ["Disulfide bond", "Peptide bond", "Hydrogen bond", "Salt bond"],
    correctAnswer: 2,
    explanation: "Hydrogen bonds are physical side bonds that are easily broken by water or heat and reform as hair dries or cools.",
  },
  {
    id: 3,
    category: "hair",
    question: "What does the pH scale measure?",
    options: ["Temperature", "Acidity and alkalinity", "Hair density", "Color depth"],
    correctAnswer: 1,
    explanation: "The pH scale measures the acidity or alkalinity of a substance on a scale from 0 to 14.",
  },
  {
    id: 4,
    category: "hair",
    question: "What is the purpose of a strand test before coloring?",
    options: ["To check porosity only", "To determine processing time and expected results", "To measure hair length", "To check for split ends"],
    correctAnswer: 1,
    explanation: "A strand test determines how the hair will react to the color formula, including processing time and final result.",
  },
  {
    id: 5,
    category: "hair",
    question: "Which hair layer is the outermost protective layer?",
    options: ["Medulla", "Cortex", "Cuticle", "Dermal papilla"],
    correctAnswer: 2,
    explanation: "The cuticle is the outermost layer of the hair shaft, providing protection and contributing to shine.",
  },
  // Skin
  {
    id: 6,
    category: "skin",
    question: "What is the outermost layer of the skin called?",
    options: ["Dermis", "Hypodermis", "Epidermis", "Subcutaneous"],
    correctAnswer: 2,
    explanation: "The epidermis is the outermost layer of the skin that provides a protective barrier.",
  },
  {
    id: 7,
    category: "skin",
    question: "Which vitamin is essential for skin repair and is an antioxidant?",
    options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
    correctAnswer: 2,
    explanation: "Vitamin C is crucial for collagen production, skin repair, and acts as a powerful antioxidant.",
  },
  {
    id: 8,
    category: "skin",
    question: "What type of skin condition is characterized by excessive oil production?",
    options: ["Dehydrated skin", "Seborrhea", "Rosacea", "Eczema"],
    correctAnswer: 1,
    explanation: "Seborrhea is a condition caused by overactive sebaceous glands, resulting in excessively oily skin.",
  },
  {
    id: 9,
    category: "skin",
    question: "What does SPF stand for?",
    options: ["Skin Protection Formula", "Sun Protection Factor", "Safe Protection Film", "Sun Proof Finish"],
    correctAnswer: 1,
    explanation: "SPF stands for Sun Protection Factor, which measures the level of protection from UVB rays.",
  },
  // Nails
  {
    id: 10,
    category: "nails",
    question: "What is the living skin at the base of the nail called?",
    options: ["Lunula", "Eponychium", "Hyponychium", "Free edge"],
    correctAnswer: 1,
    explanation: "The eponychium (cuticle) is the living skin at the base of the nail plate that protects the matrix.",
  },
  {
    id: 11,
    category: "nails",
    question: "What part of the nail is responsible for nail growth?",
    options: ["Nail bed", "Nail plate", "Matrix", "Lunula"],
    correctAnswer: 2,
    explanation: "The matrix is the area where new nail cells are produced, responsible for nail growth.",
  },
  {
    id: 12,
    category: "nails",
    question: "Which nail disorder appears as white spots on the nail plate?",
    options: ["Onychomycosis", "Leukonychia", "Melanonychia", "Paronychia"],
    correctAnswer: 1,
    explanation: "Leukonychia presents as white spots on the nail plate, often caused by minor trauma to the matrix.",
  },
  // Safety
  {
    id: 13,
    category: "safety",
    question: "What is the highest level of decontamination?",
    options: ["Sanitization", "Disinfection", "Sterilization", "Cleaning"],
    correctAnswer: 2,
    explanation: "Sterilization is the highest level of decontamination, destroying all microbial life including spores.",
  },
  {
    id: 14,
    category: "safety",
    question: "How should implements be stored after disinfection?",
    options: ["On the counter", "In a sealed, clean container", "In a drawer", "Back in disinfectant"],
    correctAnswer: 1,
    explanation: "After disinfection, implements should be stored in a clean, sealed container to maintain their disinfected state.",
  },
  {
    id: 15,
    category: "safety",
    question: "What type of hepatitis is most commonly transmitted through blood?",
    options: ["Hepatitis A", "Hepatitis B", "Hepatitis C", "Hepatitis D"],
    correctAnswer: 1,
    explanation: "Hepatitis B is most commonly transmitted through blood contact and is a major concern in the cosmetology industry.",
  },
  {
    id: 16,
    category: "safety",
    question: "What is the EPA responsible for in relation to salon safety?",
    options: ["Licensing cosmetologists", "Approving disinfectants", "Setting hair color standards", "Teaching cosmetology"],
    correctAnswer: 1,
    explanation: "The EPA (Environmental Protection Agency) approves and regulates the disinfectants used in salons.",
  },
];
