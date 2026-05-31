import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, BookOpen, Gauge, Shuffle, ListChecks, Timer, GraduationCap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FlashcardDeck from "@/components/rapid-mastery/FlashcardDeck";
import MatchingBoard from "@/components/rapid-mastery/MatchingBoard";
import MultipleChoiceRunner from "@/components/rapid-mastery/MultipleChoiceRunner";
import TimedChallenge from "@/components/rapid-mastery/TimedChallenge";
import StateBoardPrep from "@/components/rapid-mastery/StateBoardPrep";

interface RapidTerm {
  id: string;
  term: string;
  definition: string;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  quiz_answer?: string | null;
  section_id?: string | null;
  block_number?: number | null;
}

type ChallengeKey = "flash" | "speed" | "match" | "mastery" | "sprint" | "board";

const CHALLENGES: {
  key: ChallengeKey;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  { key: "flash",   label: "Flashcards",            desc: "Flip · recall · rate",        icon: BookOpen,       accent: "hsl(var(--violet))" },
  { key: "speed",   label: "Speed Recall",          desc: "Type the term fast",          icon: Gauge,          accent: "hsl(var(--gold))" },
  { key: "match",   label: "Match the Definition",  desc: "Pair terms to meanings",      icon: Shuffle,        accent: "hsl(285 55% 45%)" },
  { key: "mastery", label: "Mastery Quiz",          desc: "10 state-board questions",    icon: ListChecks,     accent: "hsl(200 65% 45%)" },
  { key: "sprint",  label: "5-Minute Sprint",       desc: "How many can you answer?",    icon: Timer,          accent: "hsl(345 70% 55%)" },
  { key: "board",   label: "State Board Simulation",desc: "25 mixed exam questions",     icon: GraduationCap,  accent: "hsl(145 50% 38%)" },
];

// Always-available demo set so the screen is never empty.
const DEMO_TERMS: RapidTerm[] = [
  { id: "demo-1", term: "Epidermis",      definition: "The outermost protective layer of the skin." },
  { id: "demo-2", term: "Dermis",         definition: "The middle layer of skin containing collagen, elastin, and blood vessels." },
  { id: "demo-3", term: "Melanocyte",     definition: "A cell in the epidermis that produces melanin, the pigment that colors skin." },
  { id: "demo-4", term: "Sebaceous Gland",definition: "An oil-producing gland that lubricates skin and hair." },
  { id: "demo-5", term: "Stratum Corneum",definition: "The outermost sublayer of the epidermis made of dead, keratinized cells." },
  { id: "demo-6", term: "Keratin",        definition: "A fibrous protein that gives strength to skin, hair, and nails." },
  { id: "demo-7", term: "Subcutaneous",   definition: "The deepest layer of skin, made of fat and connective tissue." },
  { id: "demo-8", term: "Collagen",       definition: "A protein in the dermis that gives skin its firmness and structure." },
];

export default function RapidMasteryPage() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<RapidTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ChallengeKey | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("terms")
        .select("id, term, definition, quiz_question, quiz_options, quiz_answer, section_id, block_number")
        .limit(500);
      const cleaned = (data ?? [])
        .filter((t: any) => t.term && t.definition)
        .map((t: any) => ({
          ...t,
          quiz_options: Array.isArray(t.quiz_options) ? t.quiz_options : null,
        })) as RapidTerm[];
      setTerms(cleaned);
      setLoading(false);
    })();
  }, []);

  const playable = useMemo(() => (terms.length > 0 ? terms : DEMO_TERMS), [terms]);

  const activeChallenge = CHALLENGES.find((c) => c.key === active);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, hsl(var(--cream)), hsl(var(--plum-soft, var(--cream))))" }}
    >
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => (active ? setActive(null) : navigate("/"))}
          className="mb-4 gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {active ? "Choose another challenge" : "Dashboard"}
        </Button>

        <header className="text-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ background: "hsl(var(--gold) / 0.18)", color: "hsl(var(--gold))" }}
          >
            <Zap className="h-3 w-3" /> Rapid Mastery™
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "hsl(var(--plum))" }}>
            {active ? activeChallenge?.label : "Choose Your Challenge"}
          </h1>
          <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: "hsl(var(--plum) / 0.75)" }}>
            {active
              ? activeChallenge?.desc
              : "Pick a mode and start answering immediately. No setup. No empty screens."}
          </p>
          {terms.length === 0 && !loading && (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] font-bold" style={{ color: "hsl(var(--gold))" }}>
              Demo set loaded · Skin Structure
            </p>
          )}
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading your terms…</p>
        ) : !active ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHALLENGES.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setActive(ch.key)}
                className="text-left p-5 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-0.5"
                style={{ borderColor: `${ch.accent}33` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ch.accent}1F`, color: ch.accent, boxShadow: `0 0 16px ${ch.accent}33` }}
                  >
                    <ch.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg" style={{ color: "hsl(var(--plum))" }}>
                    {ch.label}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{ch.desc}</p>
                <div className="mt-3 text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: ch.accent }}>
                  Begin →
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Card className="p-5 border-border/60">
            {active === "flash"   && <FlashcardDeck terms={playable} />}
            {active === "speed"   && <FlashcardDeck terms={playable} />}
            {active === "match"   && <MatchingBoard terms={playable} />}
            {active === "mastery" && <MultipleChoiceRunner terms={playable} limit={10} />}
            {active === "sprint"  && <TimedChallenge terms={playable} />}
            {active === "board"   && <StateBoardPrep terms={playable} />}
          </Card>
        )}

        <footer className="mt-12 text-center text-[11px] text-muted-foreground">
          © Tionna Anderson · Rapid Mastery™ · TJ Anderson Layer Method™
        </footer>
      </main>
    </div>
  );
}
