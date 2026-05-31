import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Zap, BookOpen, Shuffle, ListChecks, Timer, GraduationCap, CheckCircle2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FlashcardDeck from "@/components/rapid-mastery/FlashcardDeck";
import MatchingBoard from "@/components/rapid-mastery/MatchingBoard";
import MultipleChoiceRunner from "@/components/rapid-mastery/MultipleChoiceRunner";
import TimedChallenge from "@/components/rapid-mastery/TimedChallenge";
import StateBoardPrep from "@/components/rapid-mastery/StateBoardPrep";
import ProgressCheckpoint from "@/components/rapid-mastery/ProgressCheckpoint";

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

const MODES = [
  { key: "flash",    label: "Flashcards",   icon: BookOpen,       desc: "Flip · recall" },
  { key: "match",    label: "Matching",     icon: Shuffle,        desc: "Pair terms" },
  { key: "mcq",      label: "Multiple Choice", icon: ListChecks,  desc: "State-board format" },
  { key: "timed",    label: "Timed Sprint", icon: Timer,          desc: "60-second drill" },
  { key: "board",    label: "State Board Prep", icon: GraduationCap, desc: "25 mixed questions" },
  { key: "check",    label: "Checkpoint",   icon: CheckCircle2,   desc: "3-question mini-check" },
] as const;

export default function RapidMasteryPage() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<RapidTerm[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Button>

        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em] font-semibold mb-3">
            <Zap className="h-3 w-3" /> Learn &amp; Practice
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Rapid Mastery</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Drill, recall, and pass the exam. Every screen has one thing to do — answer, match, or rate.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading your terms…</p>
        ) : terms.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No terms found yet. Start a section to populate Rapid Mastery.</p>
          </Card>
        ) : (
          <Tabs defaultValue="flash" className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 mb-5">
              {MODES.map((m) => (
                <TabsTrigger
                  key={m.key}
                  value={m.key}
                  className="flex flex-col items-center gap-1 py-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <m.icon className="h-4 w-4" />
                  <span className="font-semibold">{m.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="flash">
              <FlashcardDeck terms={terms} />
            </TabsContent>
            <TabsContent value="match">
              <MatchingBoard terms={terms} />
            </TabsContent>
            <TabsContent value="mcq">
              <MultipleChoiceRunner terms={terms} limit={10} />
            </TabsContent>
            <TabsContent value="timed">
              <TimedChallenge terms={terms} />
            </TabsContent>
            <TabsContent value="board">
              <StateBoardPrep terms={terms} />
            </TabsContent>
            <TabsContent value="check">
              <ProgressCheckpoint terms={terms} />
            </TabsContent>
          </Tabs>
        )}

        <footer className="mt-12 text-center text-[11px] text-muted-foreground">
          © Tionna Anderson · Learn &amp; Practice — Rapid Mastery
        </footer>
      </main>
    </div>
  );
}
