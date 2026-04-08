// Section-level and block-level learning objectives keyed by section ID

export const sectionObjectivesMap: Record<string, string[]> = {
  // Skin Structure and Growth
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": [
    "Identify the major layers, structures, and functions of the skin.",
    "Match key skin terms with their correct definitions and roles in skin health.",
    "Use the TJ Anderson Layer Method™: Core Cross Agent™ to build deep understanding through definition, metaphor, affirmation, and reflection.",
    "Answer State Board–style skin questions with confidence.",
  ],
  // General Anatomy and Physiology
  "b2c3d4e5-f6a7-8901-bcde-fa2345678901": [
    "Identify the structures and functions of cells, tissues, organs, and body systems.",
    "Explain key body systems including the skeletal, muscular, nervous, circulatory, and lymphatic systems.",
    "Use the TJ Anderson Layer Method™: Core Cross Agent™ to build deep understanding through definition, metaphor, affirmation, and reflection.",
    "Answer State Board–style anatomy and physiology questions with confidence.",
  ],
  // Infection Control
  "c3d4e5f6-a7b8-9012-cdef-ab3456789012": [
    "Identify the types of microorganisms relevant to cosmetology including bacteria, viruses, fungi, and parasites.",
    "Explain the differences between pathogenic and nonpathogenic bacteria and the three bacterial shapes.",
    "Describe the levels of decontamination from cleaning to sterilization.",
    "Identify bloodborne pathogens and explain universal precautions for salon safety.",
    "Answer State Board–style infection control questions with confidence.",
  ],
};

export const blockObjectivesMap: Record<string, Record<number, string[]>> = {
  // Skin Structure and Growth
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    1: [
      "Explain the structure and function of the epidermis and dermis.",
      "Identify the role of key skin layers in protection and growth.",
      "Answer State Board–style questions about basic skin anatomy.",
    ],
    2: [
      "Recognize the sublayers of the epidermis and their functions.",
      "Match terms like stratum corneum and stratum germinativum with their descriptions.",
      "Apply your knowledge to exam questions about cell renewal.",
    ],
    3: [
      "Identify the components of the dermis including collagen and elastin.",
      "Explain how the dermis supports skin strength and flexibility.",
      "Answer questions about dermal structures in exam scenarios.",
    ],
    4: [
      "Explain what sebaceous glands and sebum do for the skin and hair.",
      "Recognize where these glands are located and how over-cleansing affects them.",
      "Answer State Board–style questions using real-world scenarios about these glands.",
    ],
    5: [
      "Identify the structure and function of sudoriferous (sweat) glands.",
      "Match terms like secretory coil and sweat duct with their correct descriptions.",
      "Apply your knowledge to exam questions about temperature regulation and sweat.",
    ],
    6: [
      "Explain key skin functions including sensation, absorption, and secretion.",
      "Identify how the skin protects against environmental damage.",
      "Answer questions that connect skin functions to everyday scenarios.",
    ],
    7: [
      "Recognize common skin conditions and growth patterns.",
      "Explain factors that affect skin health and regeneration.",
      "Apply your understanding to State Board questions about skin conditions.",
    ],
  },
  // Infection Control
  "c3d4e5f6-a7b8-9012-cdef-ab3456789012": {
    1: [
      "Identify the five major types of microorganisms: bacteria, viruses, fungi, parasites, and pathogens.",
      "Explain how each type of microorganism can spread in a salon environment.",
    ],
    2: [
      "Distinguish between pathogenic and nonpathogenic bacteria.",
      "Identify the three bacterial shapes: cocci, bacilli, and spirilla.",
    ],
    3: [
      "Explain the role of flagella in bacterial movement.",
      "Define infection, contagious disease, inflammation, and pus.",
    ],
    4: [
      "Identify bloodborne pathogens including hepatitis and HIV.",
      "Explain the difference between cleaning and sanitation.",
    ],
    5: [
      "Describe the levels of decontamination: cleaning, sanitation, disinfection, and sterilization.",
      "Explain universal precautions and when to use tuberculocidal disinfectants.",
    ],
    6: [
      "Define exposure incident and explain proper response procedures.",
      "Identify the purpose of Safety Data Sheets and Material Safety Data Sheets.",
    ],
  },
  // General Anatomy and Physiology
  "b2c3d4e5-f6a7-8901-bcde-fa2345678901": {
    1: [
      "Identify the basic structures of a cell including the membrane, nucleus, and cytoplasm.",
      "Explain the role each cell part plays in keeping the cell alive and functioning.",
    ],
    2: [
      "Explain the difference between anabolism and catabolism.",
      "Identify mitosis as the process of cell reproduction and tissue as groups of similar cells.",
    ],
    3: [
      "Identify the four main types of body tissue and their functions.",
      "Explain how tissues combine to form organs.",
    ],
    4: [
      "Explain the difference between anatomy and physiology.",
      "Identify the skeletal system and body systems and how they work together.",
    ],
    5: [
      "Identify the bones of the cranium including the frontal, parietal, and occipital bones.",
      "Explain the difference between the cranium and the facial skeleton.",
    ],
    6: [
      "Explain the three parts of a muscle: origin, insertion, and belly.",
      "Identify the frontalis muscle and its role in facial expression.",
    ],
    7: [
      "Identify the central and peripheral nervous systems and their functions.",
      "Explain the role of the heart and circulatory system in the body.",
    ],
    8: [
      "Identify the temporal, sphenoid, and ethmoid bones and their locations.",
      "Explain the unique characteristics of the hyoid bone and the role of joints.",
    ],
    9: [
      "Identify the 14 bones of the facial skeleton including the mandible and maxillae.",
      "Match facial bones with their locations and functions.",
    ],
    10: [
      "Identify the cervical vertebrae, clavicle, scapula, and humerus.",
      "Explain how the bones of the neck and shoulder support movement.",
    ],
    11: [
      "Identify the radius, ulna, carpus, metacarpus, and phalanges.",
      "Explain how the bones of the arm and hand work together for movement and grip.",
    ],
    12: [
      "Identify the patella, tibia, fibula, talus, and tarsals.",
      "Explain how the bones of the leg and foot support weight and balance.",
    ],
    13: [
      "Identify the integumentary system and its components.",
      "Explain the difference between endocrine and exocrine glands.",
    ],
    14: [
      "Explain the role of hormones in the body.",
      "Identify the epicranius, occipitalis, and epicranial aponeurosis and how they work together.",
    ],
    15: [
      "Identify the corrugator, orbicularis oculi, and procerus muscles.",
      "Explain the functions of the orbicularis oris and levator palpebrae superioris.",
    ],
    16: [
      "Identify muscles of the upper mouth including the levator labii superioris and buccinator.",
      "Explain the functions of the mentalis, levator anguli oris, and depressor labii inferioris.",
    ],
    17: [
      "Identify the risorius, triangularis, zygomaticus major, zygomaticus minor, and masseter.",
      "Explain how facial expression muscles work together for smiling and chewing.",
    ],
    18: [
      "Identify the temporalis, platysma, sternocleidomastoideus, and trapezius.",
      "Explain the role of neck muscles in head movement and posture.",
    ],
    19: [
      "Identify the deltoid, bicep, tricep, pronator, and supinator.",
      "Explain how arm muscles work in pairs to create movement.",
    ],
    20: [
      "Identify extensors, flexors, abductors, adductors, and the opponens.",
      "Explain how muscle groups create opposing movements for balance and control.",
    ],
    21: [
      "Identify muscles of the foot including the abductor hallucis and flexor digitorum brevis.",
      "Explain how foot muscles support balance, walking, and standing.",
    ],
    22: [
      "Identify the gastrocnemius, soleus, peroneus longus, and peroneus brevis.",
      "Explain how calf and lower leg muscles support movement and stability.",
    ],
    23: [
      "Identify the tibialis anterior and its role in walking.",
      "Explain the components of the lymphatic system and their role in immunity.",
    ],
    24: [
      "Identify the brain, spinal cord, and types of nerves in the nervous system.",
      "Explain the difference between motor nerves and sensory nerves.",
    ],
    25: [
      "Identify the autonomic nervous system and explain what a reflex is.",
      "Explain the role of blood and blood vessels in the circulatory system.",
    ],
    26: [
      "Identify arteries, arterioles, capillaries, veins, and venules.",
      "Explain how blood flows through different types of vessels.",
    ],
    27: [
      "Identify the aorta and the carotid arteries that supply the head.",
      "Explain pulmonary circulation and its role in oxygenating blood.",
    ],
    28: [
      "Identify the external and internal jugular veins.",
      "Explain systemic circulation and how it delivers oxygen throughout the body.",
    ],
  },
};
