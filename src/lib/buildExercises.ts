// Build the Body exercises — active recall + chunking + patterning
// Each exercise gives scrambled pieces the student must group correctly

export interface BuildGroup {
  label: string;
  items: string[];
}

export interface BuildExercise {
  prompt: string;
  groups: BuildGroup[];
  distractors?: string[];
}

// Keyed by term name (lowercase) for lookup
export const buildExercises: Record<string, BuildExercise> = {
  // Block 1–2: Cells & Metabolism
  cell: {
    prompt: "Build the parts of a Cell.",
    groups: [
      { label: "Cell Membrane", items: ["Protects the cell", "Controls what enters and exits"] },
      { label: "Nucleus", items: ["Contains DNA", "Controls cell activity"] },
      { label: "Cytoplasm", items: ["Jelly-like fluid", "Holds organelles in place"] },
    ],
    distractors: ["Produces red blood cells", "Sends nerve signals"],
  },
  nucleus: {
    prompt: "Build what the Nucleus does.",
    groups: [
      { label: "Structure", items: ["Dense center of the cell", "Contains chromosomes"] },
      { label: "Function", items: ["Controls cell reproduction", "Directs cell activity", "Stores genetic information"] },
    ],
    distractors: ["Digests food", "Pumps blood"],
  },
  cytoplasm: {
    prompt: "Build the Cytoplasm environment.",
    groups: [
      { label: "What It Is", items: ["Watery jelly-like substance", "Found between nucleus and cell membrane"] },
      { label: "What It Does", items: ["Holds organelles", "Site of chemical reactions", "Provides structure to the cell"] },
    ],
    distractors: ["Contracts muscles", "Filters blood"],
  },
  "cell membrane": {
    prompt: "Build the Cell Membrane's roles.",
    groups: [
      { label: "Protection", items: ["Surrounds the entire cell", "Acts as a barrier"] },
      { label: "Transport", items: ["Controls what enters the cell", "Controls what exits the cell", "Selectively permeable"] },
    ],
    distractors: ["Produces energy", "Stores fat"],
  },
  metabolism: {
    prompt: "Build the two phases of Metabolism.",
    groups: [
      { label: "Anabolism", items: ["Building up", "Stores energy", "Constructs complex molecules"] },
      { label: "Catabolism", items: ["Breaking down", "Releases energy", "Breaks complex molecules into simple ones"] },
    ],
    distractors: ["Nerve transmission", "Blood clotting"],
  },
  anabolism: {
    prompt: "Build the Anabolism process.",
    groups: [
      { label: "What Happens", items: ["Small molecules combine", "Complex substances are built", "Energy is stored"] },
      { label: "Examples", items: ["Building muscle tissue", "Growing new cells", "Repairing damaged skin"] },
    ],
    distractors: ["Digesting food", "Breaking down fat"],
  },
  catabolism: {
    prompt: "Build the Catabolism process.",
    groups: [
      { label: "What Happens", items: ["Complex molecules break apart", "Energy is released", "Substances become simpler"] },
      { label: "Examples", items: ["Digesting food into nutrients", "Breaking down glucose for energy"] },
    ],
    distractors: ["Building bone", "Growing hair"],
  },
  mitosis: {
    prompt: "Build the stages of Mitosis.",
    groups: [
      { label: "Step 1: Prepare", items: ["Cell grows", "DNA duplicates"] },
      { label: "Step 2: Divide", items: ["Chromosomes line up", "Cell splits in two"] },
      { label: "Result", items: ["Two identical daughter cells", "Each has same DNA as parent"] },
    ],
    distractors: ["Three cells form", "DNA is destroyed"],
  },

  // Block 3–4: Tissues, Organs, Systems
  "epithelial tissue": {
    prompt: "Build Epithelial Tissue.",
    groups: [
      { label: "Where It Is", items: ["Skin surface", "Lining of organs", "Body cavities"] },
      { label: "What It Does", items: ["Protects underlying tissue", "Absorbs nutrients", "Secretes substances"] },
    ],
    distractors: ["Contracts to create movement", "Transmits electrical impulses"],
  },
  "connective tissue": {
    prompt: "Build Connective Tissue types.",
    groups: [
      { label: "Supportive", items: ["Bone", "Cartilage"] },
      { label: "Fluid", items: ["Blood", "Lymph"] },
      { label: "Binding", items: ["Tendons", "Ligaments", "Fascia"] },
    ],
    distractors: ["Neurons", "Skin cells"],
  },
  "muscle tissue": {
    prompt: "Build the 3 types of Muscle Tissue.",
    groups: [
      { label: "Skeletal", items: ["Attached to bones", "Voluntary movement", "Striated appearance"] },
      { label: "Cardiac", items: ["Found in the heart", "Involuntary", "Pumps blood"] },
      { label: "Smooth", items: ["Found in organs", "Involuntary", "Walls of blood vessels"] },
    ],
    distractors: ["Found in the brain", "Produces hormones"],
  },
  "nerve tissue": {
    prompt: "Build how Nerve Tissue works.",
    groups: [
      { label: "Structure", items: ["Neurons (nerve cells)", "Found in brain and spinal cord"] },
      { label: "Function", items: ["Transmits electrical signals", "Coordinates body responses", "Processes sensory information"] },
    ],
    distractors: ["Produces blood cells", "Stores fat"],
  },
  organ: {
    prompt: "Build the levels of body organization.",
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
    groups: [
      { label: "Movement & Support", items: ["Skeletal system", "Muscular system"] },
      { label: "Control & Communication", items: ["Nervous system", "Endocrine system"] },
      { label: "Transport & Defense", items: ["Circulatory system", "Lymphatic system"] },
    ],
    distractors: ["Solar system", "Sound system"],
  },

  // Block 5+: Skeletal System
  "frontal bone": {
    prompt: "Build the bones of the Cranium (front).",
    groups: [
      { label: "Frontal Bone", items: ["Forms the forehead", "Located above the eyes"] },
      { label: "Parietal Bones", items: ["Form the top and sides of the head", "Come in a pair"] },
      { label: "Temporal Bones", items: ["Located at the sides/temples", "Contain ear openings"] },
    ],
    distractors: ["Forms the jaw", "Located in the neck"],
  },
  "occipital bone": {
    prompt: "Build the bones of the Cranium (back & base).",
    groups: [
      { label: "Occipital Bone", items: ["Back of the skull", "Contains foramen magnum"] },
      { label: "Sphenoid Bone", items: ["Bat-shaped", "Joins all cranial bones together"] },
      { label: "Ethmoid Bone", items: ["Between the eye sockets", "Forms part of the nasal cavity"] },
    ],
    distractors: ["Forms the chin", "Located in the chest"],
  },
  "nasal bones": {
    prompt: "Build the bones of the Face.",
    groups: [
      { label: "Upper Face", items: ["Nasal bones — bridge of nose", "Lacrimal bones — inner eye corners", "Zygomatic bones — cheekbones"] },
      { label: "Lower Face", items: ["Mandible — lower jawbone", "Maxillae — upper jawbones"] },
    ],
    distractors: ["Femur — thigh bone", "Scapula — shoulder blade"],
  },
  mandible: {
    prompt: "Build the Mandible (lower jaw).",
    groups: [
      { label: "What It Is", items: ["Largest bone of the face", "Only movable bone of the skull"] },
      { label: "What It Does", items: ["Opens and closes the mouth", "Chewing and speaking"] },
    ],
    distractors: ["Protects the brain", "Supports the spine"],
  },
  "hyoid bone": {
    prompt: "Build the Hyoid Bone.",
    groups: [
      { label: "Location", items: ["In the throat", "Below the mandible", "Above the larynx"] },
      { label: "Unique Feature", items: ["Only bone not connected to another bone", "Supported by muscles and ligaments"] },
      { label: "Function", items: ["Supports the tongue", "Aids in swallowing"] },
    ],
    distractors: ["Connected to the spine", "Part of the rib cage"],
  },
  cervical: {
    prompt: "Build the regions of the Spine.",
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
    groups: [
      { label: "Origin", items: ["Fixed attachment point", "Does not move during contraction", "Attached to stationary bone"] },
      { label: "Insertion", items: ["Movable attachment point", "Moves during contraction", "Attached to bone that moves"] },
      { label: "Belly", items: ["Middle/fleshy part", "Where contraction happens", "Thickest section of the muscle"] },
    ],
    distractors: ["Carries blood", "Stores memories"],
  },
  "frontalis muscle": {
    prompt: "Build the muscles of the Scalp & Forehead.",
    groups: [
      { label: "Frontalis", items: ["Front of the forehead", "Raises eyebrows", "Creates forehead wrinkles"] },
      { label: "Occipitalis", items: ["Back of the skull", "Draws scalp backward"] },
      { label: "Epicranius (Occipitofrontalis)", items: ["Covers the top of the skull", "Combination of frontalis + occipitalis"] },
    ],
    distractors: ["Moves the jaw", "Opens the mouth"],
  },
  orbicularis: {
    prompt: "Build the Ring Muscles of the face.",
    groups: [
      { label: "Orbicularis Oculi", items: ["Surrounds the eye", "Closes the eyelid", "Causes squinting and blinking"] },
      { label: "Orbicularis Oris", items: ["Surrounds the mouth", "Closes and puckers the lips", "Used in kissing and whistling"] },
    ],
    distractors: ["Lifts the eyebrow", "Moves the ear"],
  },
  masseter: {
    prompt: "Build the Chewing Muscles.",
    groups: [
      { label: "Masseter", items: ["Jaw muscle", "Closes the jaw", "Strongest muscle for chewing"] },
      { label: "Temporalis", items: ["Temple area", "Assists in closing the jaw", "Works with the masseter"] },
    ],
    distractors: ["Opens the mouth wide", "Raises eyebrows"],
  },
  "sternocleidomastoid": {
    prompt: "Build the major Neck Muscles.",
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
    groups: [
      { label: "Central Nervous System (CNS)", items: ["Brain", "Spinal cord", "Processes and interprets signals"] },
      { label: "Peripheral Nervous System (PNS)", items: ["Nerves throughout the body", "Sensory input", "Motor output"] },
    ],
    distractors: ["Heart", "Liver", "Kidneys"],
  },
  brain: {
    prompt: "Build the parts of the Brain.",
    groups: [
      { label: "Cerebrum", items: ["Largest part", "Thinking and reasoning", "Memory and speech"] },
      { label: "Cerebellum", items: ["Back of the brain", "Balance and coordination", "Smooth movements"] },
      { label: "Brain Stem", items: ["Connects brain to spinal cord", "Controls breathing and heartbeat", "Automatic survival functions"] },
    ],
    distractors: ["Produces hormones", "Filters toxins"],
  },
  neuron: {
    prompt: "Build the parts of a Neuron.",
    groups: [
      { label: "Dendrites", items: ["Branch-like extensions", "Receive incoming signals"] },
      { label: "Cell Body", items: ["Contains the nucleus", "Processes information"] },
      { label: "Axon", items: ["Long tail-like fiber", "Sends signals away from cell body", "Covered by myelin sheath"] },
    ],
    distractors: ["Stores blood", "Produces bile"],
  },
  "sensory nerves": {
    prompt: "Build the types of Nerves.",
    groups: [
      { label: "Sensory Nerves", items: ["Carry signals TO the brain", "Detect touch, pain, temperature", "Also called afferent nerves"] },
      { label: "Motor Nerves", items: ["Carry signals FROM the brain", "Control muscle movement", "Also called efferent nerves"] },
    ],
    distractors: ["Produce hormones", "Filter waste"],
  },
  reflex: {
    prompt: "Build the Reflex Arc.",
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
    groups: [
      { label: "The Pump", items: ["Heart — pumps blood throughout the body"] },
      { label: "The Highways", items: ["Arteries — carry blood away from heart", "Veins — carry blood back to heart", "Capillaries — tiny vessels for exchange"] },
      { label: "The Fluid", items: ["Blood — carries oxygen and nutrients", "Plasma, red cells, white cells, platelets"] },
    ],
    distractors: ["Lymph nodes", "Spinal fluid"],
  },
  heart: {
    prompt: "Build the Heart's chambers and flow.",
    groups: [
      { label: "Right Side (Deoxygenated)", items: ["Right atrium receives blood from body", "Right ventricle pumps blood to lungs"] },
      { label: "Left Side (Oxygenated)", items: ["Left atrium receives blood from lungs", "Left ventricle pumps blood to body"] },
    ],
    distractors: ["Blood enters through the spleen", "Oxygen is added in the stomach"],
  },
  arteries: {
    prompt: "Build the Blood Vessel types.",
    groups: [
      { label: "Arteries", items: ["Carry blood AWAY from heart", "Thick muscular walls", "Carry oxygenated blood (mostly)"] },
      { label: "Veins", items: ["Carry blood BACK to heart", "Thinner walls with valves", "Carry deoxygenated blood (mostly)"] },
      { label: "Capillaries", items: ["Smallest blood vessels", "One cell thick", "Where oxygen/nutrient exchange occurs"] },
    ],
    distractors: ["Carry lymph fluid", "Connect bones to muscles"],
  },
  "white blood cells": {
    prompt: "Build the components of Blood.",
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
    groups: [
      { label: "Structures", items: ["Lymph nodes", "Lymph vessels", "Spleen", "Thymus"] },
      { label: "Functions", items: ["Filters waste and toxins", "Fights infection", "Returns fluid to bloodstream", "Produces white blood cells"] },
    ],
    distractors: ["Pumps blood", "Digests food", "Controls body temperature"],
  },
  "lymph nodes": {
    prompt: "Build what Lymph Nodes do.",
    groups: [
      { label: "What They Are", items: ["Small bean-shaped organs", "Located along lymph vessels", "Found in neck, armpits, groin"] },
      { label: "What They Do", items: ["Filter harmful substances", "Trap bacteria and viruses", "Produce immune cells"] },
    ],
    distractors: ["Pump blood", "Store oxygen"],
  },

  // Additional key terms
  "integumentary system": {
    prompt: "Build the Integumentary System.",
    groups: [
      { label: "Structures", items: ["Skin", "Hair", "Nails", "Sweat glands", "Oil glands"] },
      { label: "Functions", items: ["Protects the body", "Regulates temperature", "Provides sensation", "Eliminates waste through sweat"] },
    ],
    distractors: ["Produces hormones", "Digests nutrients"],
  },
  "endocrine system": {
    prompt: "Build the Endocrine System.",
    groups: [
      { label: "Glands", items: ["Pituitary — master gland", "Thyroid — metabolism", "Adrenal — stress response"] },
      { label: "How It Works", items: ["Produces hormones", "Hormones travel through blood", "Regulates growth, mood, metabolism"] },
    ],
    distractors: ["Sends electrical signals", "Pumps blood"],
  },
  "digestive system": {
    prompt: "Build the Digestive System pathway.",
    groups: [
      { label: "Ingestion", items: ["Mouth — chewing and saliva", "Esophagus — moves food to stomach"] },
      { label: "Digestion", items: ["Stomach — breaks down food with acid", "Small intestine — absorbs nutrients"] },
      { label: "Elimination", items: ["Large intestine — absorbs water", "Waste is expelled from body"] },
    ],
    distractors: ["Filters blood", "Produces red blood cells"],
  },
  "respiratory system": {
    prompt: "Build the Respiratory System.",
    groups: [
      { label: "Upper Airways", items: ["Nose and mouth — air enters", "Pharynx and larynx — air passage"] },
      { label: "Lower Airways", items: ["Trachea — windpipe", "Bronchi — branch into lungs", "Lungs — where gas exchange happens"] },
      { label: "Gas Exchange", items: ["Oxygen enters the blood", "Carbon dioxide is exhaled"] },
    ],
    distractors: ["Pumps blood", "Absorbs nutrients"],
  },
  "excretory system": {
    prompt: "Build the Excretory System.",
    groups: [
      { label: "Organs", items: ["Kidneys — filter blood", "Bladder — stores urine", "Skin — releases sweat"] },
      { label: "Function", items: ["Removes waste products", "Maintains water balance", "Eliminates toxins from the body"] },
    ],
    distractors: ["Produces hormones", "Sends nerve signals"],
  },
  "reproductive system": {
    prompt: "Build the Reproductive System.",
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
