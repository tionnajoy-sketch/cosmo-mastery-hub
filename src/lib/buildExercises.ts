// Build the Body exercises — active recall + chunking + patterning
// Each exercise gives scrambled pieces the student must group correctly
// bodyRegion highlights the corresponding area on the skeleton diagram

import type { BodyRegion } from "@/components/BodyDiagram";

export interface BuildGroup {
  label: string;
  items: string[];
}

export interface BuildExercise {
  prompt: string;
  groups: BuildGroup[];
  distractors?: string[];
  bodyRegion?: BodyRegion;
}

// Keyed by term name (lowercase) for lookup
export const buildExercises: Record<string, BuildExercise> = {

  // ═══════════════════════════════════════
  // SKIN STRUCTURE & GROWTH
  // ═══════════════════════════════════════

  epidermis: {
    prompt: "Build the layers of the Epidermis.",
    bodyRegion: "skin",
    groups: [
      { label: "Outermost Layer", items: ["Stratum corneum", "Dead keratinized cells", "Barrier against environment"] },
      { label: "Middle Layers", items: ["Stratum granulosum", "Stratum spinosum", "Cells flatten as they rise"] },
      { label: "Deepest Layer", items: ["Stratum germinativum (basal layer)", "Where new skin cells are born", "Contains melanocytes"] },
    ],
    distractors: ["Contains blood vessels", "Has fat cells"],
  },
  dermis: {
    prompt: "Build the Dermis.",
    bodyRegion: "skin",
    groups: [
      { label: "Papillary Layer", items: ["Upper portion of dermis", "Contains capillaries", "Creates fingerprints"] },
      { label: "Reticular Layer", items: ["Deeper layer of dermis", "Contains collagen and elastin", "Provides strength and flexibility"] },
      { label: "Structures Found Here", items: ["Hair follicles", "Sweat glands", "Nerve endings", "Blood vessels"] },
    ],
    distractors: ["Dead skin cells", "No blood supply"],
  },
  "subcutaneous tissue": {
    prompt: "Build the Subcutaneous Layer.",
    bodyRegion: "skin",
    groups: [
      { label: "What It Is", items: ["Deepest layer", "Also called hypodermis", "Made of fatty (adipose) tissue"] },
      { label: "What It Does", items: ["Insulates the body", "Cushions and protects", "Stores energy as fat", "Connects skin to muscle/bone"] },
    ],
    distractors: ["Produces melanin", "Contains hair follicles"],
  },
  melanin: {
    prompt: "Build what Melanin does in the skin.",
    bodyRegion: "skin",
    groups: [
      { label: "What It Is", items: ["A pigment produced by melanocytes", "Found in the basal layer of epidermis"] },
      { label: "What It Does", items: ["Gives skin its color", "Protects against UV radiation", "More melanin = darker skin tone"] },
    ],
    distractors: ["Provides elasticity", "Fights bacteria"],
  },
  keratin: {
    prompt: "Build what Keratin does.",
    bodyRegion: "skin",
    groups: [
      { label: "What It Is", items: ["A tough protective protein", "Found in skin, hair, and nails"] },
      { label: "In Skin", items: ["Makes the outermost layer waterproof", "Dead keratin cells form the stratum corneum"] },
      { label: "In Hair & Nails", items: ["Main structural protein of hair", "Makes nails hard and strong"] },
    ],
    distractors: ["Gives skin its color", "Carries oxygen"],
  },
  collagen: {
    prompt: "Build what Collagen does.",
    bodyRegion: "skin",
    groups: [
      { label: "What It Is", items: ["Most abundant protein in the body", "Found in the dermis"] },
      { label: "What It Does", items: ["Gives skin its strength", "Provides structural support", "Decreases with age — causes wrinkles"] },
    ],
    distractors: ["Gives skin its color", "Fights infection"],
  },
  elastin: {
    prompt: "Build what Elastin does.",
    bodyRegion: "skin",
    groups: [
      { label: "What It Is", items: ["A flexible protein in the dermis", "Works alongside collagen"] },
      { label: "What It Does", items: ["Allows skin to stretch and snap back", "Gives skin its elasticity", "Decreases with age — skin sags"] },
    ],
    distractors: ["Produces new cells", "Blocks UV light"],
  },
  "sudoriferous glands": {
    prompt: "Build the Sweat Glands.",
    bodyRegion: "skin",
    groups: [
      { label: "Eccrine Glands", items: ["Found all over the body", "Produce watery sweat", "Regulate body temperature"] },
      { label: "Apocrine Glands", items: ["Found in armpits and groin", "Produce thicker secretion", "Activated during stress/puberty"] },
    ],
    distractors: ["Produce oil/sebum", "Found only on the face"],
  },
  "sebaceous glands": {
    prompt: "Build the Oil (Sebaceous) Glands.",
    bodyRegion: "skin",
    groups: [
      { label: "What They Are", items: ["Oil-producing glands", "Connected to hair follicles", "Found everywhere except palms and soles"] },
      { label: "What They Do", items: ["Produce sebum (oil)", "Lubricate skin and hair", "Help keep skin soft and waterproof"] },
    ],
    distractors: ["Regulate temperature", "Produce sweat"],
  },
  "skin functions": {
    prompt: "Build the 6 Functions of Skin.",
    bodyRegion: "skin",
    groups: [
      { label: "Protection", items: ["Barrier against bacteria", "Shields from UV damage"] },
      { label: "Regulation", items: ["Controls body temperature", "Sweating cools the body"] },
      { label: "Sensation & More", items: ["Detects touch, pain, pressure", "Absorbs certain substances", "Excretes waste through sweat", "Produces Vitamin D"] },
    ],
    distractors: ["Pumps blood", "Digests nutrients"],
  },
  "hair follicle": {
    prompt: "Build the Hair Follicle.",
    bodyRegion: "skin",
    groups: [
      { label: "Structure", items: ["Tube-like opening in the skin", "Located in the dermis", "Contains the hair root"] },
      { label: "Connected Structures", items: ["Sebaceous gland — produces oil", "Arrector pili muscle — causes goosebumps", "Hair bulb — where growth begins"] },
    ],
    distractors: ["Contains blood cells", "Located in the epidermis"],
  },
  "nail structure": {
    prompt: "Build the parts of the Nail.",
    bodyRegion: "hand",
    groups: [
      { label: "Visible Parts", items: ["Nail plate — hard visible nail", "Free edge — tip that extends beyond finger", "Lunula — half-moon at base"] },
      { label: "Hidden Parts", items: ["Nail matrix — where nail growth begins", "Nail bed — skin beneath the plate", "Cuticle — protective seal at base"] },
    ],
    distractors: ["Hair follicle", "Sweat gland"],
  },
  "skin layers": {
    prompt: "Build all 3 layers of Skin.",
    bodyRegion: "skin",
    groups: [
      { label: "Epidermis (Outermost)", items: ["No blood vessels", "Contains melanocytes", "Constantly sheds and renews"] },
      { label: "Dermis (Middle)", items: ["Contains blood vessels and nerves", "Has collagen and elastin", "Where hair follicles live"] },
      { label: "Subcutaneous (Deepest)", items: ["Made of fatty tissue", "Insulates and cushions", "Connects skin to body"] },
    ],
    distractors: ["Contains bones", "Produces blood cells"],
  },

  // ═══════════════════════════════════════
  // ANATOMY & PHYSIOLOGY — Cells & Metabolism
  // ═══════════════════════════════════════

  cell: {
    prompt: "Build the parts of a Cell.",
    bodyRegion: "full",
    groups: [
      { label: "Cell Membrane", items: ["Protects the cell", "Controls what enters and exits"] },
      { label: "Nucleus", items: ["Contains DNA", "Controls cell activity"] },
      { label: "Cytoplasm", items: ["Jelly-like fluid", "Holds organelles in place"] },
    ],
    distractors: ["Produces red blood cells", "Sends nerve signals"],
  },
  nucleus: {
    prompt: "Build what the Nucleus does.",
    bodyRegion: "full",
    groups: [
      { label: "Structure", items: ["Dense center of the cell", "Contains chromosomes"] },
      { label: "Function", items: ["Controls cell reproduction", "Directs cell activity", "Stores genetic information"] },
    ],
    distractors: ["Digests food", "Pumps blood"],
  },
  cytoplasm: {
    prompt: "Build the Cytoplasm environment.",
    bodyRegion: "full",
    groups: [
      { label: "What It Is", items: ["Watery jelly-like substance", "Found between nucleus and cell membrane"] },
      { label: "What It Does", items: ["Holds organelles", "Site of chemical reactions", "Provides structure to the cell"] },
    ],
    distractors: ["Contracts muscles", "Filters blood"],
  },
  "cell membrane": {
    prompt: "Build the Cell Membrane's roles.",
    bodyRegion: "full",
    groups: [
      { label: "Protection", items: ["Surrounds the entire cell", "Acts as a barrier"] },
      { label: "Transport", items: ["Controls what enters the cell", "Controls what exits the cell", "Selectively permeable"] },
    ],
    distractors: ["Produces energy", "Stores fat"],
  },
  metabolism: {
    prompt: "Build the two phases of Metabolism.",
    bodyRegion: "full",
    groups: [
      { label: "Anabolism", items: ["Building up", "Stores energy", "Constructs complex molecules"] },
      { label: "Catabolism", items: ["Breaking down", "Releases energy", "Breaks complex molecules into simple ones"] },
    ],
    distractors: ["Nerve transmission", "Blood clotting"],
  },
  anabolism: {
    prompt: "Build the Anabolism process.",
    bodyRegion: "full",
    groups: [
      { label: "What Happens", items: ["Small molecules combine", "Complex substances are built", "Energy is stored"] },
      { label: "Examples", items: ["Building muscle tissue", "Growing new cells", "Repairing damaged skin"] },
    ],
    distractors: ["Digesting food", "Breaking down fat"],
  },
  catabolism: {
    prompt: "Build the Catabolism process.",
    bodyRegion: "full",
    groups: [
      { label: "What Happens", items: ["Complex molecules break apart", "Energy is released", "Substances become simpler"] },
      { label: "Examples", items: ["Digesting food into nutrients", "Breaking down glucose for energy"] },
    ],
    distractors: ["Building bone", "Growing hair"],
  },
  mitosis: {
    prompt: "Build the stages of Mitosis.",
    bodyRegion: "full",
    groups: [
      { label: "Step 1: Prepare", items: ["Cell grows", "DNA duplicates"] },
      { label: "Step 2: Divide", items: ["Chromosomes line up", "Cell splits in two"] },
      { label: "Result", items: ["Two identical daughter cells", "Each has same DNA as parent"] },
    ],
    distractors: ["Three cells form", "DNA is destroyed"],
  },

  // Tissues, Organs, Systems
  "epithelial tissue": {
    prompt: "Build Epithelial Tissue.",
    bodyRegion: "skin",
    groups: [
      { label: "Where It Is", items: ["Skin surface", "Lining of organs", "Body cavities"] },
      { label: "What It Does", items: ["Protects underlying tissue", "Absorbs nutrients", "Secretes substances"] },
    ],
    distractors: ["Contracts to create movement", "Transmits electrical impulses"],
  },
  "connective tissue": {
    prompt: "Build Connective Tissue types.",
    bodyRegion: "full",
    groups: [
      { label: "Supportive", items: ["Bone", "Cartilage"] },
      { label: "Fluid", items: ["Blood", "Lymph"] },
      { label: "Binding", items: ["Tendons", "Ligaments", "Fascia"] },
    ],
    distractors: ["Neurons", "Skin cells"],
  },
  "muscle tissue": {
    prompt: "Build the 3 types of Muscle Tissue.",
    bodyRegion: "torso",
    groups: [
      { label: "Skeletal", items: ["Attached to bones", "Voluntary movement", "Striated appearance"] },
      { label: "Cardiac", items: ["Found in the heart", "Involuntary", "Pumps blood"] },
      { label: "Smooth", items: ["Found in organs", "Involuntary", "Walls of blood vessels"] },
    ],
    distractors: ["Found in the brain", "Produces hormones"],
  },
  "nerve tissue": {
    prompt: "Build how Nerve Tissue works.",
    bodyRegion: "brain",
    groups: [
      { label: "Structure", items: ["Neurons (nerve cells)", "Found in brain and spinal cord"] },
      { label: "Function", items: ["Transmits electrical signals", "Coordinates body responses", "Processes sensory information"] },
    ],
    distractors: ["Produces blood cells", "Stores fat"],
  },
  organ: {
    prompt: "Build the levels of body organization.",
    bodyRegion: "full",
    groups: [
      { label: "Level 1", items: ["Cells — smallest living unit"] },
      { label: "Level 2", items: ["Tissues — groups of similar cells"] },
      { label: "Level 3", items: ["Organs — groups of tissues with a function"] },
      { label: "Level 4", items: ["Systems — organs working together"] },
    ],
    distractors: ["Atoms — chemical elements"],
  },
  "body systems": {
    prompt: "Build the major Body Systems.",
    bodyRegion: "full",
    groups: [
      { label: "Movement & Support", items: ["Skeletal system", "Muscular system"] },
      { label: "Control & Communication", items: ["Nervous system", "Endocrine system"] },
      { label: "Transport & Defense", items: ["Circulatory system", "Lymphatic system"] },
    ],
    distractors: ["Solar system", "Sound system"],
  },

  // Skeletal System
  "frontal bone": {
    prompt: "Build the bones of the Cranium (front).",
    bodyRegion: "skull",
    groups: [
      { label: "Frontal Bone", items: ["Forms the forehead", "Located above the eyes"] },
      { label: "Parietal Bones", items: ["Form the top and sides of the head", "Come in a pair"] },
      { label: "Temporal Bones", items: ["Located at the sides/temples", "Contain ear openings"] },
    ],
    distractors: ["Forms the jaw", "Located in the neck"],
  },
  "occipital bone": {
    prompt: "Build the bones of the Cranium (back & base).",
    bodyRegion: "skull",
    groups: [
      { label: "Occipital Bone", items: ["Back of the skull", "Contains foramen magnum"] },
      { label: "Sphenoid Bone", items: ["Bat-shaped", "Joins all cranial bones together"] },
      { label: "Ethmoid Bone", items: ["Between the eye sockets", "Forms part of the nasal cavity"] },
    ],
    distractors: ["Forms the chin", "Located in the chest"],
  },
  "nasal bones": {
    prompt: "Build the bones of the Face.",
    bodyRegion: "face",
    groups: [
      { label: "Upper Face", items: ["Nasal bones — bridge of nose", "Lacrimal bones — inner eye corners", "Zygomatic bones — cheekbones"] },
      { label: "Lower Face", items: ["Mandible — lower jawbone", "Maxillae — upper jawbones"] },
    ],
    distractors: ["Femur — thigh bone", "Scapula — shoulder blade"],
  },
  mandible: {
    prompt: "Build the Mandible (lower jaw).",
    bodyRegion: "face",
    groups: [
      { label: "What It Is", items: ["Largest bone of the face", "Only movable bone of the skull"] },
      { label: "What It Does", items: ["Opens and closes the mouth", "Chewing and speaking"] },
    ],
    distractors: ["Protects the brain", "Supports the spine"],
  },
  "hyoid bone": {
    prompt: "Build the Hyoid Bone.",
    bodyRegion: "neck",
    groups: [
      { label: "Location", items: ["In the throat", "Below the mandible", "Above the larynx"] },
      { label: "Unique Feature", items: ["Only bone not connected to another bone", "Supported by muscles and ligaments"] },
      { label: "Function", items: ["Supports the tongue", "Aids in swallowing"] },
    ],
    distractors: ["Connected to the spine", "Part of the rib cage"],
  },
  cervical: {
    prompt: "Build the regions of the Spine.",
    bodyRegion: "spine",
    groups: [
      { label: "Cervical (7)", items: ["Neck region", "Supports the head", "Most mobile section"] },
      { label: "Thoracic (12)", items: ["Upper/mid back", "Connects to ribs"] },
      { label: "Lumbar (5)", items: ["Lower back", "Bears most body weight", "Largest vertebrae"] },
    ],
    distractors: ["Located in the skull", "Part of the arm"],
  },

  // Muscular System
  origin: {
    prompt: "Build the parts of a Muscle.",
    bodyRegion: "arm",
    groups: [
      { label: "Origin", items: ["Fixed attachment point", "Does not move during contraction", "Attached to stationary bone"] },
      { label: "Insertion", items: ["Movable attachment point", "Moves during contraction", "Attached to bone that moves"] },
      { label: "Belly", items: ["Middle/fleshy part", "Where contraction happens", "Thickest section of the muscle"] },
    ],
    distractors: ["Carries blood", "Stores memories"],
  },
  "frontalis muscle": {
    prompt: "Build the muscles of the Scalp & Forehead.",
    bodyRegion: "head",
    groups: [
      { label: "Frontalis", items: ["Front of the forehead", "Raises eyebrows", "Creates forehead wrinkles"] },
      { label: "Occipitalis", items: ["Back of the skull", "Draws scalp backward"] },
      { label: "Epicranius (Occipitofrontalis)", items: ["Covers the top of the skull", "Combination of frontalis + occipitalis"] },
    ],
    distractors: ["Moves the jaw", "Opens the mouth"],
  },
  orbicularis: {
    prompt: "Build the Ring Muscles of the face.",
    bodyRegion: "face",
    groups: [
      { label: "Orbicularis Oculi", items: ["Surrounds the eye", "Closes the eyelid", "Causes squinting and blinking"] },
      { label: "Orbicularis Oris", items: ["Surrounds the mouth", "Closes and puckers the lips", "Used in kissing and whistling"] },
    ],
    distractors: ["Lifts the eyebrow", "Moves the ear"],
  },
  masseter: {
    prompt: "Build the Chewing Muscles.",
    bodyRegion: "face",
    groups: [
      { label: "Masseter", items: ["Jaw muscle", "Closes the jaw", "Strongest muscle for chewing"] },
      { label: "Temporalis", items: ["Temple area", "Assists in closing the jaw", "Works with the masseter"] },
    ],
    distractors: ["Opens the mouth wide", "Raises eyebrows"],
  },
  sternocleidomastoid: {
    prompt: "Build the major Neck Muscles.",
    bodyRegion: "neck",
    groups: [
      { label: "Sternocleidomastoid (SCM)", items: ["Side of the neck", "Turns the head", "Tilts head to one side"] },
      { label: "Platysma", items: ["Front of the neck/throat", "Thin flat muscle", "Draws lower lip down"] },
      { label: "Trapezius", items: ["Back of neck to shoulders", "Shrugs shoulders", "Moves head backward"] },
    ],
    distractors: ["Located in the forearm", "Flexes the elbow"],
  },

  // Nervous System
  "nervous system": {
    prompt: "Build the Nervous System.",
    bodyRegion: "brain",
    groups: [
      { label: "Central Nervous System (CNS)", items: ["Brain", "Spinal cord", "Processes and interprets signals"] },
      { label: "Peripheral Nervous System (PNS)", items: ["Nerves throughout the body", "Sensory input", "Motor output"] },
    ],
    distractors: ["Heart", "Liver", "Kidneys"],
  },
  brain: {
    prompt: "Build the parts of the Brain.",
    bodyRegion: "brain",
    groups: [
      { label: "Cerebrum", items: ["Largest part", "Thinking and reasoning", "Memory and speech"] },
      { label: "Cerebellum", items: ["Back of the brain", "Balance and coordination", "Smooth movements"] },
      { label: "Brain Stem", items: ["Connects brain to spinal cord", "Controls breathing and heartbeat", "Automatic survival functions"] },
    ],
    distractors: ["Produces hormones", "Filters toxins"],
  },
  neuron: {
    prompt: "Build the parts of a Neuron.",
    bodyRegion: "brain",
    groups: [
      { label: "Dendrites", items: ["Branch-like extensions", "Receive incoming signals"] },
      { label: "Cell Body", items: ["Contains the nucleus", "Processes information"] },
      { label: "Axon", items: ["Long tail-like fiber", "Sends signals away from cell body", "Covered by myelin sheath"] },
    ],
    distractors: ["Stores blood", "Produces bile"],
  },
  "sensory nerves": {
    prompt: "Build the types of Nerves.",
    bodyRegion: "spine",
    groups: [
      { label: "Sensory Nerves", items: ["Carry signals TO the brain", "Detect touch, pain, temperature", "Also called afferent nerves"] },
      { label: "Motor Nerves", items: ["Carry signals FROM the brain", "Control muscle movement", "Also called efferent nerves"] },
    ],
    distractors: ["Produce hormones", "Filter waste"],
  },
  reflex: {
    prompt: "Build the Reflex Arc.",
    bodyRegion: "spine",
    groups: [
      { label: "Step 1: Stimulus", items: ["Something triggers a response", "Example: touching something hot"] },
      { label: "Step 2: Sensory Nerve", items: ["Detects the stimulus", "Sends signal to spinal cord"] },
      { label: "Step 3: Motor Response", items: ["Spinal cord sends signal back", "Muscle reacts — you pull away", "Happens before brain processes it"] },
    ],
    distractors: ["Signal goes to the heart", "Response takes several minutes"],
  },

  // Circulatory System
  "circulatory system": {
    prompt: "Build the Circulatory System.",
    bodyRegion: "chest",
    groups: [
      { label: "The Pump", items: ["Heart — pumps blood throughout the body"] },
      { label: "The Highways", items: ["Arteries — carry blood away from heart", "Veins — carry blood back to heart", "Capillaries — tiny vessels for exchange"] },
      { label: "The Fluid", items: ["Blood — carries oxygen and nutrients", "Plasma, red cells, white cells, platelets"] },
    ],
    distractors: ["Lymph nodes", "Spinal fluid"],
  },
  heart: {
    prompt: "Build the Heart's chambers and flow.",
    bodyRegion: "chest",
    groups: [
      { label: "Right Side (Deoxygenated)", items: ["Right atrium receives blood from body", "Right ventricle pumps blood to lungs"] },
      { label: "Left Side (Oxygenated)", items: ["Left atrium receives blood from lungs", "Left ventricle pumps blood to body"] },
    ],
    distractors: ["Blood enters through the spleen", "Oxygen is added in the stomach"],
  },
  arteries: {
    prompt: "Build the Blood Vessel types.",
    bodyRegion: "chest",
    groups: [
      { label: "Arteries", items: ["Carry blood AWAY from heart", "Thick muscular walls", "Carry oxygenated blood (mostly)"] },
      { label: "Veins", items: ["Carry blood BACK to heart", "Thinner walls with valves", "Carry deoxygenated blood (mostly)"] },
      { label: "Capillaries", items: ["Smallest blood vessels", "One cell thick", "Where oxygen/nutrient exchange occurs"] },
    ],
    distractors: ["Carry lymph fluid", "Connect bones to muscles"],
  },
  "white blood cells": {
    prompt: "Build the components of Blood.",
    bodyRegion: "chest",
    groups: [
      { label: "Red Blood Cells", items: ["Carry oxygen", "Contain hemoglobin", "Most abundant blood cell"] },
      { label: "White Blood Cells", items: ["Fight infection", "Part of immune system", "Destroy bacteria and viruses"] },
      { label: "Platelets", items: ["Help blood clot", "Stop bleeding", "Smallest blood components"] },
      { label: "Plasma", items: ["Liquid part of blood", "Carries cells and nutrients", "About 55% of blood volume"] },
    ],
    distractors: ["Carries nerve signals", "Produces hormones"],
  },

  // Lymphatic System
  "lymphatic system": {
    prompt: "Build the Lymphatic System.",
    bodyRegion: "torso",
    groups: [
      { label: "Structures", items: ["Lymph nodes", "Lymph vessels", "Spleen", "Thymus"] },
      { label: "Functions", items: ["Filters waste and toxins", "Fights infection", "Returns fluid to bloodstream", "Produces white blood cells"] },
    ],
    distractors: ["Pumps blood", "Digests food", "Controls body temperature"],
  },
  "lymph nodes": {
    prompt: "Build what Lymph Nodes do.",
    bodyRegion: "neck",
    groups: [
      { label: "What They Are", items: ["Small bean-shaped organs", "Located along lymph vessels", "Found in neck, armpits, groin"] },
      { label: "What They Do", items: ["Filter harmful substances", "Trap bacteria and viruses", "Produce immune cells"] },
    ],
    distractors: ["Pump blood", "Store oxygen"],
  },

  // Body Systems
  "integumentary system": {
    prompt: "Build the Integumentary System.",
    bodyRegion: "skin",
    groups: [
      { label: "Structures", items: ["Skin", "Hair", "Nails", "Sweat glands", "Oil glands"] },
      { label: "Functions", items: ["Protects the body", "Regulates temperature", "Provides sensation", "Eliminates waste through sweat"] },
    ],
    distractors: ["Produces hormones", "Digests nutrients"],
  },
  "endocrine system": {
    prompt: "Build the Endocrine System.",
    bodyRegion: "torso",
    groups: [
      { label: "Glands", items: ["Pituitary — master gland", "Thyroid — metabolism", "Adrenal — stress response"] },
      { label: "How It Works", items: ["Produces hormones", "Hormones travel through blood", "Regulates growth, mood, metabolism"] },
    ],
    distractors: ["Sends electrical signals", "Pumps blood"],
  },
  "digestive system": {
    prompt: "Build the Digestive System pathway.",
    bodyRegion: "abdomen",
    groups: [
      { label: "Ingestion", items: ["Mouth — chewing and saliva", "Esophagus — moves food to stomach"] },
      { label: "Digestion", items: ["Stomach — breaks down food with acid", "Small intestine — absorbs nutrients"] },
      { label: "Elimination", items: ["Large intestine — absorbs water", "Waste is expelled from body"] },
    ],
    distractors: ["Filters blood", "Produces red blood cells"],
  },
  "respiratory system": {
    prompt: "Build the Respiratory System.",
    bodyRegion: "chest",
    groups: [
      { label: "Upper Airways", items: ["Nose and mouth — air enters", "Pharynx and larynx — air passage"] },
      { label: "Lower Airways", items: ["Trachea — windpipe", "Bronchi — branch into lungs", "Lungs — where gas exchange happens"] },
      { label: "Gas Exchange", items: ["Oxygen enters the blood", "Carbon dioxide is exhaled"] },
    ],
    distractors: ["Pumps blood", "Absorbs nutrients"],
  },
  "excretory system": {
    prompt: "Build the Excretory System.",
    bodyRegion: "abdomen",
    groups: [
      { label: "Organs", items: ["Kidneys — filter blood", "Bladder — stores urine", "Skin — releases sweat"] },
      { label: "Function", items: ["Removes waste products", "Maintains water balance", "Eliminates toxins from the body"] },
    ],
    distractors: ["Produces hormones", "Sends nerve signals"],
  },
  "reproductive system": {
    prompt: "Build the Reproductive System.",
    bodyRegion: "pelvis",
    groups: [
      { label: "Purpose", items: ["Produces offspring", "Creates reproductive cells"] },
      { label: "Female Organs", items: ["Ovaries — produce eggs", "Uterus — where baby develops"] },
      { label: "Male Organs", items: ["Testes — produce sperm"] },
    ],
    distractors: ["Filters blood", "Fights infection"],
  },
};

export function getBuildExercise(termName: string): BuildExercise | null {
  return buildExercises[termName.toLowerCase()] || null;
}
