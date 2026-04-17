import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchTTSWithFallback } from "@/lib/browserTTS";
import { useAutoNarrate, stopGlobalNarration } from "@/hooks/useAutoNarrate";
import { useAuth } from "@/hooks/useAuth";
import { useTJTone } from "@/hooks/useTJTone";
import { useDNAAdaptation } from "@/hooks/useDNAAdaptation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReadAlongText from "@/components/ReadAlongText";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Play, Pause, RotateCcw, Sparkles, TrendingUp,
  Eye, Mic, PenLine, Zap, ChevronDown, ChevronRight, ArrowRight, CheckCircle2,
  BookOpen, Target, Lightbulb, ListOrdered, AlertTriangle,
  Shield, HeartPulse, RefreshCw, Compass, BarChart3, Layers, Dna, Wand2, ArrowDown,
} from "lucide-react";
import { TJ_TONES, type TJToneMode } from "@/lib/tjTone";
import SpeakButton from "@/components/SpeakButton";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

/* ── Tutorial steps ── */
const TUTORIAL_STEPS = [
  {
    title: "What Is TJ DNA?",
    icon: Brain,
    color: "hsl(265 60% 50%)",
    content: "Your TJ DNA is a 4-character code that captures how your brain learns. It's not a label — it's a living blueprint that evolves as you grow. TJ reads your DNA before every lesson and adjusts everything to match how YOU think.",
  },
  {
    title: "How Your Learning Pattern Works",
    icon: Layers,
    color: "hsl(215 70% 50%)",
    content: "Your brain has a preferred entry point — visual, analytical, metaphorical, or experiential. TJ detects this and leads every lesson with your strongest layer first, so concepts click faster. Your engagement level tells TJ how much content to give you at once.",
  },
  {
    title: "What Interrupts Understanding",
    icon: AlertTriangle,
    color: "hsl(25 70% 50%)",
    content: "Learning blockers are real — low confidence makes you second-guess yourself, low retention means concepts fade too quickly, and low engagement means content isn't connecting. TJ tracks all three and adjusts in real-time.",
  },
  {
    title: "How To Recover When Stuck",
    icon: RefreshCw,
    color: "hsl(145 55% 40%)",
    content: "When you hit a wall, TJ activates your recovery plan: shorter content blocks, more encouragement, extra memory cues, and your strongest learning layer first. You don't have to figure it out alone — the system adapts to pull you through.",
  },
  {
    title: "How TJ Uses Your DNA",
    icon: Compass,
    color: "hsl(320 55% 48%)",
    content: "Every lesson is personalized: the order of steps, the tone of voice, the difficulty of questions, and even how much encouragement you get. Your DNA isn't just a profile — it's the engine behind every interaction in this app.",
  },
];

/* ── Style mapping ── */
const STYLE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  V: { label: "Visual", icon: Eye, color: "hsl(215 80% 50%)" },
  D: { label: "Analytical", icon: Zap, color: "hsl(275 60% 55%)" },
  M: { label: "Metaphorical", icon: Sparkles, color: "hsl(42 80% 50%)" },
  I: { label: "Informational", icon: Brain, color: "hsl(160 50% 40%)" },
  R: { label: "Reflective", icon: PenLine, color: "hsl(0 60% 50%)" },
  A: { label: "Applied", icon: Zap, color: "hsl(25 70% 50%)" },
  K: { label: "Kinesthetic", icon: PenLine, color: "hsl(145 60% 35%)" },
  B: { label: "Breakdown", icon: BookOpen, color: "hsl(185 55% 42%)" },
  N: { label: "Recognition", icon: Eye, color: "hsl(275 70% 50%)" },
};

/* ── DNA Character Explanations ── */
const DNA_CHAR_INFO: Record<number, {
  label: string; icon: any; color: string;
  getDescription: (c: string) => string;
  getWhatTJChanges: (c: string) => string;
  getWhatYouNotice: (c: string) => string;
}> = {
  0: {
    label: "Layer Strength", icon: Brain, color: "hsl(265 60% 50%)",
    getDescription: (char) => { const n = STYLE_MAP[char.toUpperCase()]?.label || "Unknown"; return `Your strongest learning layer is "${n}". Your brain responds best when content starts with ${n.toLowerCase()} approaches.`; },
    getWhatTJChanges: (char) => { const n = STYLE_MAP[char.toUpperCase()]?.label || "visual"; return `TJ reorders every lesson so your strongest layer (${n}) comes right after the opening — putting you in your comfort zone early.`; },
    getWhatYouNotice: () => `You'll notice your preferred learning style appears early in each block, making concepts click faster.`,
  },
  1: {
    label: "Engagement", icon: Zap, color: "hsl(42 70% 50%)",
    getDescription: (char) => { const l = parseInt(char) || 5; return l <= 3 ? `Your engagement is ${l}/9 — building. TJ keeps content short and interactive.` : l <= 6 ? `Your engagement is ${l}/9 — developing. TJ gives you a balanced mix.` : `Your engagement is ${l}/9 — strong! TJ pushes deeper content your way.`; },
    getWhatTJChanges: (char) => { const l = parseInt(char) || 5; return l <= 3 ? "Shorter content blocks, more interactive elements, frequent check-ins." : l <= 6 ? "Balanced reading and interactive content with periodic engagement hooks." : "Deeper content blocks, fewer interruptions, more challenging material."; },
    getWhatYouNotice: (char) => { const l = parseInt(char) || 5; return l <= 3 ? "Lessons feel bite-sized and interactive so you stay locked in." : l <= 6 ? "A comfortable pace that mixes reading with doing." : "More depth and freedom to explore without frequent interruptions."; },
  },
  2: {
    label: "Retention", icon: Target, color: "hsl(145 55% 40%)",
    getDescription: (char) => { const c = char.toUpperCase().charCodeAt(0) - 65; return c < 8 ? "Your retention is building (A-H range). TJ adds extra memory cues and repetition." : c < 17 ? "Your retention is developing (I-Q range). TJ provides periodic reviews and memory anchors." : "Your retention is strong (R-Z range)! You hold onto information well."; },
    getWhatTJChanges: (char) => { const c = char.toUpperCase().charCodeAt(0) - 65; return c < 8 ? "Extra memory cues, highlighted key points, more repetition and summaries." : c < 17 ? "Periodic memory anchors and spaced review prompts." : "Less repetition, deeper dives, and faster progression through content."; },
    getWhatYouNotice: (char) => { const c = char.toUpperCase().charCodeAt(0) - 65; return c < 8 ? "You'll see key points highlighted more often and get more review opportunities." : c < 17 ? "Balanced review moments woven into your learning flow." : "TJ trusts your memory and moves efficiently through material."; },
  },
  3: {
    label: "Confidence", icon: Sparkles, color: "hsl(215 70% 50%)",
    getDescription: (char) => { const c = char.toLowerCase().charCodeAt(0) - 97; return c < 8 ? "Your confidence is growing (a-h range). TJ uses a supportive tone with smaller steps." : c < 17 ? "Your confidence is developing (i-q range). TJ balances challenge with support." : "Your confidence is high (r-z range)! TJ challenges you with harder material."; },
    getWhatTJChanges: (char) => { const c = char.toLowerCase().charCodeAt(0) - 97; return c < 8 ? "Gentler language, more encouragement, smaller learning increments." : c < 17 ? "A balanced approach — supportive but with room to stretch." : "More challenging questions, less hand-holding, higher expectations."; },
    getWhatYouNotice: (char) => { const c = char.toLowerCase().charCodeAt(0) - 97; return c < 8 ? "TJ feels like a patient mentor — never rushing, always encouraging." : c < 17 ? "TJ pushes you gently while still cheering you on." : "TJ treats you like you're ready — higher-level questions and deeper dives."; },
  },
};

const LEGEND_ITEMS = [
  { segment: "L", label: "Layer Strength", format: "Letter (V, D, M…)", example: "V = Visual learner" },
  { segment: "E", label: "Engagement", format: "Number 0–9", example: "7 = highly engaged" },
  { segment: "R", label: "Retention", format: "Uppercase A–Z", example: "A–H = building, I–Q = developing, R–Z = strong" },
  { segment: "C", label: "Confidence", format: "Lowercase a–z", example: "a–h = growing, i–q = developing, r–z = high" },
];

/* ── Interactive Learning Styles (clickable tabs) ── */
const LEARNING_STYLES_INFO = [
  { id: "V", label: "Visual", icon: Eye, color: "hsl(215 80% 50%)",
    definition: "You learn best by seeing. Diagrams, colors, charts, and imagery anchor concepts in your memory faster than plain text.",
    tjAction: "TJ leads every lesson with a visual — an image, diagram, or color-coded breakdown — before introducing the words." },
  { id: "M", label: "Metaphorical", icon: Sparkles, color: "hsl(42 80% 50%)",
    definition: "You learn best through stories and comparisons. When a new idea is tied to something familiar, it sticks.",
    tjAction: "TJ opens lessons with a story or metaphor — connecting unfamiliar terms to everyday situations you already know." },
  { id: "R", label: "Reflective", icon: PenLine, color: "hsl(0 60% 50%)",
    definition: "You learn best by pausing to think. Journaling, summarizing, and asking 'what does this mean to me?' lock concepts in.",
    tjAction: "TJ adds reflection prompts and journaling moments after key ideas, giving you space to process before moving on." },
  { id: "D", label: "Analytical", icon: Zap, color: "hsl(275 60% 55%)",
    definition: "You learn best by breaking things apart. Definitions, structure, logic, and step-by-step reasoning bring you clarity.",
    tjAction: "TJ structures content into clean steps, comparisons, and logical sequences — no fluff, just clear breakdowns." },
  { id: "I", label: "Informational", icon: Brain, color: "hsl(160 50% 40%)",
    definition: "You learn best with detailed reading. Facts, context, and the 'why' behind every concept satisfy your brain.",
    tjAction: "TJ gives you deeper context, background details, and the full 'why' so you understand the bigger picture." },
  { id: "A", label: "Applied", icon: Target, color: "hsl(25 70% 50%)",
    definition: "You learn best by doing. Practice problems, real-world scenarios, and hands-on examples make ideas real.",
    tjAction: "TJ adds practice scenarios and 'try this now' moments so you apply each idea immediately after learning it." },
];

/* ── Interactive DNA Segments (clickable tabs) ── */
const DNA_SEGMENTS_INFO = [
  { id: "L", label: "Layer Strength", icon: Layers, color: "hsl(265 60% 50%)",
    definition: "The first letter of your code. It shows which learning approach unlocks your brain fastest — Visual, Analytical, Metaphorical, Reflective, Informational, or Applied.",
    tjAction: "TJ leads every lesson with this layer first, putting you in your comfort zone right away so concepts click faster." },
  { id: "E", label: "Engagement", icon: Zap, color: "hsl(42 70% 50%)",
    definition: "The number 0–9 in your code. It measures how much content you can take in at once. Lower = shorter blocks. Higher = deeper dives.",
    tjAction: "TJ adjusts content length, interactive checkpoints, and pacing to match your engagement level — never too much, never too little." },
  { id: "R", label: "Retention", icon: Target, color: "hsl(145 55% 40%)",
    definition: "The uppercase letter A–Z. It tracks how well concepts stick. A–H = building, I–Q = developing, R–Z = strong recall.",
    tjAction: "TJ adds extra memory cues, mnemonics, and spaced reviews when retention is building — and skips repetition when it's strong." },
  { id: "C", label: "Confidence", icon: Shield, color: "hsl(215 70% 50%)",
    definition: "The lowercase letter a–z. It tracks how sure you feel. Lower = more encouragement and smaller steps. Higher = harder challenges.",
    tjAction: "TJ softens the tone and shrinks steps when confidence is low — and ramps up the difficulty when it's high." },
];

/* ── Ordered DNA Section list (for guided flow) ── */
const DNA_SECTION_ORDER = [
  { id: "brain",       title: "How My Brain Learns" },
  { id: "stops",       title: "What Stops Me From Learning" },
  { id: "combat",      title: "How To Combat It" },
  { id: "recovery",    title: "My Learning Recovery Plan" },
  { id: "progression", title: "My Progression" },
  { id: "tj-uses",     title: "How TJ Uses My DNA" },
  { id: "type",        title: "My DNA Type" },
  { id: "best",        title: "How I Learn Best" },
  { id: "throws",      title: "What Throws Me Off" },
  { id: "next",        title: "TJ Recommends Next" },
  { id: "order",       title: "Best Study Order for Me" },
  { id: "tone",        title: "TJ's Teaching Style" },
] as const;
type DNASectionId = (typeof DNA_SECTION_ORDER)[number]["id"];

const VIEWED_KEY = "tj-dna-viewed-sections";

/* ── Collapsible Section Card with guided next-step ── */
const SectionCard = ({
  id, icon: Icon, iconColor, title, delay = 0, children,
  openSection, setOpenSection, viewedSections, markViewed,
}: {
  id: DNASectionId;
  icon: any; iconColor: string; title: string; delay?: number; children: React.ReactNode;
  openSection: string | undefined;
  setOpenSection: (v: string | undefined) => void;
  viewedSections: Set<string>;
  markViewed: (id: string) => void;
}) => {
  const isOpen = openSection === id;
  const isViewed = viewedSections.has(id);
  const orderIdx = DNA_SECTION_ORDER.findIndex((s) => s.id === id);
  const next = DNA_SECTION_ORDER[orderIdx + 1];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} id={`dna-section-${id}`}>
      <Card className="border-0 shadow-md bg-card overflow-hidden">
        <Accordion
          type="single"
          collapsible
          value={isOpen ? id : ""}
          onValueChange={(v) => {
            const newVal = v || undefined;
            setOpenSection(newVal);
            if (newVal === id) markViewed(id);
          }}
        >
          <AccordionItem value={id} className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline group">
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Section {orderIdx + 1} of {DNA_SECTION_ORDER.length}
                  </p>
                  <h3 className="font-display text-base font-semibold text-foreground truncate">{title}</h3>
                </div>
                {isViewed && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-6 pt-0 space-y-4">
                {children}
                {next && (
                  <div className="pt-3 border-t flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Up next: <span className="font-medium text-foreground">{next.title}</span></p>
                    <button
                      onClick={() => {
                        markViewed(id);
                        setOpenSection(next.id);
                        setTimeout(() => {
                          document.getElementById(`dna-section-${next.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 120);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                      style={{ background: iconColor, color: "white" }}
                    >
                      Continue <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </motion.div>
  );
};

const LearningDNAPage = () => {
  const { profile, user } = useAuth();
  const { tone, toneProfile } = useTJTone();
  const { rules, dna } = useDNAAdaptation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [expandedChar, setExpandedChar] = useState<number | null>(null);
  const [selectedTone, setSelectedTone] = useState<TJToneMode>(tone);
  const [showLegend, setShowLegend] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Guided section navigation
  const [openSection, setOpenSection] = useState<string | undefined>(DNA_SECTION_ORDER[0].id);
  const [viewedSections, setViewedSections] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(VIEWED_KEY);
      return new Set(raw ? JSON.parse(raw) : [DNA_SECTION_ORDER[0].id]);
    } catch { return new Set([DNA_SECTION_ORDER[0].id]); }
  });
  const markViewed = useCallback((id: string) => {
    setViewedSections((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id);
      try { localStorage.setItem(VIEWED_KEY, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }, []);
  const sharedSectionProps = { openSection, setOpenSection, viewedSections, markViewed };
  const viewedCount = viewedSections.size;
  const totalSections = DNA_SECTION_ORDER.length;
  const guideProgress = Math.round((viewedCount / totalSections) * 100);

  // Metrics
  const [metrics, setMetrics] = useState<any[]>([]);
  const [earliestMetrics, setEarliestMetrics] = useState<{ retention: number; confidence: number } | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<{ retention: number; confidence: number } | null>(null);

  const firstName = profile?.name?.split(" ")[0] || "there";
  useAutoNarrate(() =>
    `Hey ${firstName}… this is your Learning DNA. It's a blueprint of how your brain learns best. Let me walk you through it.`,
    1200
  );

  useEffect(() => {
    if (!user) return;
    supabase.from("user_learning_metrics").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) {
        setMetrics(data);
        setEarliestMetrics({ retention: data[0].retention, confidence: data[0].confidence });
        setCurrentMetrics({ retention: data[data.length - 1].retention, confidence: data[data.length - 1].confidence });
      }
    });
  }, [user]);

  const handleToneChange = async (t: TJToneMode) => {
    setSelectedTone(t);
    if (user) await supabase.from("profiles").update({ tone_preference: t }).eq("id", user.id);
  };

  const dnaCode = profile?.tj_dna_code || "";
  const layerStrength = profile?.dna_layer_strength || "V";
  const dnaConfidence = profile?.dna_confidence;
  const dnaRetention = profile?.dna_retention;

  const confidenceLevel = useMemo(() => {
    if (!dnaConfidence) return "building";
    const c = dnaConfidence.charCodeAt(0) - 97;
    return c < 8 ? "building" : c < 17 ? "developing" : "strong";
  }, [dnaConfidence]);

  const retentionLevel = useMemo(() => {
    if (!dnaRetention) return "developing";
    const c = dnaRetention.charCodeAt(0) - 65;
    return c < 8 ? "building" : c < 17 ? "developing" : "strong";
  }, [dnaRetention]);

  const engagementLevel = useMemo(() => {
    const e = profile?.dna_engagement ?? 5;
    return e <= 3 ? "building" : e <= 6 ? "developing" : "strong";
  }, [profile?.dna_engagement]);

  const primaryStyle = STYLE_MAP[layerStrength] || STYLE_MAP.V;
  const PrimaryIcon = primaryStyle.icon;

  // ── How My Brain Learns ──
  const howMyBrainLearns = useMemo(() => {
    const methods: Record<string, { process: string; steps: string[] }> = {
      V: { process: "Your brain creates mental snapshots. When you SEE a concept visually, your visual cortex encodes it 60,000x faster than text alone.", steps: ["See an image or diagram first", "Connect the visual to the definition", "Build mental associations through color and shape", "Recall through visual memory"] },
      D: { process: "Your brain thrives on structure. When you ANALYZE and break things down logically, your prefrontal cortex builds strong neural pathways.", steps: ["Read the structured definition", "Break it into logical components", "Compare and contrast with known concepts", "Test through analytical questions"] },
      M: { process: "Your brain learns through emotional connection. When you FEEL a concept through story and metaphor, your limbic system locks it in.", steps: ["Hear a story or metaphor first", "Connect the concept to a real-life parallel", "Feel the emotional resonance", "Anchor the memory through that feeling"] },
      I: { process: "Your brain craves depth. When you UNDERSTAND the full context, your comprehension networks build rich, interconnected knowledge.", steps: ["Get the overview and context", "Dive deep into details and background", "Understand the 'why' behind the concept", "Connect to the broader field of knowledge"] },
      R: { process: "Your brain processes through introspection. When you REFLECT on what something means to YOU, your metacognitive systems create lasting memories.", steps: ["Take in the concept", "Pause and process internally", "Connect to personal experience", "Journal or express understanding in your own words"] },
      A: { process: "Your brain learns by doing. When you APPLY a concept to real scenarios, your motor and problem-solving centers activate together.", steps: ["See the concept briefly", "Jump into a real-world scenario", "Practice hands-on application", "Build muscle memory through repetition"] },
      K: { process: "Your brain needs movement and interaction. When you ENGAGE physically, your kinesthetic memory creates deep, body-based recall.", steps: ["Interact with the material physically", "Practice through simulations", "Use movement-based learning activities", "Test through hands-on demonstration"] },
      B: { process: "Your brain excels at deconstruction. When you BREAK IT DOWN into parts, your analytical processing builds understanding from the ground up.", steps: ["See the whole concept first", "Break it into etymological or structural parts", "Understand each component individually", "Reassemble with deeper understanding"] },
      N: { process: "Your brain is a pattern detector. When you RECOGNIZE concepts in context, your spatial memory and classification systems activate.", steps: ["Encounter the concept in context", "Identify patterns and categories", "Match and classify related ideas", "Test recognition through identification exercises"] },
    };
    return methods[layerStrength] || methods.V;
  }, [layerStrength]);

  // ── What Stops Me From Learning ──
  const whatStopsMe = useMemo(() => {
    const blockers: { blocker: string; why: string; signal: string }[] = [];
    if (confidenceLevel === "building") {
      blockers.push({ blocker: "Self-doubt", why: "When you're unsure, your brain activates stress responses that block the learning centers. You start second-guessing instead of absorbing.", signal: "You avoid hard questions or skip steps when it feels overwhelming." });
      blockers.push({ blocker: "Overwhelm", why: "Too much content at once floods your working memory. Your brain can only hold 4-7 items at a time.", signal: "You feel like nothing is sticking even though you're trying." });
    }
    if (retentionLevel === "building") {
      blockers.push({ blocker: "Fade-out", why: "Without regular review, your brain's forgetting curve erases new information within 24-48 hours.", signal: "You understood it yesterday but can't recall it today." });
      blockers.push({ blocker: "Passive studying", why: "Just reading or re-reading doesn't create strong neural pathways. Your brain needs active retrieval.", signal: "You spend time studying but don't feel prepared for tests." });
    }
    if (engagementLevel === "building") {
      blockers.push({ blocker: "Disconnection", why: "When content doesn't feel relevant or interactive, your brain's attention systems disengage.", signal: "You lose focus during long reading sections or zone out." });
    }
    if (blockers.length === 0) {
      blockers.push({ blocker: "You're handling challenges well!", why: "Your confidence, retention, and engagement are all developing or strong. Keep building on your momentum.", signal: "Watch for signs of plateau — that's when to push into deeper material." });
    }
    return blockers;
  }, [confidenceLevel, retentionLevel, engagementLevel]);

  // ── How To Combat It ──
  const combatStrategies = useMemo(() => {
    const strategies: { strategy: string; action: string }[] = [];
    if (confidenceLevel === "building") {
      strategies.push({ strategy: "Micro-wins first", action: "Start each session with something you already know. Build momentum before tackling new material." });
      strategies.push({ strategy: "Reframe mistakes", action: "Every wrong answer is data, not failure. TJ uses your mistakes to find exactly where to help." });
    }
    if (retentionLevel === "building") {
      strategies.push({ strategy: "Active recall", action: "Close the definition and try to say it in your own words before checking. This strengthens neural pathways." });
      strategies.push({ strategy: "Spaced repetition", action: "Review yesterday's terms before starting today's. Even 5 minutes of review doubles retention." });
    }
    if (engagementLevel === "building") {
      strategies.push({ strategy: "Anchor to purpose", action: "Before each study session, remind yourself WHY this matters for your career. Purpose drives focus." });
      strategies.push({ strategy: "Interactive first", action: "Start with quizzes or practice scenarios instead of reading. Movement keeps your brain engaged." });
    }
    if (strategies.length === 0) {
      strategies.push({ strategy: "Push your edge", action: "You're in a great place. Challenge yourself with harder material and deeper teaching modes." });
      strategies.push({ strategy: "Teach others", action: "Explaining concepts to someone else is the strongest form of learning. Try the Reflect step more deeply." });
    }
    return strategies;
  }, [confidenceLevel, retentionLevel, engagementLevel]);

  // ── My Learning Recovery Plan ──
  const recoveryPlan = useMemo(() => {
    const steps: { step: string; detail: string }[] = [];
    steps.push({ step: "Breathe and reset", detail: "Take a 30-second pause. Learning blocks are normal and temporary. You are not behind." });
    if (confidenceLevel === "building") {
      steps.push({ step: "Go to your strength", detail: `Open a ${primaryStyle.label.toLowerCase()} activity — your brain needs to feel capable before it can stretch.` });
      steps.push({ step: "Lower the difficulty", detail: "TJ automatically adjusts to guided mode when you're struggling. Trust the smaller steps." });
    } else {
      steps.push({ step: "Switch your approach", detail: "Try a different learning step — metaphor instead of definition, or apply instead of reflect." });
    }
    if (retentionLevel === "building") {
      steps.push({ step: "Review, don't push forward", detail: "Go back to your last mastered block and rebuild from there. Foundations matter more than speed." });
    }
    steps.push({ step: "Use TJ's voice", detail: "Let TJ read it to you. Sometimes hearing is easier than reading when you're mentally tired." });
    steps.push({ step: "Come back tomorrow", detail: "Sleep consolidates memory. A fresh session tomorrow will feel easier than pushing through tonight." });
    return steps;
  }, [confidenceLevel, retentionLevel, primaryStyle]);

  // ── How I Learn Best ──
  const howILearnBest = useMemo(() => {
    const methods: Record<string, string[]> = {
      V: ["Images and diagrams before text", "Color-coded notes and highlights", "Visual metaphors that paint a picture"],
      D: ["Step-by-step logical breakdowns", "Data, facts, and structured analysis", "Comparing and contrasting ideas"],
      M: ["Stories and real-life analogies", "Connecting new ideas to familiar ones", "Emotional associations with concepts"],
      I: ["Deep reading and expanded explanations", "Context and background information", "Understanding the 'why' behind concepts"],
      R: ["Journaling and self-reflection", "Quiet processing time after learning", "Connecting concepts to personal experience"],
      A: ["Hands-on practice and scenarios", "Real-world application exercises", "Learning by doing, not just reading"],
      K: ["Interactive activities and movement", "Practice labs and simulations", "Physical engagement with material"],
      B: ["Breaking words into roots and parts", "Understanding etymology and structure", "Deconstructing complex ideas"],
      N: ["Identifying concepts in context", "Pattern recognition exercises", "Matching and classification activities"],
    };
    return methods[layerStrength] || methods.V;
  }, [layerStrength]);

  // ── What Throws Me Off ──
  const whatThrowsMeOff = useMemo(() => {
    const issues: string[] = [];
    if (confidenceLevel === "building") issues.push("Feeling overwhelmed by too much content at once", "Self-doubt when facing difficult questions");
    if (retentionLevel === "building") issues.push("Forgetting concepts shortly after learning them", "Long gaps between study sessions");
    if (engagementLevel === "building") issues.push("Losing focus during long reading sections", "Content that doesn't feel interactive enough");
    if (issues.length === 0) issues.push("You're handling challenges well! Keep building on your strengths.");
    return issues;
  }, [confidenceLevel, retentionLevel, engagementLevel]);

  // ── Recommendations ──
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (confidenceLevel === "building") recs.push("Try the Practice Lab to build confidence through repetition");
    if (retentionLevel === "building") recs.push("Review your bookmarked terms before starting new material");
    recs.push("Complete your next study block to keep your streak going");
    if (layerStrength === "R") recs.push("Spend extra time on the Reflection step — it's your superpower");
    if (layerStrength === "A") recs.push("Jump into application scenarios — they'll click fastest for you");
    return recs.slice(0, 3);
  }, [confidenceLevel, retentionLevel, layerStrength]);

  // ── Human Translation ──
  const humanTranslation = useMemo(() => {
    const verbs: Record<string, string> = { V: "SEE it", D: "ANALYZE it", M: "CONNECT it to something familiar", I: "UNDERSTAND the deeper details", R: "REFLECT on what it means", A: "APPLY it to real scenarios", K: "PRACTICE it hands-on", B: "BREAK IT DOWN piece by piece", N: "RECOGNIZE it in context" };
    const verb = verbs[layerStrength] || "SEE it";
    const confLabel = confidenceLevel === "building" ? "Guided" : confidenceLevel === "developing" ? "Growing" : "Independent";
    return `You are a ${primaryStyle.label}-${confLabel} learner. You understand best when you ${verb}, then process it, then test yourself.`;
  }, [layerStrength, confidenceLevel, primaryStyle]);

  const identityAffirmation = useMemo(() => {
    const secondaryMap: Record<string, string> = { V: "Reflective", D: "Analytical", M: "Creative", I: "Deep-Thinker", R: "Introspective", A: "Practical", K: "Hands-On", B: "Systematic", N: "Pattern-Finder" };
    const secondary = secondaryMap[layerStrength] || "Reflective";
    return `You are a ${primaryStyle.label}-${secondary} learner. You understand through ${primaryStyle.label.toLowerCase()} input and master through ${secondary.toLowerCase()} processing.`;
  }, [layerStrength, primaryStyle]);

  // ── How TJ Uses My DNA ──
  const howTJUsesDNA = useMemo(() => [
    { area: "Lesson Order", detail: `Your ${primaryStyle.label} layer leads every lesson after the opening. TJ puts your strength first so concepts land faster.`, icon: ListOrdered },
    { area: "Teaching Tone", detail: rules.toneModifier === "supportive" ? "TJ speaks gently with extra encouragement because your confidence is still building." : rules.toneModifier === "challenging" ? "TJ pushes you harder because your confidence is high and you're ready for it." : "TJ uses a balanced, warm tone that supports without over-explaining.", icon: Mic },
    { area: "Content Depth", detail: rules.contentDepth === "brief" ? "Lessons are kept shorter and punchier to match your current engagement and retention levels." : rules.contentDepth === "deep" ? "TJ provides deeper, more detailed content because you can handle and retain more." : "Content depth is balanced — thorough but not overwhelming.", icon: BookOpen },
    { area: "Difficulty Level", detail: rules.difficulty === "guided" ? "Questions are simpler with hints. TJ breaks things into micro-steps so you can build confidence." : rules.difficulty === "challenge" ? "Questions are harder with fewer hints. TJ trusts you to handle the challenge." : "Standard difficulty with a mix of straightforward and thought-provoking questions.", icon: Target },
    { area: "Memory Support", detail: rules.addMemoryCues ? "Extra memory cues, repetition, and review prompts are woven into every lesson to help lock concepts in." : "Your retention is solid, so TJ moves efficiently without excessive repetition.", icon: Brain },
    { area: "Recovery Mode", detail: rules.microSteps ? "When you struggle, TJ switches to micro-steps — tiny, manageable pieces that rebuild your momentum." : "You rarely need recovery mode, but TJ is always ready to adapt if you hit a wall.", icon: HeartPulse },
  ], [primaryStyle, rules]);

  const stylePercentages = useMemo(() => {
    const base = { Visual: 25, Reflective: 25, Kinesthetic: 25, Analytical: 25 };
    const boostMap: Record<string, string> = { V: "Visual", R: "Reflective", K: "Kinesthetic", D: "Analytical", A: "Kinesthetic", M: "Visual", I: "Analytical" };
    const boost = boostMap[layerStrength] || "Visual";
    base[boost as keyof typeof base] += 20;
    const total = Object.values(base).reduce((s, v) => s + v, 0);
    return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round((v / total) * 100)]));
  }, [layerStrength]);

  const retentionGrowth = currentMetrics && earliestMetrics ? currentMetrics.retention - earliestMetrics.retention : 0;
  const confidenceGrowth = currentMetrics && earliestMetrics ? currentMetrics.confidence - earliestMetrics.confidence : 0;

  /* ── TTS Explainer ── */
  const EXPLAINER_TEXT = "You were never taught how your brain works. But your brain has a pattern, a fingerprint for learning. Your DNA shows how you learn. This system adapts to you. Every lesson, every quiz, every interaction is shaped by your learning DNA. Let's see who you are as a learner.";

  const playExplainer = useCallback(async () => {
    stopGlobalNarration();
    if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); return; }
    setIsPlaying(true); setHasPlayed(true);
    try {
      const audio = await fetchTTSWithFallback(EXPLAINER_TEXT, { usageType: "lesson" });
      if (audio) { audioRef.current = audio; audio.onended = () => setIsPlaying(false); await audio.play(); }
    } catch { setIsPlaying(false); }
  }, [isPlaying]);

  useEffect(() => { return () => { audioRef.current?.pause(); }; }, []);

  const segmentColors = [DNA_CHAR_INFO[0].color, DNA_CHAR_INFO[1].color, DNA_CHAR_INFO[2].color, DNA_CHAR_INFO[3].color];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full space-y-6">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(240 15% 10%), hsl(240 10% 16%))" }}>
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(42 70% 50%), hsl(25 65% 50%))" }}>
                <Brain className="h-12 w-12 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Your Learning DNA</h1>
              <p className="text-sm text-white/50">Your personal blueprint for how your brain learns best</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={playExplainer} variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                  {isPlaying ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {hasPlayed ? "Resume" : "Listen"}</>}
                </Button>
                <Button onClick={() => { setShowTutorial(true); setTutorialStep(0); }} variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                  <Compass className="h-4 w-4" /> DNA Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Guided Progress Bar ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Your DNA Journey</p>
                <p className="text-xs font-bold text-primary">{viewedCount} of {totalSections} sections</p>
              </div>
              <Progress value={guideProgress} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {viewedCount < totalSections
                  ? "Tap each section in order — don't skip. Every part of your DNA matters."
                  : "You've explored every section of your DNA. Powerful work."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Tutorial Flow ── */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Card className="border-0 shadow-xl" style={{ background: `${TUTORIAL_STEPS[tutorialStep].color}08`, border: `2px solid ${TUTORIAL_STEPS[tutorialStep].color}30` }}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => { const TIcon = TUTORIAL_STEPS[tutorialStep].icon; return <TIcon className="h-5 w-5" style={{ color: TUTORIAL_STEPS[tutorialStep].color }} />; })()}
                      <h3 className="font-display text-base font-bold" style={{ color: TUTORIAL_STEPS[tutorialStep].color }}>
                        {TUTORIAL_STEPS[tutorialStep].title}
                      </h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{tutorialStep + 1} of {TUTORIAL_STEPS.length}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{TUTORIAL_STEPS[tutorialStep].content}</p>
                  <SpeakButton text={TUTORIAL_STEPS[tutorialStep].content} size="sm" label="Listen" />
                  <div className="flex items-center justify-between pt-2">
                    <Button size="sm" variant="ghost" onClick={() => tutorialStep > 0 ? setTutorialStep(s => s - 1) : setShowTutorial(false)} className="text-muted-foreground">
                      {tutorialStep > 0 ? "← Back" : "Close"}
                    </Button>
                    <div className="flex gap-1.5">
                      {TUTORIAL_STEPS.map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i === tutorialStep ? TUTORIAL_STEPS[tutorialStep].color : "hsl(var(--muted))" }} />
                      ))}
                    </div>
                    {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                      <Button size="sm" onClick={() => setTutorialStep(s => s + 1)} style={{ background: TUTORIAL_STEPS[tutorialStep].color, color: "white" }}>
                        Next →
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setShowTutorial(false)} style={{ background: TUTORIAL_STEPS[tutorialStep].color, color: "white" }}>
                        Done ✓
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 1: What Is Your Learning DNA? (Primer) ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-md bg-card overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "hsl(265 60% 50% / 0.12)", color: "hsl(265 60% 50%)" }}>Step 1</span>
                <h2 className="font-display text-lg font-bold text-foreground">What is your Learning DNA?</h2>
              </div>
              <ReadAlongText
                text="Your Learning DNA is a 4-character code that describes how your brain learns best. It's made up of four parts: your strongest layer, how engaged you stay, how well you remember, and how confident you feel. TJ reads this code before every lesson and adjusts the order, depth, tone, and difficulty to match you exactly."
                textClassName="text-sm text-foreground leading-relaxed"
                usageType="lesson"
              />

              {/* Explain each segment */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">The 4 segments of every DNA code</p>
                {LEGEND_ITEMS.map((item, i) => (
                  <div key={item.segment} className="flex items-start gap-3 p-3 rounded-xl bg-secondary">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: segmentColors[i] }}>{item.segment}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{item.example}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Explain the styles */}
              <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Possible learning styles (Layer Strength)</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STYLE_MAP).slice(0, 6).map(([key, s]) => {
                    const SIcon = s.icon;
                    return (
                      <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                          <SIcon className="h-3.5 w-3.5" style={{ color: s.color }} />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-center pt-1 text-muted-foreground">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── STEP 2: Your DNA Type (and WHY) ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryStyle.color}12, ${primaryStyle.color}04)`, border: `2px solid ${primaryStyle.color}30` }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${primaryStyle.color}20`, color: primaryStyle.color }}>Step 2</span>
                <h2 className="font-display text-lg font-bold text-foreground">Your DNA Type</h2>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-background/60 backdrop-blur">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: primaryStyle.color }}>
                  <PrimaryIcon className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">You are a</p>
                  <p className="font-display text-2xl font-bold leading-tight" style={{ color: primaryStyle.color }}>{primaryStyle.label} Learner</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Why this is your type</p>
                <ReadAlongText
                  text={`Based on how you answered your onboarding quiz, your brain showed the strongest signal for ${primaryStyle.label.toLowerCase()} processing. ${howMyBrainLearns.process}`}
                  textClassName="text-sm text-foreground leading-relaxed"
                  usageType="lesson"
                />
              </div>
              <div className="p-3 rounded-xl" style={{ background: `${primaryStyle.color}10` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: primaryStyle.color }}>✨ Identity</p>
                <p className="text-sm text-foreground leading-relaxed italic">{identityAffirmation}</p>
              </div>
              <div className="flex items-center justify-center pt-1 text-muted-foreground">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── STEP 3: Your DNA Code ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-md bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "hsl(42 70% 50% / 0.15)", color: "hsl(42 70% 40%)" }}>Step 3</span>
                  <h2 className="font-display text-lg font-bold text-foreground">Your DNA Code</h2>
                </div>
                <SpeakButton text={humanTranslation} size="sm" label="Listen" />
              </div>
              <p className="text-[10px] text-center text-muted-foreground font-mono mb-2 tracking-widest">[ L ] [ E ] [ R ] [ C ]</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                {dnaCode.split("").map((char, i) => {
                  const info = DNA_CHAR_INFO[i];
                  const isExpanded = expandedChar === i;
                  return (
                    <button key={i} onClick={() => setExpandedChar(isExpanded ? null : i)} className="relative group transition-all duration-200">
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-display text-2xl font-bold text-white transition-all ${isExpanded ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                        style={{ background: info?.color || primaryStyle.color }}>
                        {char}
                        <span className="text-[8px] font-normal opacity-70 mt-0.5">{info?.label?.split(" ")[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence>
                {expandedChar !== null && dnaCode[expandedChar] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 rounded-xl mb-4 space-y-3" style={{ background: `${DNA_CHAR_INFO[expandedChar]?.color}08`, border: `1.5px solid ${DNA_CHAR_INFO[expandedChar]?.color}25` }}>
                      {[
                        { label: "What this means", text: DNA_CHAR_INFO[expandedChar]?.getDescription(dnaCode[expandedChar]) },
                        { label: "What TJ changes because of it", text: DNA_CHAR_INFO[expandedChar]?.getWhatTJChanges(dnaCode[expandedChar]) },
                        { label: "What you'll notice in lessons", text: DNA_CHAR_INFO[expandedChar]?.getWhatYouNotice(dnaCode[expandedChar]) },
                      ].map(({ label, text }) => (
                        <div key={label}>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm leading-relaxed text-foreground">{text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-xs text-muted-foreground text-center mb-4">Tap any code block to learn what it means</p>
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">🧬 Human Translation</p>
                <p className="text-sm text-foreground leading-relaxed font-medium">{humanTranslation}</p>
              </div>
              <div className="flex items-center justify-center pt-3 text-muted-foreground">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── STEP 4: How TJ + Layer Method™ Strengthen Your Weaknesses ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(145 55% 40% / 0.08), hsl(215 70% 50% / 0.05))", border: "2px solid hsl(145 55% 40% / 0.25)" }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "hsl(145 55% 40% / 0.15)", color: "hsl(145 55% 30%)" }}>Step 4</span>
                <h2 className="font-display text-lg font-bold text-foreground">How TJ Strengthens Your Weaknesses</h2>
              </div>
              <ReadAlongText
                text="The TJ Anderson Layer Method™ and your DNA code talk to each other constantly. Every quiz, reflection, and lesson updates your code in real time. When a weakness improves, you'll see a green badge appear here."
                textClassName="text-sm text-foreground leading-relaxed"
                usageType="lesson"
              />

              {/* Weakness → Action mapping with improvement badges */}
              <div className="space-y-2 pt-1">
                {[
                  {
                    label: "Confidence", level: confidenceLevel, growth: confidenceGrowth, color: "hsl(215 70% 50%)",
                    weakness: confidenceLevel === "building" ? "You sometimes doubt yourself before answering." : confidenceLevel === "developing" ? "You're growing more sure of yourself." : "You trust yourself in most situations.",
                    action: confidenceLevel === "building"
                      ? "TJ uses a softer voice, smaller steps, and starts every lesson with something you already know — building micro-wins."
                      : confidenceLevel === "developing"
                      ? "TJ balances support with stretch — gently pushing you into harder material when you're ready."
                      : "TJ removes hand-holding and challenges you with harder questions and deeper material.",
                  },
                  {
                    label: "Retention", level: retentionLevel, growth: retentionGrowth, color: "hsl(145 55% 40%)",
                    weakness: retentionLevel === "building" ? "Concepts can fade within a day or two." : retentionLevel === "developing" ? "You hold most concepts but lose detail under pressure." : "Your memory locks information in well.",
                    action: retentionLevel === "building"
                      ? "TJ adds extra memory cues, mnemonics, and spaced reviews of yesterday's terms before today's lesson."
                      : retentionLevel === "developing"
                      ? "TJ weaves in periodic memory anchors and review prompts at smart intervals."
                      : "TJ skips repetition and moves you efficiently through new material.",
                  },
                  {
                    label: "Engagement", level: engagementLevel, growth: 0, color: "hsl(42 70% 50%)",
                    weakness: engagementLevel === "building" ? "Long reading sections cause you to drift." : engagementLevel === "developing" ? "You stay focused with the right pacing." : "You can lock in for long, deep sessions.",
                    action: engagementLevel === "building"
                      ? "TJ shortens content blocks, adds interactive checkpoints, and uses voice narration to keep your attention."
                      : engagementLevel === "developing"
                      ? "TJ uses a balanced mix of reading, listening, and doing to maintain steady focus."
                      : "TJ gives you longer, deeper content blocks with fewer interruptions.",
                  },
                ].map((m) => (
                  <div key={m.label} className="p-4 rounded-xl bg-background/60 backdrop-blur space-y-2" style={{ border: `1px solid ${m.color}25` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                        <p className="text-sm font-bold text-foreground">{m.label}</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize" style={{ background: `${m.color}15`, color: m.color }}>{m.level}</span>
                      </div>
                      {m.growth > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: m.color, color: "white" }}>
                          <TrendingUp className="h-3 w-3" /> +{m.growth}% improved
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weakness</p>
                      <p className="text-xs text-foreground leading-snug">{m.weakness}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: m.color }}>How TJ + Layer Method™ help</p>
                      <p className="text-xs text-foreground leading-snug">{m.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: "hsl(265 60% 50% / 0.08)", border: "1px solid hsl(265 60% 50% / 0.2)" }}>
                <Wand2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(265 60% 50%)" }} />
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-bold">Live sync:</span> Your DNA code recalibrates after every quiz, reflection, and lesson. When a weakness improves, you'll see a green badge here — and TJ will adjust automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Deep Dive Divider ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deep Dive</p>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Explore each part of your DNA in detail below</p>
        </motion.div>

        {/* ── Legend (collapsible) ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-4">
              <Collapsible open={showLegend} onOpenChange={setShowLegend}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between text-xs text-foreground font-medium">
                    <span>DNA Legend Reference</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showLegend ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 p-4 rounded-xl bg-secondary space-y-2">
                    {LEGEND_ITEMS.map((item, i) => (
                      <div key={item.segment} className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: segmentColors[i] }}>{item.segment}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{item.label} <span className="font-normal text-muted-foreground">({item.format})</span></p>
                          <p className="text-[11px] text-muted-foreground">{item.example}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 1. How My Brain Learns ── */}
        <SectionCard icon={Brain} iconColor="hsl(265 60% 50%)" title="How My Brain Learns" delay={0.25} id="brain" {...sharedSectionProps}>
          <div className="p-4 rounded-xl bg-secondary mb-4">
            <ReadAlongText
              text={howMyBrainLearns.process}
              textClassName="text-sm text-foreground"
              usageType="lesson"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your natural learning sequence:</p>
          <div className="space-y-2">
            {howMyBrainLearns.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: i === 0 ? `${primaryStyle.color}10` : "transparent" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: i === 0 ? primaryStyle.color : "hsl(var(--muted-foreground))" }}>{i + 1}</span>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── 2. What Stops Me From Learning ── */}
        <SectionCard icon={AlertTriangle} iconColor="hsl(25 70% 50%)" title="What Stops Me From Learning" delay={0.3} id="stops" {...sharedSectionProps}>
          <div className="space-y-3">
            {whatStopsMe.map((item, i) => (
              <Collapsible key={i}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-secondary" style={{ background: "hsl(25 60% 97%)", border: "1px solid hsl(25 40% 90%)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚠️</span>
                      <p className="text-sm font-medium text-foreground">{item.blocker}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 py-3 space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why this happens</p>
                      <p className="text-sm text-foreground leading-relaxed">{item.why}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">How to spot it</p>
                      <p className="text-sm text-foreground leading-relaxed">{item.signal}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </SectionCard>

        {/* ── 3. How To Combat It ── */}
        <SectionCard icon={Shield} iconColor="hsl(145 55% 40%)" title="How To Combat It" delay={0.35} id="combat" {...sharedSectionProps}>
          <div className="space-y-3">
            {combatStrategies.map((item, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(145 40% 96%)", border: "1px solid hsl(145 30% 88%)" }}>
                <p className="text-sm font-semibold text-foreground mb-1">💪 {item.strategy}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.action}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── 4. My Learning Recovery Plan ── */}
        <SectionCard icon={HeartPulse} iconColor="hsl(320 55% 48%)" title="My Learning Recovery Plan" delay={0.4} id="recovery" {...sharedSectionProps}>
          <p className="text-xs text-muted-foreground mb-3">When you feel stuck, overwhelmed, or lost — follow these steps:</p>
          <div className="space-y-2">
            {recoveryPlan.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: i === 0 ? "hsl(320 30% 96%)" : "transparent" }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: i === 0 ? "hsl(320 55% 48%)" : "hsl(var(--muted-foreground))" }}>{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.step}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <SpeakButton text={recoveryPlan.map(s => `${s.step}. ${s.detail}`).join(". ")} size="sm" label="Listen to recovery plan" />
          </div>
        </SectionCard>

        {/* ── 5. My Progression ── */}
        <SectionCard icon={TrendingUp} iconColor="hsl(145 55% 40%)" title="My Progression" delay={0.45} id="progression" {...sharedSectionProps}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Retention", level: retentionLevel, growth: retentionGrowth, color: "hsl(145 55% 40%)" },
              { label: "Confidence", level: confidenceLevel, growth: confidenceGrowth, color: "hsl(215 70% 50%)" },
              { label: "Engagement", level: engagementLevel, growth: 0, color: "hsl(42 70% 50%)" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-xl bg-secondary text-center">
                <p className="text-lg font-display font-bold" style={{ color: m.color }}>
                  {m.growth > 0 ? `+${m.growth}%` : m.level === "strong" ? "✓" : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 capitalize">{m.label}</p>
                <p className="text-[9px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${m.color}15`, color: m.color }}>{m.level}</p>
              </div>
            ))}
          </div>
          {/* Visual progress bars */}
          <div className="space-y-3">
            {Object.entries(stylePercentages).map(([style, pct]) => {
              const colors: Record<string, string> = { Visual: "hsl(215 70% 50%)", Reflective: "hsl(0 55% 50%)", Kinesthetic: "hsl(145 55% 38%)", Analytical: "hsl(275 55% 50%)" };
              const icons: Record<string, any> = { Visual: Eye, Reflective: PenLine, Kinesthetic: Zap, Analytical: Brain };
              const Icon = icons[style] || Eye;
              return (
                <div key={style}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" style={{ color: colors[style] }} />
                      <span className="text-xs font-medium text-foreground">{style}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: colors[style] }}>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
          {!earliestMetrics && <p className="text-xs text-muted-foreground text-center py-3">Start learning to see your growth over time</p>}
        </SectionCard>

        {/* ── 6. How TJ Uses My DNA ── */}
        <SectionCard icon={Compass} iconColor="hsl(320 55% 48%)" title="How TJ Uses My DNA" delay={0.5} id="tj-uses" {...sharedSectionProps}>
          <div className="space-y-3">
            {howTJUsesDNA.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--secondary))" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `hsl(320 55% 48% / 0.1)` }}>
                    <ItemIcon className="h-4 w-4" style={{ color: "hsl(320 55% 48%)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.area}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── My DNA Type ── */}
        <SectionCard icon={PrimaryIcon} iconColor={primaryStyle.color} title="My DNA Type" delay={0.55} id="type" {...sharedSectionProps}>
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${primaryStyle.color}10` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: primaryStyle.color }}>
              <PrimaryIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold" style={{ color: primaryStyle.color }}>{primaryStyle.label} Learner</p>
              <p className="text-xs text-muted-foreground">Your brain processes {primaryStyle.label.toLowerCase()} information fastest</p>
            </div>
          </div>
        </SectionCard>

        {/* ── How I Learn Best ── */}
        <SectionCard icon={Lightbulb} iconColor="hsl(42 70% 50%)" title="How I Learn Best" delay={0.6} id="best" {...sharedSectionProps}>
          <div className="space-y-2">
            {howILearnBest.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary">
                <span className="text-xs font-bold mt-0.5" style={{ color: primaryStyle.color }}>{i + 1}.</span>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── What Throws Me Off ── */}
        <SectionCard icon={AlertTriangle} iconColor="hsl(25 70% 50%)" title="What Throws Me Off" delay={0.65} id="throws" {...sharedSectionProps}>
          <div className="space-y-2">
            {whatThrowsMeOff.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(25 60% 97%)" }}>
                <span className="text-sm mt-0.5">⚠️</span>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── TJ Recommends Next ── */}
        <SectionCard icon={Target} iconColor="hsl(145 55% 40%)" title="TJ Recommends Next" delay={0.7} id="next" {...sharedSectionProps}>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(145 40% 96%)" }}>
                <span className="text-sm mt-0.5">→</span>
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Best Study Order ── */}
        <SectionCard icon={ListOrdered} iconColor="hsl(265 60% 50%)" title="Best Study Order for Me" delay={0.75} id="order" {...sharedSectionProps}>
          <p className="text-xs text-muted-foreground mb-3">TJ reorders every lesson to match your DNA. Here's your personalized sequence:</p>
          <div className="space-y-1.5">
            {rules.stepOrder.map((stepKey, i) => {
              const stepLabels: Record<string, string> = { visual: "Visualize", definition: "Define", scripture: "Scripture", breakdown: "Break It Down", recognize: "Recognize", metaphor: "Metaphor", information: "Information", reflection: "Reflect", application: "Apply", quiz: "Assess" };
              return (
                <div key={stepKey} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: i < 2 ? `${primaryStyle.color}10` : "transparent" }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: i < 2 ? primaryStyle.color : "hsl(var(--muted-foreground))" }}>{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{stepLabels[stepKey] || stepKey}</span>
                  {i === 1 && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${primaryStyle.color}20`, color: primaryStyle.color }}>Your strength</span>}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ── TJ Tone Selector ── */}
        <SectionCard icon={Mic} iconColor={toneProfile.color} title="TJ's Teaching Style" delay={0.8} id="tone" {...sharedSectionProps}>
          <p className="text-xs text-muted-foreground mb-4">Choose how TJ speaks to you throughout the app</p>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(TJ_TONES) as [TJToneMode, typeof TJ_TONES[TJToneMode]][]).map(([key, t]) => (
              <button key={key} onClick={() => handleToneChange(key)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{ background: selectedTone === key ? `${t.color}12` : "transparent", border: selectedTone === key ? `2px solid ${t.color}` : "2px solid transparent" }}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: selectedTone === key ? t.color : "hsl(var(--foreground))" }}>{t.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                {selectedTone === key && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: t.color, color: "white" }}>Active</span>}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Micro signals */}
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "hsl(145 40% 92%)", color: "hsl(145 50% 30%)" }}>Retention: {retentionLevel}</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "hsl(215 40% 92%)", color: "hsl(215 50% 30%)" }}>Confidence: {confidenceLevel}</span>
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "hsl(42 40% 92%)", color: "hsl(42 50% 30%)" }}>Engagement: {engagementLevel}</span>
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default LearningDNAPage;
