
-- Create the General Anatomy and Physiology section
INSERT INTO public.sections (id, name, description, color_theme, "order") VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 'General Anatomy and Physiology', 'This is where we explore the body from the inside out. You will learn about cells, tissues, bones, muscles, nerves, and the circulatory system. Understanding how the body works gives you the foundation to care for it with confidence. Take your time with each block. You are building knowledge that will carry you through every part of your career.', 'teal', 2);

-- BLOCK 1: Cells & Cell Structure
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 1, 'Cells',
 'Cells are the basic units of all living things. Every structure in the human body, from skin to bone to muscle, is made up of cells. They carry out the essential functions that keep the body alive and working.',
 'Think of cells as the smallest building blocks of who you are. Just like every great structure starts with a single brick, every system in your body starts with a single cell. You are made of trillions of these tiny workers, each one contributing to something larger than itself. You are built from the ground up, and every small effort you make is part of something bigger.',
 'I am built from purpose. Every small effort I make is part of something meaningful and strong.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 2, 'Cell Membrane',
 'The cell membrane is a thin layer of tissue that surrounds the cell. It protects the interior of the cell from its surroundings and is semipermeable, meaning it allows certain substances to enter the cell while keeping others out.',
 'The cell membrane is your personal filter. It decides what gets in and what stays out. Just like you choose who to let into your space and what energy to absorb, this thin but powerful layer protects the cell while still allowing nourishment through. Boundaries are not walls. They are intelligent filters that keep you healthy.',
 'I set boundaries that protect me while still allowing good things in. My filters are a sign of wisdom, not fear.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 3, 'Nucleus',
 'The nucleus is a specialized structure at the center of the cell. It controls the growth and reproduction of the cell and contains the cell''s genetic material.',
 'The nucleus is the decision maker of the cell. Sitting at the center, it holds the blueprint for everything the cell will become. It controls growth and reproduction, guiding the cell through its entire life. Think of the nucleus as your inner compass, the part of you that knows who you are and directs your growth even when the outside world is noisy.',
 'I trust the wisdom at my center. I carry everything I need to grow and become who I am meant to be.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 4, 'Cytoplasm',
 'Cytoplasm is the watery fluid that surrounds the nucleus. It provides structure for cell parts to move within the cell membrane. Enzymes in the cytoplasm help digest and break down other molecules for food.',
 'Cytoplasm is the environment inside your cell where everything happens. It holds all the working parts in place and provides the space for digestion, movement, and energy. Think of it as the atmosphere you create around yourself. When your environment is healthy and nourishing, everything inside you can function at its best.',
 'I create environments that support my growth. The space I hold for myself matters.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 5, 'Protoplasm',
 'Protoplasm is the substance that makes up a cell. It contains nutrients, mineral salts, and water, all of which are essential for the cell to survive and function.',
 'Protoplasm is the raw material of life. It contains everything the cell needs to survive: nutrients, minerals, and water. Think of it as the foundation you build your days on. When you take care of the basics, hydration, nourishment, rest, everything else has what it needs to thrive. You cannot build something lasting without first caring for the essentials.',
 'I nourish myself with the basics that sustain me. My foundation matters, and I take care of it with intention.');

-- BLOCK 2: Cell Processes & Metabolism
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 1, 'Metabolism',
 'Metabolism is the chemical process by which cells convert nutrients to energy. It includes all the chemical reactions that occur within the cell to maintain life.',
 'Metabolism is the engine inside every cell. It takes what you consume and turns it into the energy you need to move, think, and grow. Think of it as the way you process your experiences. Some things fuel you and some things drain you. When your internal engine is running well, everything feels more manageable.',
 'I convert what I take in into energy and purpose. I am always processing, always growing.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 2, 'Anabolism',
 'Anabolism is the process of simple molecules combining to form a complex molecule. This process requires energy and is responsible for building up larger structures in the body, such as proteins and tissues.',
 'Anabolism is the building phase. Simple pieces come together to create something bigger and stronger. Think of it as the way you take small lessons, small wins, and small moments of study, and combine them into real knowledge. Building requires energy, and every effort you invest is creating something complex and beautiful.',
 'I am in my building phase. Every small effort I invest is becoming something greater than its parts.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 3, 'Catabolism',
 'Catabolism is the process of breaking complex molecules down into simple molecules. This process releases energy that the body uses to perform its functions.',
 'Catabolism is the breaking down phase, and it is just as important as building. When complex things are broken into simpler parts, energy is released. Think of this as the way you break down overwhelming material into manageable pieces. You do not have to understand everything at once. Breaking things down releases the energy you need to keep going.',
 'I give myself permission to break things down. Simplifying is not weakness. It is how I find my energy.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 4, 'Mitosis',
 'Mitosis is the process of cell reproduction that occurs when the cell divides into two identical daughter cells. This is how the body grows, repairs itself, and replaces old or damaged cells.',
 'Mitosis is the cell''s way of saying, "I am going to multiply what I have." One cell becomes two, and each one carries the same complete blueprint. Think of mitosis as duplication through consistency. Every time you review a term, you are creating another copy of that knowledge in your brain. Growth happens through repetition.',
 'I grow through repetition. Every time I review, I am multiplying my strength and knowledge.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 5, 'Tissue',
 'Tissue is a group of similar cells that perform a specific function. The body has four main types of tissue: epithelial, connective, muscle, and nerve.',
 'Tissue is what happens when cells with the same purpose come together. Alone, a single cell can only do so much. But when similar cells unite, they form tissue, and tissue can protect, support, move, and communicate. Think of it as community. When you surround yourself with people who share your goals, you become part of something that is stronger and more capable than any one person alone.',
 'I am stronger in community. When I connect with others who share my purpose, we become something powerful together.');

-- BLOCK 3: Body Tissues & Organs
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 1, 'Epithelial Tissue',
 'Epithelial tissue provides a covering that protects the body and is found within many parts of the body such as skin, mucous membranes, digestive and respiratory organs, the lining of the mouth, the lining of the heart, and the glands.',
 'Epithelial tissue is the body''s first line of defense. It covers and lines every surface, from your skin to the inside of your mouth to the walls of your organs. Think of it as the way you present yourself to the world. Your outer layer is what people see first, and it protects everything underneath. Taking care of your surface is not vanity. It is self-preservation.',
 'I honor the layers that protect me. What I show the world is important, and it deserves care.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 2, 'Connective Tissue',
 'Connective tissue is fibrous tissue that binds and supports other body tissues and organs. It holds structures together and provides a framework for the body.',
 'Connective tissue is the glue that holds everything in place. It binds, supports, and creates structure so that organs and tissues can do their jobs. Think of connective tissue as your daily habits and routines. They may not be glamorous, but they hold your life together. Without them, everything would drift apart.',
 'My daily habits hold me together. I honor the quiet routines that keep my life structured and strong.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 3, 'Muscle Tissue',
 'Muscle tissue contracts and moves various parts of the body. It is responsible for all voluntary and involuntary movement.',
 'Muscle tissue is what makes movement possible. Every step, every heartbeat, every breath involves muscle tissue doing its work. Think of it as your ability to take action. Studying, showing up, trying again after a hard day, all of these are movements that require effort. You are exercising your future every time you choose to keep going.',
 'I am in motion. Every step I take, every choice I make to keep going, is building the life I want.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 4, 'Nerve Tissue',
 'Nerve tissue carries messages to and from the brain and controls and coordinates all bodily functions. It is the communication system of the body.',
 'Nerve tissue is how your body talks to itself. It sends messages from your brain to every part of your body and back again, coordinating everything from breathing to blinking. Think of it as your inner voice, the one that says keep going, pay attention, you know this. When you trust those signals, your whole system works better.',
 'I listen to the signals my body and mind send me. My inner voice is wise, and I trust it.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 5, 'Organs',
 'Organs are groups of specialized tissues designed to perform specific functions. Examples include the heart, lungs, brain, skin, and stomach.',
 'Organs are what happen when different types of tissue come together for a shared purpose. Each organ has a specific job, and it depends on every type of tissue within it to function. Think of organs as your goals. When you bring together your knowledge, your effort, your support system, and your discipline, you create something that works. Each part matters.',
 'I bring all of my strengths together for a shared purpose. Every part of me contributes to my success.');

-- BLOCK 4: Body Systems & Foundations
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 1, 'Anatomy',
 'Anatomy, also called gross anatomy, is the study of human body structures, how the body parts are organized, and the science of the interconnected structure of organisms, or of their parts.',
 'Anatomy is the study of how everything in the body is built and connected. It asks the question: what is this, and where does it belong? Think of anatomy as the blueprint of your body. When you understand the structure, you can make better decisions about how to care for it. Knowledge of structure gives you confidence.',
 'I study the blueprint. Understanding how things are built gives me the confidence to care for them well.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 2, 'Physiology',
 'Physiology is the study of the functions and activities performed by the body''s structures. While anatomy focuses on structure, physiology focuses on what each structure does.',
 'Physiology is the study of function. It answers the question: what does this do, and why does it matter? Think of physiology as purpose. You are not just learning names. You are learning what each part of the body contributes. And when you understand your own purpose, everything you do has more meaning.',
 'I understand my purpose. I am not just learning names. I am learning what everything means and why it matters.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 3, 'Osteology',
 'Osteology is the study of bones. It focuses on the structure, function, and diseases of the skeletal system.',
 'Osteology is the study of your framework. Bones are what hold everything up, and understanding them means understanding the foundation of the human body. Think of it as studying what supports you at the deepest level. When you know your foundation, you can stand tall no matter what life puts on your shoulders.',
 'I know what holds me up. My foundation is strong, and I stand tall because of it.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 4, 'Skeletal System',
 'The skeletal system forms the physical foundation of the body and is composed of 206 bones that vary in size and shape. These bones are connected by movable and immovable joints.',
 'The skeletal system is the framework that makes everything else possible. Without 206 bones working together, you could not stand, sit, move, or protect your vital organs. Think of your skeletal system as the structure of your life: your values, your commitments, your non-negotiables. They hold everything else in place.',
 'I am held up by what I believe in. My values and commitments are the framework of everything I build.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 5, 'Body Systems',
 'Body systems, also known as systems, are groups of organs acting together to perform one or more functions. Examples include the skeletal system, muscular system, nervous system, and circulatory system.',
 'Body systems are what happen when organs work together toward a bigger purpose. No single organ can keep you alive on its own. It takes systems working in coordination to sustain life. Think of body systems as teamwork. Your study plan, your support network, your self-care routine, they all work together to move you toward your goal.',
 'I am part of a system that works. My efforts, my people, and my habits all work together to move me forward.');

-- BLOCK 5: Bones of the Head
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 1, 'Skull',
 'The skull is the skeleton of the head. It is divided into two parts called the cranium and the facial skeleton. The cranium protects the brain, and the facial skeleton forms the framework of the face.',
 'The skull is the ultimate protector. It houses the most important organ in your body, your brain, and gives structure to the face you show the world. Think of the skull as the way you guard your mind. Protecting your thoughts, your peace, and your mental space is just as important as protecting your physical body.',
 'I protect my mind with the same care I give my body. My thoughts and peace deserve to be guarded.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 2, 'Cranium',
 'The cranium is an oval, bony case consisting of eight bones that protect the brain.',
 'The cranium is a fortress made of eight bones, all working together to create a safe space for the brain. Think of it as the way you build safety around the things that matter most. Eight bones, not one, because real protection takes teamwork. Your support system, your boundaries, your routines, they all come together to protect what is most valuable.',
 'I build safety around the things that matter most. Protection is not one wall. It is many pieces working together.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 3, 'Frontal Bone',
 'The frontal bone is the bone that forms the forehead.',
 'The frontal bone is the first thing people see when they look at your face. It forms your forehead, the part of your skull that sits right above your eyes. Think of the frontal bone as the face of your ambition. It is forward-facing, visible, and strong. You lead with what you know, and your confidence is written right across your forehead.',
 'I lead with confidence. What I know is written across my face, and I am not afraid to show it.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 4, 'Parietal Bones',
 'The parietal bones are two bones that form the sides and top of the cranium.',
 'The parietal bones sit on either side of your head, forming the walls and roof of the cranium. They work in a pair, balancing each other. Think of them as the way balance shows up in your life. Two sides, equally strong, holding everything together from above. Balance is not about perfection. It is about showing up on both sides.',
 'I honor both sides of who I am. Balance is not about being perfect. It is about being present everywhere it matters.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 5, 'Occipital Bone',
 'The occipital bone is located below the parietal bones, forming the back of the skull above the nape.',
 'The occipital bone sits at the back of your head, forming the base of the cranium. It protects the part of the brain that processes vision. Think of the occipital bone as the quiet strength behind you. Not everything powerful has to be visible. Sometimes the most important support is the part no one sees, the part that has your back.',
 'I trust the strength behind me. Not everything that holds me up has to be seen to be real.');

-- BLOCK 6: Muscular System
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 1, 'Myology',
 'Myology is the study of the structure, functions, and diseases of the muscular system.',
 'Myology is the study of what moves you. Muscles are responsible for every action your body takes, from lifting your arm to beating your heart. Understanding myology means understanding the mechanics of motion. Think of it as studying what drives you forward. When you understand what moves you, you can use that power with more intention.',
 'I understand what moves me. I use my strength with purpose and intention.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 2, 'Origin',
 'The origin is the part of the muscle that does not move and is anchored to the bone. It is attached closest to the skeleton.',
 'The origin is where the muscle begins. It is the fixed point, the anchor that does not move while the rest of the muscle pulls and contracts. Think of your origin as where you come from: your roots, your values, the things that stay constant no matter how much you stretch. Having a strong anchor allows you to move freely without losing yourself.',
 'I am rooted in where I come from. My anchor gives me the freedom to stretch without losing who I am.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 3, 'Insertion',
 'The insertion is the movable part of the muscle anchored to the bone. It is attached farthest from the skeleton.',
 'The insertion is the part of the muscle that does the moving. While the origin stays fixed, the insertion pulls and creates action. Think of it as your ability to reach for new things. You are anchored by your origin, but your insertion is what allows you to stretch, grow, and move toward your future. You are designed to reach.',
 'I am designed to reach. I stretch toward my future while staying grounded in who I am.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 4, 'Belly',
 'The belly is the middle part of the muscle. It is the thickest and most fleshy portion, located between the origin and the insertion.',
 'The belly of the muscle is where the real work happens. It is the thickest part, sitting between the anchor and the reach. Think of it as the effort in the middle of any journey. Not the starting line, not the finish line, but the work you do between them. That is where your strength lives. The middle is where transformation happens.',
 'I honor the work in the middle. The effort between where I started and where I am going is where my strength lives.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 5, 'Frontalis',
 'The frontalis is the front (anterior) portion of the epicranius. It is a scalp muscle that raises the eyebrows, draws the scalp forward, and causes wrinkles across the forehead.',
 'The frontalis is the muscle of expression. Every time you raise your eyebrows in surprise, curiosity, or recognition, the frontalis is at work. Think of it as your ability to express what you feel and show the world that you are engaged. Your face tells a story, and this muscle helps you write it.',
 'I express myself with confidence. My reactions, my curiosity, and my recognition are all part of my story.');

-- BLOCK 7: Nervous & Circulatory Systems
INSERT INTO public.terms (section_id, block_number, "order", term, definition, metaphor, affirmation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 1, 'Nervous System',
 'The nervous system is a well organized body system composed of the brain, spinal cord, and nerves. It controls and coordinates all other body systems.',
 'The nervous system is your body''s command center. It takes in information, processes it, and sends instructions to every part of you. Think of it as the way you manage your life. You take in what is happening around you, process it, and decide how to respond. When your nervous system is balanced, your whole body follows.',
 'I process what comes my way with clarity. I am the command center of my own life, and I respond with wisdom.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 2, 'Central Nervous System',
 'The central nervous system (CNS) controls voluntary muscle actions and consists of the brain, spinal cord, spinal nerves, and cranial nerves.',
 'The central nervous system is headquarters. It is where decisions are made and directions are sent. The brain thinks, the spinal cord delivers, and the nerves carry the message to exactly where it needs to go. Think of the CNS as your study plan. When your plan is clear and organized, every action you take is intentional and effective.',
 'My plan is clear. I make decisions from a place of organization, and every action I take is intentional.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 3, 'Peripheral Nervous System',
 'The peripheral nervous system (PNS) is a system of nerves connecting the peripheral (outer) parts of the body to the central nervous system. It has both sensory and motor nerves and carries impulses to and from the CNS.',
 'The peripheral nervous system is the messenger network. It connects the outer world to your brain, carrying what you see, hear, touch, and feel back to headquarters for processing. Think of it as feedback. Every experience you have sends a message back to your core. Learning to listen to those messages helps you respond more wisely.',
 'I listen to the messages my experiences send me. My awareness of the world around me makes me wiser and more prepared.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 4, 'Heart',
 'The heart is a muscular, cone-shaped organ that keeps the blood moving within the circulatory system.',
 'The heart is the engine that never stops. It pumps blood to every part of your body, delivering oxygen and nutrients and carrying away waste. Think of the heart as your dedication. It does not take days off. It shows up, beat after beat, keeping everything alive. Your consistency, even when no one is watching, is the heartbeat of your success.',
 'I show up consistently, even when no one is watching. My dedication is the heartbeat of everything I am building.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 5, 'Circulatory System',
 'The circulatory system, also known as the cardiovascular system or vascular system, controls the body''s steady circulation through the heart and blood vessels.',
 'The circulatory system is the delivery network of your body. It carries oxygen, nutrients, and warmth to every cell and removes what is no longer needed. Think of it as the way support flows through your life. The people who encourage you, the resources that feed your growth, the love that keeps you going, all of it circulates through you and sustains you.',
 'I allow support to flow through my life. I receive what nourishes me and release what no longer serves me.');

-- QUESTIONS BLOCK 1
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 'A student asks you to explain the most basic structural unit that makes up all living things. Which term are you describing?', 'Tissue', 'Organs', 'Cells', 'Body systems', 'C', 'Cells are the basic units of all living things. Tissues are groups of cells, organs are groups of tissues, and body systems are groups of organs. Everything starts at the cellular level. You are building your knowledge from the ground up.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 'During a science review, your instructor explains that a thin layer surrounds each cell and decides what enters and what stays out. This layer is semipermeable. Which structure is being described?', 'Nucleus', 'Cytoplasm', 'Cell membrane', 'Protoplasm', 'C', 'The cell membrane is the thin, semipermeable layer that surrounds the cell and controls what enters and exits. The nucleus is at the center. Cytoplasm is the fluid inside. Protoplasm is the overall cell substance. Your ability to filter information is one of your greatest strengths.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 'Which part of the cell controls growth and reproduction and contains the genetic material?', 'Cell membrane', 'Cytoplasm', 'Protoplasm', 'Nucleus', 'D', 'The nucleus is the specialized structure at the center of the cell that controls growth and reproduction. It holds the cell''s genetic material and acts as the cell''s command center. You are learning to identify the decision makers.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 'The watery fluid inside the cell that provides structure and contains enzymes for digestion is called the:', 'Protoplasm', 'Cell membrane', 'Cytoplasm', 'Nucleus', 'C', 'Cytoplasm is the watery fluid that surrounds the nucleus and provides the environment for cell parts to function. Its enzymes help break down molecules. Protoplasm is the total cell substance. Every detail you learn is another piece of your foundation.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 1, 'Which term describes the total substance that makes up a cell, including its nutrients, mineral salts, and water?', 'Cytoplasm', 'Protoplasm', 'Nucleus', 'Cell membrane', 'B', 'Protoplasm is the substance that makes up the entire cell and contains nutrients, mineral salts, and water. Cytoplasm is specifically the fluid around the nucleus. You are learning the differences, and that precision will serve you on exam day.');

-- QUESTIONS BLOCK 2
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 'Cells convert nutrients into energy through a process that includes both building up and breaking down molecules. What is this overall process called?', 'Mitosis', 'Metabolism', 'Anabolism', 'Catabolism', 'B', 'Metabolism is the overall chemical process by which cells convert nutrients to energy. It includes both anabolism (building up) and catabolism (breaking down). Mitosis is cell division. You are connecting the big picture to the details.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 'Which process involves simple molecules combining to form more complex molecules and requires energy to do so?', 'Catabolism', 'Mitosis', 'Anabolism', 'Metabolism', 'C', 'Anabolism is the constructive phase of metabolism where simple molecules combine to build complex structures like proteins and tissues. This process requires energy. Catabolism is the opposite. You are building your knowledge the same way: piece by piece.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 'The process in which complex molecules are broken down into simpler ones, releasing energy, is called:', 'Anabolism', 'Catabolism', 'Mitosis', 'Tissue formation', 'B', 'Catabolism is the phase of metabolism where complex molecules break down into simpler ones, releasing energy. Anabolism is the building phase. Understanding this pair is key for the exam.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 'How does the body grow and repair damaged cells? Through a process where one cell divides into two identical daughter cells. This process is called:', 'Metabolism', 'Catabolism', 'Anabolism', 'Mitosis', 'D', 'Mitosis is the process of cell reproduction where one cell divides into two identical daughter cells. This is how the body grows, heals, and replaces old cells. Your consistency in studying is like mitosis: every review session multiplies your knowledge.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 2, 'A group of similar cells that work together to perform a specific function is called:', 'An organ', 'A body system', 'Tissue', 'Protoplasm', 'C', 'Tissue is a group of similar cells that perform a specific function. Organs are groups of tissues. Body systems are groups of organs. You are learning the hierarchy of the body, and each level builds on the one before it.');

-- QUESTIONS BLOCK 3
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 'Which type of tissue provides a protective covering for the body and is found in the skin, mucous membranes, and the lining of the heart?', 'Connective tissue', 'Muscle tissue', 'Epithelial tissue', 'Nerve tissue', 'C', 'Epithelial tissue provides a covering that protects the body. It lines surfaces inside and outside the body, including the skin, digestive tract, and respiratory organs. You are learning tissue types by function.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 'Which type of tissue binds and supports other body tissues and organs by providing a structural framework?', 'Epithelial tissue', 'Connective tissue', 'Nerve tissue', 'Muscle tissue', 'B', 'Connective tissue is fibrous tissue that binds and supports other body tissues and organs. It provides structure and holds things together. You are recognizing the supporting roles in the body.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 'Which type of tissue is responsible for all movement in the body, both voluntary and involuntary?', 'Nerve tissue', 'Epithelial tissue', 'Connective tissue', 'Muscle tissue', 'D', 'Muscle tissue contracts and moves various parts of the body. It handles both voluntary movements like walking and involuntary movements like your heartbeat. You are strengthening your knowledge with every question.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 'The tissue type that carries messages to and from the brain and coordinates all bodily functions is:', 'Muscle tissue', 'Connective tissue', 'Epithelial tissue', 'Nerve tissue', 'D', 'Nerve tissue carries messages to and from the brain and controls and coordinates all bodily functions. It is the communication network of the body. You are building connections in your own brain with every term you learn.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 3, 'Groups of specialized tissues that come together to perform specific functions are called:', 'Cells', 'Body systems', 'Organs', 'Protoplasm', 'C', 'Organs are groups of specialized tissues designed to perform specific functions. The heart, lungs, and skin are all organs. Body systems are groups of organs working together.');

-- QUESTIONS BLOCK 4
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 'The study of human body structures, how body parts are organized, and the science of interconnected structures is known as:', 'Physiology', 'Osteology', 'Myology', 'Anatomy', 'D', 'Anatomy is the study of human body structures and how they are organized. Physiology studies function. Osteology studies bones. Myology studies muscles.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 'While anatomy focuses on structure, which field focuses on the functions and activities performed by the body''s structures?', 'Anatomy', 'Physiology', 'Osteology', 'Neurology', 'B', 'Physiology is the study of the functions and activities performed by the body''s structures. Anatomy focuses on structure while physiology focuses on function. This pair comes up on the exam.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 'The study of bones, including their structure, function, and diseases, is called:', 'Myology', 'Neurology', 'Osteology', 'Physiology', 'C', 'Osteology is the study of bones. Myology is the study of muscles. Neurology is the study of the nervous system. Physiology is the study of body functions.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 'The physical foundation of the body is composed of 206 bones connected by joints. This system is called the:', 'Muscular system', 'Nervous system', 'Circulatory system', 'Skeletal system', 'D', 'The skeletal system forms the physical foundation of the body and consists of 206 bones connected by movable and immovable joints. You are building your own strong foundation right now.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 4, 'Groups of organs that work together to perform one or more functions are known as:', 'Tissues', 'Cells', 'Body systems', 'Organs', 'C', 'Body systems are groups of organs acting together to perform one or more functions. You are learning the hierarchy: cells, tissues, organs, systems.');

-- QUESTIONS BLOCK 5
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 'The skeleton of the head, which is divided into the cranium and the facial skeleton, is called the:', 'Cranium', 'Frontal bone', 'Skull', 'Mandible', 'C', 'The skull is the skeleton of the head, divided into the cranium (which protects the brain) and the facial skeleton (which forms the face). The cranium is just one part of the skull.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 'An oval, bony case made up of eight bones that protects the brain is the:', 'Skull', 'Facial skeleton', 'Cranium', 'Frontal bone', 'C', 'The cranium is the oval, bony case of eight bones that protects the brain. It is part of the skull. You are getting more precise with each question.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 'Which bone forms the forehead?', 'Parietal bone', 'Occipital bone', 'Temporal bone', 'Frontal bone', 'D', 'The frontal bone forms the forehead. The parietal bones form the sides and top. The occipital bone forms the back.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 'The two bones that form the sides and top of the cranium are the:', 'Frontal bones', 'Occipital bones', 'Parietal bones', 'Temporal bones', 'C', 'The parietal bones are two bones that form the sides and top of the cranium. They work as a pair.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 5, 'Which bone is located below the parietal bones and forms the back of the skull above the nape?', 'Frontal bone', 'Temporal bone', 'Sphenoid bone', 'Occipital bone', 'D', 'The occipital bone is located below the parietal bones, forming the back of the skull above the nape.');

-- QUESTIONS BLOCK 6
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 'The study of the structure, functions, and diseases of the muscular system is called:', 'Osteology', 'Neurology', 'Myology', 'Physiology', 'C', 'Myology is the study of the muscular system. Osteology studies bones. Neurology studies the nervous system. Physiology studies body functions.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 'The fixed, non-moving part of a muscle that is attached closest to the skeleton is called the:', 'Insertion', 'Belly', 'Frontalis', 'Origin', 'D', 'The origin is the part of the muscle that does not move and is anchored closest to the skeleton. The insertion is the movable end. The belly is the middle.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 'Which part of the muscle is the movable attachment that is farthest from the skeleton?', 'Origin', 'Belly', 'Insertion', 'Frontalis', 'C', 'The insertion is the movable part of the muscle attached farthest from the skeleton. When the muscle contracts, the insertion moves toward the origin.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 'The middle, thickest, and most fleshy part of a muscle is called the:', 'Origin', 'Insertion', 'Belly', 'Tendon', 'C', 'The belly is the middle part of the muscle and is the thickest, most fleshy portion. It sits between the origin and the insertion.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 6, 'Which scalp muscle raises the eyebrows, draws the scalp forward, and causes wrinkles across the forehead?', 'Occipitalis', 'Orbicularis oculi', 'Frontalis', 'Temporalis', 'C', 'The frontalis is the front portion of the epicranius that raises the eyebrows and draws the scalp forward, causing forehead wrinkles.');

-- QUESTIONS BLOCK 7
INSERT INTO public.questions (section_id, block_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 'The body system composed of the brain, spinal cord, and nerves that controls and coordinates all other body systems is the:', 'Circulatory system', 'Muscular system', 'Skeletal system', 'Nervous system', 'D', 'The nervous system is composed of the brain, spinal cord, and nerves. It controls and coordinates all other body systems.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 'Which division of the nervous system controls voluntary muscle actions and consists of the brain, spinal cord, and their associated nerves?', 'Peripheral nervous system', 'Autonomic nervous system', 'Central nervous system', 'Sympathetic nervous system', 'C', 'The central nervous system (CNS) controls voluntary muscle actions and consists of the brain, spinal cord, and their associated nerves. The peripheral nervous system connects the outer body to the CNS.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 'The system of nerves that connects the outer parts of the body to the central nervous system and carries both sensory and motor impulses is the:', 'Central nervous system', 'Peripheral nervous system', 'Circulatory system', 'Endocrine system', 'B', 'The peripheral nervous system (PNS) connects the outer parts of the body to the CNS. It carries both sensory (incoming) and motor (outgoing) impulses.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 'Which muscular, cone-shaped organ keeps blood moving throughout the circulatory system?', 'Lungs', 'Brain', 'Heart', 'Spleen', 'C', 'The heart is a muscular, cone-shaped organ that keeps blood moving within the circulatory system. Your consistency is keeping your progress flowing too.'),
('b2c3d4e5-f6a7-8901-bcde-fa2345678901', 7, 'The body system that controls steady circulation of blood through the heart and blood vessels, also known as the cardiovascular or vascular system, is the:', 'Lymphatic system', 'Nervous system', 'Circulatory system', 'Endocrine system', 'C', 'The circulatory system, also known as the cardiovascular or vascular system, controls blood circulation through the heart and blood vessels.');
