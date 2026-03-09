import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Heart, Sparkles, BookOpen, Brain, Target, GraduationCap, Lightbulb } from "lucide-react";

const translations = {
  en: {
    welcome: "Welcome",
    welcomeContent: "Welcome to CosmoPrep powered by the TJ Anderson Layer Method. This platform was designed to help you prepare for your cosmetology state board exam in a way that supports different learning styles. Take your time explore the study blocks and remember that progress happens one concept at a time.",
    whoIAm: "Who I Am",
    whoIAmContent: "My name is Tionna Joy. I am a licensed cosmetologist a trained colorist through the Mario Tricoci program and a salon owner who has served hundreds of clients throughout my career. I also hold a Bachelor of Science in Business with a minor in Accounting and Finance and a Master's degree in Management. My background includes leadership training education and client services. Through my experience working with people I realized that many talented students struggle with standardized testing even though they are capable professionals. That understanding inspired me to create a better way to study.",
    whyCreated: "Why I Created This App",
    whyCreatedContent: "I created this platform because I have always learned differently. Many cosmetology students are hands on learners who thrive in practical environments but struggle when information is presented only through memorization. I wanted to build something that respects the fact that everyone learns differently. In many states the first time pass rate for cosmetology state board exams can range between approximately fifty percent and seventy percent depending on the exam provider and the state requirements. That means many capable students do not pass on their first attempt even though they have the skills to succeed. This app was designed to help students feel supported encouraged and confident while preparing for their exam.",
    howMethodWorks: "How This Method Works",
    howMethodWorksContent: "CosmoPrep uses the TJ Anderson Layer Method which presents information in three layers. Each concept includes a clear definition that explains the science a metaphor that connects the concept to real life meaning and an affirmation that reinforces confidence and emotional support. This layered approach activates multiple learning pathways in the brain making it easier to understand remember and recall information during your exam.",
    howToApproach: "How to Approach State Board Questions",
    howToApproachContent: "State board exams often include multiple choice questions where more than one answer may appear correct. The key strategy is to eliminate the two answers that are clearly incorrect first. Then carefully review the remaining two options and choose the answer that best supports the information in the question. Learning to eliminate incorrect options and identify the strongest answer is one of the most effective strategies for passing standardized exams.",
    whatYouWillLearn: "What You Will Learn Here",
    whatYouWillLearnContent: "This platform begins with Skin Structure and Growth which is one of the foundational subjects in cosmetology education. Additional sections will continue to be added so that the app can eventually support your full state board preparation. As you move through each study block you will see definitions metaphors affirmations and quiz questions designed to strengthen both your knowledge and your confidence.",
    beforeYouBegin: "Before You Begin",
    beforeYouBeginContent: "Take your time while studying and focus on understanding rather than rushing to memorize. Everyone learns differently and this platform was designed with that truth in mind. Every concept you practice here brings you one step closer to becoming a licensed professional. You are capable of passing your state boards and this space is here to support you.",
    startLearning: "Start Learning",
    greeting: "You're going to do great things.",
  },
  es: {
    welcome: "Bienvenida",
    welcomeContent: "Bienvenida a CosmoPrep impulsado por el Método de Capas TJ Anderson. Esta plataforma fue diseñada para ayudarte a prepararte para tu examen estatal de cosmetología de una manera que apoya diferentes estilos de aprendizaje. Tómate tu tiempo explora los bloques de estudio y recuerda que el progreso ocurre un concepto a la vez.",
    whoIAm: "Quién Soy",
    whoIAmContent: "Mi nombre es Tionna Joy. Soy cosmetóloga licenciada, colorista formada a través del programa Mario Tricoci y propietaria de un salón que ha atendido a cientos de clientes a lo largo de mi carrera. También tengo una Licenciatura en Ciencias Empresariales con especialización en Contabilidad y Finanzas y una Maestría en Gestión. Mi experiencia incluye capacitación en liderazgo, educación y servicios al cliente. A través de mi experiencia trabajando con personas me di cuenta de que muchos estudiantes talentosos luchan con los exámenes estandarizados aunque son profesionales capaces. Esa comprensión me inspiró a crear una mejor manera de estudiar.",
    whyCreated: "Por Qué Creé Esta Aplicación",
    whyCreatedContent: "Creé esta plataforma porque siempre he aprendido de manera diferente. Muchos estudiantes de cosmetología aprenden de forma práctica y prosperan en entornos prácticos pero tienen dificultades cuando la información se presenta solo a través de la memorización. Quería construir algo que respete el hecho de que todos aprenden de manera diferente. En muchos estados la tasa de aprobación en el primer intento para los exámenes estatales de cosmetología puede variar entre aproximadamente el cincuenta por ciento y el setenta por ciento dependiendo del proveedor del examen y los requisitos estatales. Eso significa que muchos estudiantes capaces no aprueban en su primer intento aunque tienen las habilidades para tener éxito. Esta aplicación fue diseñada para ayudar a los estudiantes a sentirse apoyados, animados y seguros mientras se preparan para su examen.",
    howMethodWorks: "Cómo Funciona Este Método",
    howMethodWorksContent: "CosmoPrep utiliza el Método de Capas TJ Anderson que presenta la información en tres capas. Cada concepto incluye una definición clara que explica la ciencia, una metáfora que conecta el concepto con el significado de la vida real y una afirmación que refuerza la confianza y el apoyo emocional. Este enfoque en capas activa múltiples vías de aprendizaje en el cerebro facilitando la comprensión, el recuerdo y la recuperación de información durante tu examen.",
    howToApproach: "Cómo Abordar las Preguntas del Examen Estatal",
    howToApproachContent: "Los exámenes estatales a menudo incluyen preguntas de opción múltiple donde más de una respuesta puede parecer correcta. La estrategia clave es eliminar primero las dos respuestas que son claramente incorrectas. Luego revisa cuidadosamente las dos opciones restantes y elige la respuesta que mejor respalde la información de la pregunta. Aprender a eliminar las opciones incorrectas e identificar la respuesta más fuerte es una de las estrategias más efectivas para aprobar exámenes estandarizados.",
    whatYouWillLearn: "Lo Que Aprenderás Aquí",
    whatYouWillLearnContent: "Esta plataforma comienza con Estructura y Crecimiento de la Piel que es una de las materias fundamentales en la educación de cosmetología. Se seguirán agregando secciones adicionales para que la aplicación pueda eventualmente apoyar tu preparación completa para el examen estatal. A medida que avances por cada bloque de estudio verás definiciones, metáforas, afirmaciones y preguntas de quiz diseñadas para fortalecer tanto tu conocimiento como tu confianza.",
    beforeYouBegin: "Antes de Comenzar",
    beforeYouBeginContent: "Tómate tu tiempo mientras estudias y concéntrate en comprender en lugar de apresurarte a memorizar. Todos aprenden de manera diferente y esta plataforma fue diseñada con esa verdad en mente. Cada concepto que practiques aquí te acerca un paso más a convertirte en una profesional licenciada. Eres capaz de aprobar tus exámenes estatales y este espacio está aquí para apoyarte.",
    startLearning: "Comenzar a Aprender",
    greeting: "Vas a lograr grandes cosas.",
  },
  fr: {
    welcome: "Bienvenue",
    welcomeContent: "Bienvenue sur CosmoPrep propulsé par la Méthode des Couches TJ Anderson. Cette plateforme a été conçue pour vous aider à préparer votre examen d'État de cosmétologie d'une manière qui soutient différents styles d'apprentissage. Prenez votre temps explorez les blocs d'étude et rappelez vous que les progrès se font un concept à la fois.",
    whoIAm: "Qui Je Suis",
    whoIAmContent: "Mon nom est Tionna Joy. Je suis cosmetologue licenciée, coloriste formée par le programme Mario Tricoci et propriétaire d'un salon qui a servi des centaines de clients tout au long de ma carrière. Je détiens également un baccalauréat en sciences des affaires avec une mineure en comptabilité et finance et une maîtrise en gestion. Mon expérience comprend la formation en leadership, l'éducation et les services à la clientèle. À travers mon expérience de travail avec les gens j'ai réalisé que de nombreux étudiants talentueux ont du mal avec les tests standardisés même s'ils sont des professionnels compétents. Cette compréhension m'a inspirée à créer une meilleure façon d'étudier.",
    whyCreated: "Pourquoi J'ai Créé Cette Application",
    whyCreatedContent: "J'ai créé cette plateforme parce que j'ai toujours appris différemment. De nombreux étudiants en cosmétologie apprennent de manière pratique et s'épanouissent dans des environnements pratiques mais ont du mal lorsque l'information est présentée uniquement par la mémorisation. Je voulais construire quelque chose qui respecte le fait que tout le monde apprend différemment. Dans de nombreux états le taux de réussite au premier essai pour les examens d'État de cosmétologie peut varier entre environ cinquante pour cent et soixante dix pour cent selon le fournisseur d'examen et les exigences de l'État. Cela signifie que de nombreux étudiants compétents ne réussissent pas à leur première tentative même s'ils ont les compétences pour réussir. Cette application a été conçue pour aider les étudiants à se sentir soutenus, encouragés et confiants tout en se préparant à leur examen.",
    howMethodWorks: "Comment Cette Méthode Fonctionne",
    howMethodWorksContent: "CosmoPrep utilise la Méthode des Couches TJ Anderson qui présente l'information en trois couches. Chaque concept comprend une définition claire qui explique la science, une métaphore qui relie le concept au sens de la vie réelle et une affirmation qui renforce la confiance et le soutien émotionnel. Cette approche en couches active de multiples voies d'apprentissage dans le cerveau, facilitant la compréhension, la mémorisation et le rappel d'informations pendant votre examen.",
    howToApproach: "Comment Aborder les Questions de l'Examen d'État",
    howToApproachContent: "Les examens d'État comprennent souvent des questions à choix multiples où plus d'une réponse peut sembler correcte. La stratégie clé est d'éliminer d'abord les deux réponses qui sont clairement incorrectes. Ensuite examinez attentivement les deux options restantes et choisissez la réponse qui soutient le mieux les informations de la question. Apprendre à éliminer les options incorrectes et à identifier la réponse la plus forte est l'une des stratégies les plus efficaces pour réussir les examens standardisés.",
    whatYouWillLearn: "Ce Que Vous Apprendrez Ici",
    whatYouWillLearnContent: "Cette plateforme commence par la Structure et la Croissance de la Peau qui est l'une des matières fondamentales de l'éducation en cosmétologie. Des sections supplémentaires continueront d'être ajoutées afin que l'application puisse éventuellement soutenir votre préparation complète à l'examen d'État. Au fur et à mesure que vous avancez dans chaque bloc d'étude vous verrez des définitions, des métaphores, des affirmations et des questions de quiz conçues pour renforcer à la fois vos connaissances et votre confiance.",
    beforeYouBegin: "Avant de Commencer",
    beforeYouBeginContent: "Prenez votre temps pendant vos études et concentrez vous sur la compréhension plutôt que de vous précipiter à mémoriser. Tout le monde apprend différemment et cette plateforme a été conçue avec cette vérité à l'esprit. Chaque concept que vous pratiquez ici vous rapproche d'un pas de devenir une professionnelle licenciée. Vous êtes capable de réussir vos examens d'État et cet espace est là pour vous soutenir.",
    startLearning: "Commencer à Apprendre",
    greeting: "Vous allez accomplir de grandes choses.",
  },
};

const sectionIcons = [
  <Heart className="h-5 w-5" />,
  <Sparkles className="h-5 w-5" />,
  <Lightbulb className="h-5 w-5" />,
  <Brain className="h-5 w-5" />,
  <Target className="h-5 w-5" />,
  <BookOpen className="h-5 w-5" />,
  <GraduationCap className="h-5 w-5" />,
];

const sectionColors = [
  { bg: "hsl(346 45% 56%)", light: "hsl(346 40% 94%)", text: "hsl(340 40% 22%)" },
  { bg: "hsl(280 50% 55%)", light: "hsl(280 40% 94%)", text: "hsl(280 40% 22%)" },
  { bg: "hsl(25 70% 55%)", light: "hsl(25 50% 94%)", text: "hsl(25 50% 22%)" },
  { bg: "hsl(195 60% 45%)", light: "hsl(195 40% 94%)", text: "hsl(195 40% 22%)" },
  { bg: "hsl(145 45% 40%)", light: "hsl(145 35% 94%)", text: "hsl(145 35% 22%)" },
  { bg: "hsl(38 65% 50%)", light: "hsl(38 50% 94%)", text: "hsl(38 40% 22%)" },
  { bg: "hsl(320 45% 50%)", light: "hsl(320 35% 94%)", text: "hsl(320 35% 22%)" },
];

const WelcomePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [firstSectionId, setFirstSectionId] = useState<string | null>(null);
  const lang = (profile?.language || "en") as keyof typeof translations;
  const t = translations[lang] || translations.en;

  useEffect(() => {
    supabase.from("sections").select("id").order("order").limit(1).then(({ data }) => {
      if (data && data.length > 0) setFirstSectionId(data[0].id);
    });
  }, []);

  const sections = [
    { key: "welcome", title: t.welcome, content: t.welcomeContent },
    { key: "whoIAm", title: t.whoIAm, content: t.whoIAmContent },
    { key: "whyCreated", title: t.whyCreated, content: t.whyCreatedContent },
    { key: "howMethodWorks", title: t.howMethodWorks, content: t.howMethodWorksContent },
    { key: "howToApproach", title: t.howToApproach, content: t.howToApproachContent },
    { key: "whatYouWillLearn", title: t.whatYouWillLearn, content: t.whatYouWillLearnContent },
    { key: "beforeYouBegin", title: t.beforeYouBegin, content: t.beforeYouBeginContent },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(160deg, hsl(346 45% 96%), hsl(280 30% 96%), hsl(38 40% 96%), hsl(195 30% 96%))",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-7 w-7" style={{ color: "hsl(346 45% 56%)" }} />
            <span className="font-display text-3xl font-bold" style={{ color: "hsl(340 40% 22%)" }}>
              CosmoPrep
            </span>
          </div>
          <h1
            className="font-display text-4xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, hsl(346 45% 56%), hsl(280 50% 55%), hsl(25 70% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t.welcome}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "hsl(340 15% 45%)" }}>
            {t.greeting}
          </p>
        </motion.div>

        {/* Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible defaultValue="welcome" className="space-y-3">
            {sections.map((section, i) => {
              const color = sectionColors[i];
              return (
                <AccordionItem
                  key={section.key}
                  value={section.key}
                  className="border-0 rounded-xl overflow-hidden shadow-md"
                  style={{ background: "white" }}
                >
                  <AccordionTrigger
                    className="px-5 py-4 hover:no-underline gap-3 [&[data-state=open]]:rounded-b-none"
                    style={{ color: color.text }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: color.light, color: color.bg }}
                      >
                        {sectionIcons[i]}
                      </div>
                      <span className="font-display text-lg font-semibold text-left">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <div
                      className="pl-12 text-base leading-relaxed"
                      style={{ color: "hsl(340 15% 35%)" }}
                    >
                      {section.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Start Learning Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 pb-10"
        >
          <Button
            className="w-full py-7 text-lg font-display font-semibold gap-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            style={{
              background: "linear-gradient(135deg, hsl(346 45% 56%), hsl(280 50% 55%))",
              color: "white",
            }}
            onClick={() => {
              if (firstSectionId) {
                navigate(`/section/${firstSectionId}/study/1`);
              } else {
                navigate("/");
              }
            }}
          >
            <BookOpen className="h-5 w-5" />
            {t.startLearning}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;
